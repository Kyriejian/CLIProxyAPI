import { describe, it, expect } from 'vitest';
import { openaiToAnthropic, anthropicToOpenai } from '../translator/anthropic.js';
import { openaiToGemini, geminiToOpenai } from '../translator/gemini.js';
import { toOpenAIModelsResponse, createOpenAIErrorResponse } from '../translator/openai.js';
import { AnthropicStreamTranslator, GeminiStreamTranslator } from '../translator/stream.js';
import type { OpenAIChatRequest } from '../translator/openai.js';

// --- OpenAI helpers ---

describe('toOpenAIModelsResponse', () => {
  it('should format models into OpenAI list response', () => {
    const models = [
      { id: 'model-1', name: 'gpt-4o', provider: 'openai' },
      { id: 'model-2', name: 'claude-sonnet', provider: 'anthropic' },
    ];
    const result = toOpenAIModelsResponse(models);

    expect(result.object).toBe('list');
    expect(result.data).toHaveLength(2);
    expect(result.data[0].id).toBe('gpt-4o');
    expect(result.data[0].object).toBe('model');
    expect(result.data[0].owned_by).toBe('openai');
    expect(result.data[1].id).toBe('claude-sonnet');
    expect(result.data[1].owned_by).toBe('anthropic');
  });

  it('should handle empty models list', () => {
    const result = toOpenAIModelsResponse([]);
    expect(result.object).toBe('list');
    expect(result.data).toHaveLength(0);
  });
});

describe('createOpenAIErrorResponse', () => {
  it('should create proper error structure', () => {
    const result = createOpenAIErrorResponse('test error', 'test_code');
    expect(result.error.message).toBe('test error');
    expect(result.error.code).toBe('test_code');
    expect(result.error.type).toBe('error');
  });
});

// --- Anthropic translator ---

describe('openaiToAnthropic', () => {
  it('should convert basic OpenAI request to Anthropic format', () => {
    const req: OpenAIChatRequest = {
      model: 'claude-sonnet-4',
      messages: [
        { role: 'user', content: 'Hello' },
      ],
      max_tokens: 100,
    };

    const result = openaiToAnthropic(req);
    expect(result.model).toBe('claude-sonnet-4');
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe('user');
    expect(result.messages[0].content).toBe('Hello');
    expect(result.max_tokens).toBe(100);
  });

  it('should extract system message into system field', () => {
    const req: OpenAIChatRequest = {
      model: 'claude-sonnet-4',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello' },
      ],
    };

    const result = openaiToAnthropic(req);
    expect(result.system).toBe('You are a helpful assistant.');
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe('user');
  });

  it('should default max_tokens to 4096', () => {
    const req: OpenAIChatRequest = {
      model: 'claude-sonnet-4',
      messages: [{ role: 'user', content: 'Hi' }],
    };

    const result = openaiToAnthropic(req);
    expect(result.max_tokens).toBe(4096);
  });

  it('should convert tools from OpenAI to Anthropic format', () => {
    const req: OpenAIChatRequest = {
      model: 'claude-sonnet-4',
      messages: [{ role: 'user', content: 'Hi' }],
      tools: [{
        type: 'function',
        function: { name: 'get_weather', description: 'Get the weather', parameters: { type: 'object' } },
      }],
    };

    const result = openaiToAnthropic(req);
    expect(result.tools).toHaveLength(1);
    expect(result.tools![0].name).toBe('get_weather');
    expect(result.tools![0].description).toBe('Get the weather');
  });

  it('should pass temperature and top_p', () => {
    const req: OpenAIChatRequest = {
      model: 'claude-sonnet-4',
      messages: [{ role: 'user', content: 'Hi' }],
      temperature: 0.7,
      top_p: 0.9,
    };

    const result = openaiToAnthropic(req);
    expect(result.temperature).toBe(0.7);
    expect(result.top_p).toBe(0.9);
  });
});

