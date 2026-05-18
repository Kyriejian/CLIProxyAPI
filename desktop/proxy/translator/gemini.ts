import type { OpenAIChatMessage, OpenAIChatRequest } from './openai.js';

export interface GeminiContent {
  role: 'user' | 'model';
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
}

export interface GeminiRequest {
  contents: GeminiContent[];
  systemInstruction?: { parts: Array<{ text: string }> };
  generationConfig?: {
    temperature?: number;
    topP?: number;
    maxOutputTokens?: number;
    candidateCount?: number;
  };
}

export interface GeminiResponse {
  candidates: Array<{
    content: { parts: Array<{ text?: string }>; role: string };
    finishReason: string;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export function openaiToGemini(req: OpenAIChatRequest): GeminiRequest {
  const contents: GeminiContent[] = [];
  let systemInstruction: { parts: Array<{ text: string }> } | undefined;

  for (const msg of req.messages) {
    if (msg.role === 'system') {
      const text = typeof msg.content === 'string' ? msg.content : '';
      systemInstruction = { parts: [{ text }] };
      continue;
    }

    const role = msg.role === 'assistant' ? 'model' : 'user';
    const parts = convertParts(msg);
    contents.push({ role, parts });
  }

  const result: GeminiRequest = { contents };
  if (systemInstruction) result.systemInstruction = systemInstruction;

  result.generationConfig = {};
  if (req.temperature !== undefined) result.generationConfig.temperature = req.temperature;
  if (req.top_p !== undefined) result.generationConfig.topP = req.top_p;
  if (req.max_tokens !== undefined) result.generationConfig.maxOutputTokens = req.max_tokens;

  return result;
}

export function geminiToOpenai(resp: GeminiResponse, model: string): {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{ index: number; message: OpenAIChatMessage; finish_reason: string }>;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
} {
  const candidate = resp.candidates[0];
  const text = candidate?.content?.parts?.map(p => p.text ?? '').join('') ?? '';

  return {
    id: `chatcmpl-gemini-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{
      index: 0,
      message: { role: 'assistant', content: text },
      finish_reason: mapFinishReason(candidate?.finishReason),
    }],
    usage: {
      prompt_tokens: resp.usageMetadata?.promptTokenCount ?? 0,
      completion_tokens: resp.usageMetadata?.candidatesTokenCount ?? 0,
      total_tokens: resp.usageMetadata?.totalTokenCount ?? 0,
    },
  };
}

function convertParts(msg: OpenAIChatMessage): Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> {
  if (typeof msg.content === 'string') {
    return [{ text: msg.content }];
  }
  if (Array.isArray(msg.content)) {
    return msg.content.map(c => {
      if (c.type === 'text') return { text: c.text };
      if (c.type === 'image_url' && c.image_url) {
        const url = c.image_url.url;
        if (url.startsWith('data:')) {
          const [meta, data] = url.split(',');
          const mimeType = meta.split(':')[1]?.split(';')[0] ?? 'image/png';
          return { inlineData: { mimeType, data } };
        }
      }
      return { text: '' };
    });
  }
  return [{ text: '' }];
}

function mapFinishReason(reason?: string): string {
  switch (reason) {
    case 'STOP': return 'stop';
    case 'MAX_TOKENS': return 'length';
    case 'SAFETY': return 'content_filter';
    default: return 'stop';
  }
}
