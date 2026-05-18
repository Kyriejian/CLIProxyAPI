import type { Request, Response } from 'express';
import { ProviderRegistry, ProviderEntry } from './providers/registry.js';
import { ModelRegistry } from './models/registry.js';
import { RequestLogger } from './middleware/logger.js';
import { toOpenAIModelsResponse, createOpenAIErrorResponse } from './translator/openai.js';
import { openaiToAnthropic, anthropicToOpenai } from './translator/anthropic.js';
import { openaiToGemini, geminiToOpenai } from './translator/gemini.js';
import { AnthropicStreamTranslator, GeminiStreamTranslator } from './translator/stream.js';
import type { OpenAIChatRequest } from './translator/openai.js';

interface RouterConfig {
  strategy: 'round-robin' | 'priority' | 'least-used' | 'random';
  rtkCompression: boolean;
  maxRetries: number;
}

export class ProxyRouter {
  private providerRegistry: ProviderRegistry;
  private modelRegistry: ModelRegistry;
  private logger: RequestLogger;
  private config: RouterConfig;

  constructor(
    providerRegistry: ProviderRegistry,
    modelRegistry: ModelRegistry,
    logger: RequestLogger,
    config: RouterConfig
  ) {
    this.providerRegistry = providerRegistry;
    this.modelRegistry = modelRegistry;
    this.logger = logger;
    this.config = config;
  }

  async handleChatCompletion(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const body = req.body as OpenAIChatRequest;
    const modelName = body.model;

    if (!modelName) {
      res.status(400).json(createOpenAIErrorResponse('model is required', 'invalid_request'));
      return;
    }

    const provider = this.findProvider(modelName);
    if (!provider) {
      res.status(404).json(createOpenAIErrorResponse(`No provider found for model: ${modelName}`, 'model_not_found'));
      return;
    }

    let retries = 0;
    let lastError: Error | null = null;

    while (retries <= this.config.maxRetries) {
      try {
        const targetProvider = retries === 0 ? provider : this.findFallbackProvider(modelName, provider.id);
        if (!targetProvider) {
          if (lastError) throw lastError;
          throw new Error(`No fallback provider available for ${modelName}`);
        }

        await this.forwardToProvider(targetProvider, body, req, res);

        this.logger.log({
          method: 'POST',
          path: '/v1/chat/completions',
          model: modelName,
          provider: targetProvider.name,
          status: 200,
          latencyMs: Date.now() - startTime,
          inputTokens: 0,
          outputTokens: 0,
        });
        return;
      } catch (err) {
        lastError = err as Error;
        retries++;
        if (retries <= this.config.maxRetries) {
          console.log(`Retry ${retries}/${this.config.maxRetries} for ${modelName}: ${(err as Error).message}`);
        }
      }
    }

    this.logger.log({
      method: 'POST',
      path: '/v1/chat/completions',
      model: modelName,
      provider: provider.name,
      status: 502,
      latencyMs: Date.now() - startTime,
      inputTokens: 0,
      outputTokens: 0,
      error: lastError?.message,
    });

    res.status(502).json(createOpenAIErrorResponse(
      `All providers failed for model ${modelName}: ${lastError?.message}`,
      'upstream_error'
    ));
  }

  handleListModels(_req: Request, res: Response): void {
    const models = this.modelRegistry.getAvailable();
    res.json(toOpenAIModelsResponse(models));
  }

  async handleEmbeddings(req: Request, res: Response): Promise<void> {
    res.status(501).json(createOpenAIErrorResponse('Embeddings endpoint not yet implemented', 'not_implemented'));
  }

  async handleAnthropicMessages(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const body = req.body;
    const modelName = body.model;

    if (!modelName) {
      res.status(400).json({ type: 'error', error: { type: 'invalid_request_error', message: 'model is required' } });
      return;
    }

    const provider = this.findProvider(modelName);
    if (!provider) {
      res.status(404).json({ type: 'error', error: { type: 'not_found_error', message: `No provider found for model: ${modelName}` } });
      return;
    }

    try {
      await this.forwardToProvider(provider, body, req, res);
      this.logger.log({
        method: 'POST',
        path: '/v1/messages',
        model: modelName,
        provider: provider.name,
        status: 200,
        latencyMs: Date.now() - startTime,
        inputTokens: 0,
        outputTokens: 0,
      });
    } catch (err) {
      this.logger.log({
        method: 'POST',
        path: '/v1/messages',
        model: modelName,
        provider: provider.name,
        status: 502,
        latencyMs: Date.now() - startTime,
        inputTokens: 0,
        outputTokens: 0,
        error: (err as Error).message,
      });
      res.status(502).json({ type: 'error', error: { type: 'api_error', message: (err as Error).message } });
    }
  }

  async testProvider(providerId: string): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    const provider = this.providerRegistry.get(providerId);
    if (!provider) {
      return { success: false, latencyMs: 0, error: 'Provider not found' };
    }