describe('anthropicToOpenai', () => {
  it('should convert Anthropic response to OpenAI format', () => {
    const resp = {
      id: 'msg_123',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: 'Hello!' }],
      model: 'claude-sonnet-4',
      stop_reason: 'end_turn',
      usage: { input_tokens: 10, output_tokens: 5 },
    };

    const result = anthropicToOpenai(resp);
    expect(result.id).toBe('msg_123');
    expect(result.object).toBe('chat.completion');
    expect(result.model).toBe('claude-sonnet-4');
    expect(result.choices[0].message.role).toBe('assistant');
    expect(result.choices[0].message.content).toBe('Hello!');
    expect(result.choices[0].finish_reason).toBe('stop');
    expect(result.usage.prompt_tokens).toBe(10);
    expect(result.usage.completion_tokens).toBe(5);
    expect(result.usage.total_tokens).toBe(15);
  });

  it('should map stop reasons correctly', () => {
    const base = {
      id: 'msg_1',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: '' }],
      model: 'claude-sonnet-4',
      usage: { input_tokens: 0, output_tokens: 0 },
    };

    expect(anthropicToOpenai({ ...base, stop_reason: 'end_turn' }).choices[0].finish_reason).toBe('stop');
    expect(anthropicToOpenai({ ...base, stop_reason: 'max_tokens' }).choices[0].finish_reason).toBe('length');
    expect(anthropicToOpenai({ ...base, stop_reason: 'tool_use' }).choices[0].finish_reason).toBe('tool_calls');
  });

  it('should concatenate multiple text content blocks', () => {
    const resp = {
      id: 'msg_2',
      type: 'message',
      role: 'assistant',
      content: [
        { type: 'text', text: 'Hello ' },
        { type: 'text', text: 'world!' },
      ],
      model: 'claude-sonnet-4',
      stop_reason: 'end_turn',
      usage: { input_tokens: 5, output_tokens: 3 },
    };

    const result = anthropicToOpenai(resp);
    expect(result.choices[0].message.content).toBe('Hello world!');
  });
});

// --- Gemini translator ---

describe('openaiToGemini', () => {
  it('should convert basic OpenAI request to Gemini format', () => {
    const req: OpenAIChatRequest = {
      model: 'gemini-2.5-pro',
      messages: [
        { role: 'user', content: 'Hello' },
      ],
    };

    const result = openaiToGemini(req);
    expect(result.contents).toHaveLength(1);
    expect(result.contents[0].role).toBe('user');
    expect(result.contents[0].parts[0].text).toBe('Hello');
  });

  it('should extract system message into systemInstruction', () => {
    const req: OpenAIChatRequest = {
      model: 'gemini-2.5-pro',
      messages: [
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'Hi' },
      ],
    };

    const result = openaiToGemini(req);
    expect(result.systemInstruction?.parts[0].text).toBe('You are helpful.');
    expect(result.contents).toHaveLength(1);
  });

  it('should map assistant role to model role', () => {
    const req: OpenAIChatRequest = {
      model: 'gemini-2.5-pro',
      messages: [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello!' },
        { role: 'user', content: 'How are you?' },
      ],
    };

    const result = openaiToGemini(req);
    expect(result.contents[0].role).toBe('user');
    expect(result.contents[1].role).toBe('model');
    expect(result.contents[2].role).toBe('user');
  });

  it('should set generationConfig for temperature, top_p, max_tokens', () => {
    const req: OpenAIChatRequest = {
      model: 'gemini-2.5-pro',
      messages: [{ role: 'user', content: 'Hi' }],
      temperature: 0.5,
      top_p: 0.8,
      max_tokens: 200,
    };

    const result = openaiToGemini(req);
    expect(result.generationConfig?.temperature).toBe(0.5);
    expect(result.generationConfig?.topP).toBe(0.8);
    expect(result.generationConfig?.maxOutputTokens).toBe(200);
  });
});

describe('geminiToOpenai', () => {
  it('should convert Gemini response to OpenAI format', () => {
    const resp = {
      candidates: [{
        content: { parts: [{ text: 'Hello!' }], role: 'model' },
        finishReason: 'STOP',
      }],
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 },
    };

    const result = geminiToOpenai(resp, 'gemini-2.5-pro');
    expect(result.object).toBe('chat.completion');
    expect(result.model).toBe('gemini-2.5-pro');
    expect(result.choices[0].message.role).toBe('assistant');
    expect(result.choices[0].message.content).toBe('Hello!');
    expect(result.choices[0].finish_reason).toBe('stop');
    expect(result.usage.prompt_tokens).toBe(10);
    expect(result.usage.completion_tokens).toBe(5);
    expect(result.usage.total_tokens).toBe(15);
  });

  it('should map Gemini finish reasons correctly', () => {
    const base = {
      candidates: [{ content: { parts: [{ text: '' }], role: 'model' }, finishReason: '' }],
      usageMetadata: { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 },
    };

    const stopResult = geminiToOpenai({ ...base, candidates: [{ ...base.candidates[0], finishReason: 'STOP' }] }, 'test');
    expect(stopResult.choices[0].finish_reason).toBe('stop');

    const maxResult = geminiToOpenai({ ...base, candidates: [{ ...base.candidates[0], finishReason: 'MAX_TOKENS' }] }, 'test');
    expect(maxResult.choices[0].finish_reason).toBe('length');

    const safetyResult = geminiToOpenai({ ...base, candidates: [{ ...base.candidates[0], finishReason: 'SAFETY' }] }, 'test');
    expect(safetyResult.choices[0].finish_reason).toBe('content_filter');
  });
});

// --- Stream translators ---

