import { v4 as uuidv4 } from 'uuid';

export type ProviderType = 'free' | 'oauth' | 'api-key' | 'local';
export type ProviderStatus = 'active' | 'inactive' | 'error' | 'rate-limited' | 'quota-exhausted';

export interface ProviderModel {
  id: string;
  name: string;
  alias?: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  supportsStreaming: boolean;
  supportsTools: boolean;
  supportsVision: boolean;
  pricing?: { inputPer1M: number; outputPer1M: number; currency: string };
}

export interface ProviderQuota {
  used: number;
  total: number;
  resetAt?: string;
  unit: 'requests' | 'tokens' | 'credits' | 'dollars';
}

export interface ProviderConfig {
  id?: string;
  name: string;
  displayName: string;
  type: ProviderType;
  status?: ProviderStatus;
  authMethod: string;
  baseUrl?: string;
  apiKey?: string;
  icon?: string;
  models?: ProviderModel[];
  quota?: ProviderQuota;
  priority?: number;
  enabled?: boolean;
  config?: Record<string, unknown>;
}

export interface ProviderEntry extends ProviderConfig {
  id: string;
  status: ProviderStatus;
  models: ProviderModel[];
  priority: number;
  enabled: boolean;
  lastChecked?: string;
  createdAt: string;
  updatedAt: string;
  roundRobinIndex: number;
}

export class ProviderRegistry {
  private providers: Map<string, ProviderEntry> = new Map();

  constructor() {
    this.loadDefaults();
  }