    const startTime = Date.now();
    try {
      const testReq: OpenAIChatRequest = {
        model: provider.models[0]?.name ?? 'test',
        messages: [{ role: 'user', content: 'Say "hello" in one word.' }],
        max_tokens: 10,
        stream: false,
      };

      const url = this.buildUpstreamUrl(provider, testReq);
      const headers = this.buildUpstreamHeaders(provider);
      const body = this.translateRequest(provider, testReq);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });

      const latencyMs = Date.now() - startTime;
      if (response.ok) {
        return { success: true, latencyMs };
      }
      const errorText = await response.text();
      return { success: false, latencyMs, error: `HTTP ${response.status}: ${errorText.slice(0, 200)}` };
    } catch (err) {
      return { success: false, latencyMs: Date.now() - startTime, error: (err as Error).message };
    }
  }

  private findProvider(modelName: string): ProviderEntry | undefined {
    const prefixMatch = modelName.match(/^([^/]+)\//);
    if (prefixMatch) {
      const providerName = prefixMatch[1];
      const provider = this.providerRegistry.getByName(providerName);
      if (provider?.enabled) return provider;
    }

    for (const provider of this.providerRegistry.getActive().sort((a, b) => a.priority - b.priority)) {
      const hasModel = provider.models.some(m =>
        m.name === modelName || m.alias === modelName || m.id === modelName
      );
      if (hasModel) return provider;
    }

    return this.providerRegistry.getActive().sort((a, b) => a.priority - b.priority)[0];
  }

  private findFallbackProvider(modelName: string, excludeId: string): ProviderEntry | undefined {
    const providers = this.providerRegistry.getActive()
      .filter(p => p.id !== excludeId)
      .sort((a, b) => a.priority - b.priority);

    for (const provider of providers) {
      const hasModel = provider.models.some(m =>
        m.name === modelName || m.alias === modelName
      );
      if (hasModel) return provider;
    }

    return providers[0];
  }

  private async forwardToProvider(
    provider: ProviderEntry,
    body: OpenAIChatRequest,
    _req: Request,
    res: Response
  ): Promise<void> {
    const url = this.buildUpstreamUrl(provider, body);
    const headers = this.buildUpstreamHeaders(provider);
    const translatedBody = this.translateRequest(provider, body);

    const isStreaming = body.stream === true;

    const upstreamResponse = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(translatedBody),
    });

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();
      throw new Error(`Provider ${provider.name} returned ${upstreamResponse.status}: ${errorText.slice(0, 500)}`);
    }

    if (isStreaming && upstreamResponse.body) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = upstreamResponse.body.getReader();
      const decoder = new TextDecoder();
      const needsTranslation = provider.name === 'anthropic' || provider.name === 'gemini' || provider.name === 'vertex';

      const anthropicTranslator = provider.name === 'anthropic'
        ? new AnthropicStreamTranslator(body.model) : null;
      const geminiTranslator = (provider.name === 'gemini' || provider.name === 'vertex')
        ? new GeminiStreamTranslator(body.model) : null;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });

          if (needsTranslation) {
            const translator = anthropicTranslator ?? geminiTranslator;
            if (translator) {
              const translated = translator.processChunk(chunk);
              for (const line of translated) {
                res.write(line);
              }
            }
          } else {
            res.write(chunk);
          }
        }

        // Flush remaining buffered data
        const translator = anthropicTranslator ?? geminiTranslator;
        if (translator) {
          const remaining = translator.flush();
          for (const line of remaining) {
            res.write(line);
          }
        }
      } finally {
        res.end();
      }
    } else {
      const responseData = await upstreamResponse.json();
      const translated = this.translateResponse(provider, responseData, body.model);
      res.json(translated);
    }
  }

  private buildUpstreamUrl(provider: ProviderEntry, body: OpenAIChatRequest): string {
    const baseUrl = provider.baseUrl ?? '';

    if (provider.name === 'gemini' || provider.name === 'vertex') {
      const model = this.resolveModelName(provider, body.model);
      const method = body.stream ? 'streamGenerateContent' : 'generateContent';
      return `${baseUrl}/models/${model}:${method}?key=${provider.apiKey ?? ''}`;
    }

    if (provider.name === 'anthropic') {
      return `${baseUrl}/messages`;
    }

    return `${baseUrl}/chat/completions`;
  }

  private buildUpstreamHeaders(provider: ProviderEntry): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (provider.name === 'anthropic') {
      headers['x-api-key'] = provider.apiKey ?? '';
      headers['anthropic-version'] = '2023-06-01';
    } else if (provider.name === 'gemini' || provider.name === 'vertex') {
      // API key is passed as query param
    } else if (provider.apiKey) {
      headers['Authorization'] = `Bearer ${provider.apiKey}`;
    }

    return headers;
  }

  private translateRequest(provider: ProviderEntry, body: OpenAIChatRequest): unknown {
    const resolvedModel = this.resolveModelName(provider, body.model);
    const bodyWithModel = { ...body, model: resolvedModel };

    if (provider.name === 'anthropic') {
      return openaiToAnthropic(bodyWithModel);
    }
    if (provider.name === 'gemini' || provider.name === 'vertex') {
      return openaiToGemini(bodyWithModel);
    }
    return bodyWithModel;
  }

  private translateResponse(provider: ProviderEntry, responseData: unknown, requestModel: string): unknown {
    if (provider.name === 'anthropic') {
      return anthropicToOpenai(responseData as Parameters<typeof anthropicToOpenai>[0]);
    }
    if (provider.name === 'gemini' || provider.name === 'vertex') {
      return geminiToOpenai(responseData as Parameters<typeof geminiToOpenai>[0], requestModel);
    }
    return responseData;
  }

  private resolveModelName(provider: ProviderEntry, requestedModel: string): string {
    const stripped = requestedModel.replace(/^[^/]+\//, '');

    for (const model of provider.models) {
      if (model.alias === requestedModel || model.alias === stripped) {
        return model.name;
      }
      if (model.name === requestedModel || model.name === stripped) {
        return model.name;
      }
    }

    return stripped;
  }
}