describe('AnthropicStreamTranslator', () => {
  it('should translate message_start event to role chunk', () => {
    const translator = new AnthropicStreamTranslator('claude-sonnet-4');
    const input = 'data: {"type":"message_start","message":{"id":"msg_abc","model":"claude-sonnet-4"}}\n\n';
    const result = translator.processChunk(input);

    expect(result).toHaveLength(1);
    const parsed = JSON.parse(result[0].replace('data: ', '').trim());
    expect(parsed.choices[0].delta.role).toBe('assistant');
    expect(parsed.id).toBe('msg_abc');
  });

  it('should translate content_block_delta to content chunk', () => {
    const translator = new AnthropicStreamTranslator('claude-sonnet-4');
    // First send message_start to set the ID
    translator.processChunk('data: {"type":"message_start","message":{"id":"msg_1"}}\n\n');

    const input = 'data: {"type":"content_block_delta","delta":{"text":"Hello"}}\n\n';
    const result = translator.processChunk(input);

    expect(result).toHaveLength(1);
    const parsed = JSON.parse(result[0].replace('data: ', '').trim());
    expect(parsed.choices[0].delta.content).toBe('Hello');
    expect(parsed.choices[0].finish_reason).toBeNull();
  });

  it('should translate message_delta with stop_reason to finish_reason', () => {
    const translator = new AnthropicStreamTranslator('claude-sonnet-4');
    translator.processChunk('data: {"type":"message_start","message":{"id":"msg_1"}}\n\n');

    const input = 'data: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}\n\n';
    const result = translator.processChunk(input);

    expect(result).toHaveLength(1);
    const parsed = JSON.parse(result[0].replace('data: ', '').trim());
    expect(parsed.choices[0].finish_reason).toBe('stop');
  });

  it('should handle multiple events in one chunk', () => {
    const translator = new AnthropicStreamTranslator('claude-sonnet-4');
    const input = [
      'data: {"type":"message_start","message":{"id":"msg_1"}}',
      '',
      'data: {"type":"content_block_delta","delta":{"text":"Hi"}}',
      '',
      'data: {"type":"content_block_delta","delta":{"text":" there"}}',
      '',
    ].join('\n');

    const result = translator.processChunk(input);
    expect(result).toHaveLength(3);
  });

  it('should pass through [DONE]', () => {
    const translator = new AnthropicStreamTranslator('claude-sonnet-4');
    const input = 'data: [DONE]\n\n';
    const result = translator.processChunk(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('data: [DONE]\n\n');
  });

  it('should handle split chunks via buffer', () => {
    const translator = new AnthropicStreamTranslator('claude-sonnet-4');

    // Split a message across two chunks
    const result1 = translator.processChunk('data: {"type":"message_start","message":');
    expect(result1).toHaveLength(0);

    const result2 = translator.processChunk('{"id":"msg_1"}}\n\n');
    expect(result2).toHaveLength(1);
  });
});

describe('GeminiStreamTranslator', () => {
  it('should translate Gemini stream chunk with text', () => {
    const translator = new GeminiStreamTranslator('gemini-2.5-pro');
    const input = JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'Hello' }], role: 'model' } }],
    }) + '\n';

    const result = translator.processChunk(input);
    expect(result).toHaveLength(1);
    const parsed = JSON.parse(result[0].replace('data: ', '').trim());
    expect(parsed.choices[0].delta.content).toBe('Hello');
    expect(parsed.model).toBe('gemini-2.5-pro');
  });

  it('should emit finish_reason on STOP', () => {
    const translator = new GeminiStreamTranslator('gemini-2.5-pro');
    const input = JSON.stringify({
      candidates: [{ content: { parts: [{ text: '' }], role: 'model' }, finishReason: 'STOP' }],
    }) + '\n';

    const result = translator.processChunk(input);
    // One chunk for finish_reason (text is empty so no content chunk)
    expect(result.length).toBeGreaterThanOrEqual(1);
    const last = JSON.parse(result[result.length - 1].replace('data: ', '').trim());
    expect(last.choices[0].finish_reason).toBe('stop');
  });

  it('should handle SSE-prefixed data', () => {
    const translator = new GeminiStreamTranslator('gemini-2.5-pro');
    const input = `data: ${JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'Hi' }], role: 'model' } }],
    })}\n`;

    const result = translator.processChunk(input);
    expect(result).toHaveLength(1);
    const parsed = JSON.parse(result[0].replace('data: ', '').trim());
    expect(parsed.choices[0].delta.content).toBe('Hi');
  });

  it('should pass through [DONE]', () => {
    const translator = new GeminiStreamTranslator('gemini-2.5-pro');
    const result = translator.processChunk('data: [DONE]\n');
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('data: [DONE]\n\n');
  });
});
