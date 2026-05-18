import type { OpenAIChatMessage } from './openai.js';

export interface OpenAIStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: Partial<OpenAIChatMessage>;
    finish_reason: string | null;
  }>;
}

/**
 * Transform an Anthropic SSE stream into OpenAI-compatible SSE chunks.
 * Anthropic events: message_start, content_block_start, content_block_delta, content_block_stop, message_delta, message_stop
 */
export class AnthropicStreamTranslator {
  private model: string;
  private msgId = '';
  private buffer = '';

  constructor(model: string) {
    this.model = model;
  }

  processChunk(raw: string): string[] {
    this.buffer += raw;
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() ?? '';

    const output: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;

      const jsonStr = trimmed.slice(6);
      if (jsonStr === '[DONE]') {
        output.push('data: [DONE]\n\n');
        continue;
      }

      let event: AnthropicStreamEvent;
      try {
        event = JSON.parse(jsonStr);
      } catch {
        continue;
      }

      const chunks = this.translateEvent(event);
      for (const chunk of chunks) {
        output.push(`data: ${JSON.stringify(chunk)}\n\n`);
      }
    }

    return output;
  }

  private translateEvent(event: AnthropicStreamEvent): OpenAIStreamChunk[] {
    switch (event.type) {
      case 'message_start': {
        const msg = event.message;
        if (msg) {
          this.msgId = msg.id ?? `chatcmpl-${Date.now()}`;
        }
        return [{
          id: this.msgId,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: this.model,
          choices: [{ index: 0, delta: { role: 'assistant', content: '' }, finish_reason: null }],
        }];
      }

      case 'content_block_delta': {
        const text = event.delta?.text ?? '';
        if (!text) return [];
        return [{
          id: this.msgId,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: this.model,
          choices: [{ index: 0, delta: { content: text }, finish_reason: null }],
        }];
      }

      case 'message_delta': {
        const stopReason = event.delta?.stop_reason;
        const finishReason = mapAnthropicStopReason(stopReason);
        return [{
          id: this.msgId,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: this.model,
          choices: [{ index: 0, delta: {}, finish_reason: finishReason }],
        }];
      }

      case 'message_stop':
        return [];

      default:
        return [];
    }
  }

  flush(): string[] {
    if (this.buffer.trim()) {
      const result = this.processChunk('\n');
      this.buffer = '';
      return result;
    }
    return [];
  }
}

/**
 * Transform a Gemini SSE stream into OpenAI-compatible SSE chunks.
 * Gemini streams JSON objects line by line or as SSE data events.
 */
export class GeminiStreamTranslator {
  private model: string;
  private chunkId: string;
  private buffer = '';

  constructor(model: string) {
    this.model = model;
    this.chunkId = `chatcmpl-gemini-${Date.now()}`;
  }

  processChunk(raw: string): string[] {
    this.buffer += raw;
    const output: string[] = [];

    // Gemini streams can send JSON objects separated by newlines, or SSE data: lines
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Strip SSE prefix if present
      const jsonStr = trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed;
      if (jsonStr === '[DONE]') {
        output.push('data: [DONE]\n\n');
        continue;
      }

      let geminiChunk: GeminiStreamChunk;
      try {
        geminiChunk = JSON.parse(jsonStr);
      } catch {
        continue;
      }

      const text = geminiChunk.candidates?.[0]?.content?.parts
        ?.map(p => p.text ?? '')
        .join('') ?? '';

      const finishReason = geminiChunk.candidates?.[0]?.finishReason;

      if (text) {
        output.push(`data: ${JSON.stringify({
          id: this.chunkId,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: this.model,
          choices: [{ index: 0, delta: { content: text }, finish_reason: null }],
        } satisfies OpenAIStreamChunk)}\n\n`);
      }

      if (finishReason && finishReason !== 'FINISH_REASON_UNSPECIFIED') {
        output.push(`data: ${JSON.stringify({
          id: this.chunkId,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: this.model,
          choices: [{ index: 0, delta: {}, finish_reason: mapGeminiFinishReason(finishReason) }],
        } satisfies OpenAIStreamChunk)}\n\n`);
      }
    }

    return output;
  }

  flush(): string[] {
    if (this.buffer.trim()) {
      const result = this.processChunk('\n');
      this.buffer = '';
      return result;
    }
    return [];
  }
}

// Internal types for stream events

interface AnthropicStreamEvent {
  type: string;
  message?: { id?: string; model?: string };
  delta?: { text?: string; stop_reason?: string };
  index?: number;
  content_block?: { type: string; text?: string };
}

interface GeminiStreamChunk {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }>; role?: string };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

function mapAnthropicStopReason(reason?: string): string {
  switch (reason) {
    case 'end_turn': return 'stop';
    case 'max_tokens': return 'length';
    case 'tool_use': return 'tool_calls';
    default: return 'stop';
  }
}

function mapGeminiFinishReason(reason?: string): string {
  switch (reason) {
    case 'STOP': return 'stop';
    case 'MAX_TOKENS': return 'length';
    case 'SAFETY': return 'content_filter';
    default: return 'stop';
  }
}
