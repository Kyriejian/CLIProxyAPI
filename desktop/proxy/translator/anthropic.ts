import type { OpenAIChatMessage, OpenAIChatRequest } from './openai.js';

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; source?: { type: string; media_type: string; data: string } }>;
}

export interface AnthropicRequest {
  model: string;
  messages: AnthropicMessage[];
  system?: string;
  max_tokens: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  tools?: Array<{
    name: string;
    description?: string;
    input_schema?: Record<string, unknown>;
  }>;
}

export interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{ type: string; text?: string }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export function openaiToAnthropic(req: OpenAIChatRequest): AnthropicRequest {
  let systemPrompt: string | undefined;
  const messages: AnthropicMessage[] = [];

  for (const msg of req.messages) {
    if (msg.role === 'system') {
      systemPrompt = typeof msg.content === 'string' ? msg.content : '';
      continue;
    }

    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content : convertContent(msg.content),
      });
    }
  }

  const result: AnthropicRequest = {
    model: req.model,
    messages,
    max_tokens: req.max_tokens ?? 4096,
    stream: req.stream,
  };

  if (systemPrompt) result.system = systemPrompt;
  if (req.temperature !== undefined) result.temperature = req.temperature;
  if (req.top_p !== undefined) result.top_p = req.top_p;

  if (req.tools) {
    result.tools = req.tools.map(t => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters,
    }));
  }

  return result;
}

export function anthropicToOpenai(resp: AnthropicResponse): {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{ index: number; message: OpenAIChatMessage; finish_reason: string }>;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
} {
  const textContent = resp.content
    .filter(c => c.type === 'text')
    .map(c => c.text ?? '')
    .join('');

  return {
    id: resp.id,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: resp.model,
    choices: [{
      index: 0,
      message: { role: 'assistant', content: textContent },
      finish_reason: mapStopReason(resp.stop_reason),
    }],
    usage: {
      prompt_tokens: resp.usage.input_tokens,
      completion_tokens: resp.usage.output_tokens,
      total_tokens: resp.usage.input_tokens + resp.usage.output_tokens,
    },
  };
}

function convertContent(content: Array<{ type: string; text?: string; image_url?: { url: string } }>): Array<{ type: string; text?: string; source?: { type: string; media_type: string; data: string } }> {
  return content.map(c => {
    if (c.type === 'text') return { type: 'text', text: c.text };
    if (c.type === 'image_url' && c.image_url) {
      const url = c.image_url.url;
      if (url.startsWith('data:')) {
        const [meta, data] = url.split(',');
        const mediaType = meta.split(':')[1]?.split(';')[0] ?? 'image/png';
        return { type: 'image', source: { type: 'base64', media_type: mediaType, data } };
      }
    }
    return { type: 'text', text: '' };
  });
}

function mapStopReason(reason: string): string {
  switch (reason) {
    case 'end_turn': return 'stop';
    case 'max_tokens': return 'length';
    case 'tool_use': return 'tool_calls';
    default: return 'stop';
  }
}