  private loadDefaults(): void {
    const defaults: ProviderConfig[] = [
      {
        name: 'kiro',
        displayName: 'Kiro AI',
        type: 'free',
        authMethod: 'none',
        baseUrl: 'https://api.kiro.dev',
        icon: 'kiro',
        models: [
          { id: 'kr-claude-sonnet-4', name: 'claude-sonnet-4', alias: 'kr/claude-sonnet-4', supportsStreaming: true, supportsTools: true, supportsVision: true, contextWindow: 200000 },
          { id: 'kr-claude-sonnet-4-5', name: 'claude-sonnet-4.5', alias: 'kr/claude-sonnet-4.5', supportsStreaming: true, supportsTools: true, supportsVision: true, contextWindow: 200000 },
        ],
        priority: 10,
      },
      {
        name: 'opencode-free',
        displayName: 'OpenCode Free',
        type: 'free',
        authMethod: 'none',
        icon: 'opencode',
        models: [
          { id: 'oc-gpt4', name: 'gpt-4o', alias: 'oc/gpt-4o', supportsStreaming: true, supportsTools: true, supportsVision: true, contextWindow: 128000 },
          { id: 'oc-claude', name: 'claude-sonnet', alias: 'oc/claude-sonnet', supportsStreaming: true, supportsTools: true, supportsVision: true, contextWindow: 200000 },
        ],
        priority: 20,
      },
      {
        name: 'groq',
        displayName: 'Groq',
        type: 'api-key',
        authMethod: 'api-key',
        baseUrl: 'https://api.groq.com/openai/v1',
        icon: 'groq',
        models: [
          { id: 'groq-llama-90b', name: 'llama-3.3-70b-versatile', alias: 'groq/llama-70b', supportsStreaming: true, supportsTools: true, supportsVision: false, contextWindow: 128000 },
          { id: 'groq-mixtral', name: 'mixtral-8x7b-32768', alias: 'groq/mixtral', supportsStreaming: true, supportsTools: false, supportsVision: false, contextWindow: 32768 },
        ],
        priority: 30,
        enabled: false,
      },
      {
        name: 'deepseek',
        displayName: 'DeepSeek',
        type: 'api-key',
        authMethod: 'api-key',
        baseUrl: 'https://api.deepseek.com/v1',
        icon: 'deepseek',
        models: [
          { id: 'ds-chat', name: 'deepseek-chat', alias: 'deepseek/chat', supportsStreaming: true, supportsTools: true, supportsVision: false, contextWindow: 128000, pricing: { inputPer1M: 0.14, outputPer1M: 0.28, currency: 'USD' } },
          { id: 'ds-coder', name: 'deepseek-coder', alias: 'deepseek/coder', supportsStreaming: true, supportsTools: true, supportsVision: false, contextWindow: 128000, pricing: { inputPer1M: 0.14, outputPer1M: 0.28, currency: 'USD' } },
        ],
        priority: 35,
        enabled: false,
      },
      {
        name: 'glm',
        displayName: 'GLM (ZhipuAI)',
        type: 'api-key',
        authMethod: 'api-key',
        baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
        icon: 'glm',
        models: [
          { id: 'glm-4-plus', name: 'glm-4-plus', alias: 'glm/glm-4-plus', supportsStreaming: true, supportsTools: true, supportsVision: true, contextWindow: 128000, pricing: { inputPer1M: 0.6, outputPer1M: 0.6, currency: 'USD' } },
        ],
        priority: 40,
        enabled: false,
      },
      {
        name: 'minimax',
        displayName: 'MiniMax',
        type: 'api-key',
        authMethod: 'api-key',
        baseUrl: 'https://api.minimax.chat/v1',
        icon: 'minimax',
        models: [
          { id: 'mm-abab6', name: 'abab6.5s-chat', alias: 'minimax/abab6.5s', supportsStreaming: true, supportsTools: true, supportsVision: false, contextWindow: 245760, pricing: { inputPer1M: 0.2, outputPer1M: 0.2, currency: 'USD' } },
        ],
        priority: 45,
        enabled: false,
      },
      {
        name: 'openrouter',
        displayName: 'OpenRouter',
        type: 'api-key',
        authMethod: 'api-key',
        baseUrl: 'https://openrouter.ai/api/v1',
        icon: 'openrouter',
        models: [
          { id: 'or-auto', name: 'auto', alias: 'openrouter/auto', supportsStreaming: true, supportsTools: true, supportsVision: true, contextWindow: 200000 },
        ],
        priority: 50,
        enabled: false,
      },
      {
        name: 'gemini',
        displayName: 'Google Gemini',
        type: 'api-key',
        authMethod: 'api-key',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        icon: 'gemini',
        models: [
          { id: 'gem-pro', name: 'gemini-2.5-pro', alias: 'gemini/pro', supportsStreaming: true, supportsTools: true, supportsVision: true, contextWindow: 1000000 },
          { id: 'gem-flash', name: 'gemini-2.5-flash', alias: 'gemini/flash', supportsStreaming: true, supportsTools: true, supportsVision: true, contextWindow: 1000000 },
        ],
        priority: 55,
        enabled: false,
      },
      {
        name: 'openai',
        displayName: 'OpenAI',
        type: 'api-key',
        authMethod: 'api-key',
        baseUrl: 'https://api.openai.com/v1',
        icon: 'openai',
        models: [
          { id: 'oai-gpt4o', name: 'gpt-4o', alias: 'openai/gpt-4o', supportsStreaming: true, supportsTools: true, supportsVision: true, contextWindow: 128000 },
          { id: 'oai-gpt4o-mini', name: 'gpt-4o-mini', alias: 'openai/gpt-4o-mini', supportsStreaming: true, supportsTools: true, supportsVision: true, contextWindow: 128000 },
        ],
        priority: 60,
        enabled: false,
      },
      {
        name: 'anthropic',
        displayName: 'Anthropic',
        type: 'api-key',
        authMethod: 'api-key',
        baseUrl: 'https://api.anthropic.com/v1',
        icon: 'anthropic',
        models: [
          { id: 'ant-sonnet', name: 'claude-sonnet-4-20250514', alias: 'anthropic/claude-sonnet', supportsStreaming: true, supportsTools: true, supportsVision: true, contextWindow: 200000 },
          { id: 'ant-haiku', name: 'claude-3-5-haiku-20241022', alias: 'anthropic/claude-haiku', supportsStreaming: true, supportsTools: true, supportsVision: true, contextWindow: 200000 },
        ],
        priority: 65,
        enabled: false,
      },
      {
        name: 'mistral',
        displayName: 'Mistral AI',
        type: 'api-key',
        authMethod: 'api-key',
        baseUrl: 'https://api.mistral.ai/v1',
        icon: 'mistral',
        models: [
          { id: 'mis-large', name: 'mistral-large-latest', alias: 'mistral/large', supportsStreaming: true, supportsTools: true, supportsVision: true, contextWindow: 128000 },
          { id: 'mis-small', name: 'mistral-small-latest', alias: 'mistral/small', supportsStreaming: true, supportsTools: true, supportsVision: false, contextWindow: 32000 },
        ],
        priority: 70,
        enabled: false,
      },
      {
        name: 'xai',
        displayName: 'xAI (Grok)',
        type: 'api-key',
        authMethod: 'api-key',
        baseUrl: 'https://api.x.ai/v1',
        icon: 'xai',
        models: [
          { id: 'xai-grok', name: 'grok-2', alias: 'xai/grok-2', supportsStreaming: true, supportsTools: true, supportsVision: true, contextWindow: 131072 },
        ],
        priority: 75,
        enabled: false,
      },
      {
        name: 'together',
        displayName: 'Together AI',
        type: 'api-key',
        authMethod: 'api-key',
        baseUrl: 'https://api.together.xyz/v1',
        icon: 'together',
        models: [
          { id: 'tog-llama', name: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', alias: 'together/llama-70b', supportsStreaming: true, supportsTools: true, supportsVision: false, contextWindow: 131072 },
        ],
        priority: 80,
        enabled: false,
      },
      {
        name: 'cerebras',
        displayName: 'Cerebras',
        type: 'api-key',
        authMethod: 'api-key',
        baseUrl: 'https://api.cerebras.ai/v1',
        icon: 'cerebras',
        models: [
          { id: 'cer-llama', name: 'llama3.3-70b', alias: 'cerebras/llama-70b', supportsStreaming: true, supportsTools: false, supportsVision: false, contextWindow: 128000 },
        ],
        priority: 85,
        enabled: false,
      },
      {
        name: 'sambanova',
        displayName: 'SambaNova',
        type: 'api-key',
        authMethod: 'api-key',
        baseUrl: 'https://api.sambanova.ai/v1',
        icon: 'sambanova',
        models: [
          { id: 'sn-llama', name: 'Meta-Llama-3.3-70B-Instruct', alias: 'sambanova/llama-70b', supportsStreaming: true, supportsTools: false, supportsVision: false, contextWindow: 128000 },
        ],
        priority: 90,
        enabled: false,
      },
      {
        name: 'perplexity',
        displayName: 'Perplexity',
        type: 'api-key',
        authMethod: 'api-key',
        baseUrl: 'https://api.perplexity.ai',
        icon: 'perplexity',
        models: [
          { id: 'pplx-online', name: 'sonar-pro', alias: 'perplexity/sonar-pro', supportsStreaming: true, supportsTools: false, supportsVision: false, contextWindow: 200000 },
        ],
        priority: 95,
        enabled: false,
      },
      {
        name: 'cohere',
        displayName: 'Cohere',
        type: 'api-key',
        authMethod: 'api-key',
        baseUrl: 'https://api.cohere.ai/v1',
        icon: 'cohere',
        models: [
          { id: 'co-cmd-r', name: 'command-r-plus', alias: 'cohere/command-r-plus', supportsStreaming: true, supportsTools: true, supportsVision: false, contextWindow: 128000 },
        ],
        priority: 100,
        enabled: false,
      },
      {
        name: 'fireworks',
        displayName: 'Fireworks AI',
        type: 'api-key',
        authMethod: 'api-key',
        baseUrl: 'https://api.fireworks.ai/inference/v1',
        icon: 'fireworks',
        models: [
          { id: 'fw-llama', name: 'accounts/fireworks/models/llama-v3p3-70b-instruct', alias: 'fireworks/llama-70b', supportsStreaming: true, supportsTools: true, supportsVision: false, contextWindow: 131072 },
        ],
        priority: 105,
        enabled: false,
      },
      {
        name: 'kimi',
        displayName: 'Kimi (Moonshot)',
        type: 'api-key',
        authMethod: 'api-key',
        baseUrl: 'https://api.moonshot.cn/v1',
        icon: 'kimi',
        models: [
          { id: 'kimi-k2', name: 'kimi-k2', alias: 'kimi/k2', supportsStreaming: true, supportsTools: true, supportsVision: false, contextWindow: 131072 },
        ],
        priority: 110,
        enabled: false,
      },
    ];

    for (const cfg of defaults) {
      this.add(cfg);
    }
  }

  add(config: ProviderConfig): ProviderEntry {
    const now = new Date().toISOString();
    const entry: ProviderEntry = {
      ...config,
      id: config.id ?? uuidv4(),
      status: config.status ?? (config.enabled === false ? 'inactive' : 'active'),
      models: config.models ?? [],
      priority: config.priority ?? 50,
      enabled: config.enabled ?? true,
      createdAt: now,
      updatedAt: now,
      roundRobinIndex: 0,
    };
    this.providers.set(entry.id, entry);
    return entry;
  }

  update(id: string, updates: Partial<ProviderConfig>): ProviderEntry {
    const existing = this.providers.get(id);
    if (!existing) {
      throw new Error(`Provider ${id} not found`);
    }
    const updated: ProviderEntry = {
      ...existing,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
      roundRobinIndex: existing.roundRobinIndex,
      createdAt: existing.createdAt,
    };
    this.providers.set(id, updated);
    return updated;
  }

  remove(id: string): void {
    this.providers.delete(id);
  }

  get(id: string): ProviderEntry | undefined {
    return this.providers.get(id);
  }

  getByName(name: string): ProviderEntry | undefined {
    for (const p of this.providers.values()) {
      if (p.name === name) return p;
    }
    return undefined;
  }

  getAll(): ProviderEntry[] {
    return Array.from(this.providers.values());
  }

  getActive(): ProviderEntry[] {
    return this.getAll().filter(p => p.enabled && p.status === 'active');
  }

  getByType(type: ProviderType): ProviderEntry[] {
    return this.getAll().filter(p => p.type === type);
  }

  getNextForModel(modelName: string): ProviderEntry | undefined {
    const candidates = this.getActive()
      .filter(p => p.models.some(m => m.name === modelName || m.alias === modelName))
      .sort((a, b) => a.priority - b.priority);

    if (candidates.length === 0) return undefined;
    const provider = candidates[0];
    provider.roundRobinIndex = (provider.roundRobinIndex + 1) % candidates.length;
    return candidates[provider.roundRobinIndex];
  }
}
