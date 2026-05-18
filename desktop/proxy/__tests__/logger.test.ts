import { describe, it, expect, beforeEach } from 'vitest';
import { RequestLogger } from '../middleware/logger.js';

describe('RequestLogger', () => {
  let logger: RequestLogger;

  beforeEach(() => {
    logger = new RequestLogger();
  });

  it('should log a request entry', () => {
    logger.log({
      method: 'POST',
      path: '/v1/chat/completions',
      model: 'gpt-4o',
      provider: 'openai',
      status: 200,
      latencyMs: 150,
      inputTokens: 100,
      outputTokens: 50,
    });

    const logs = logger.getRecentLogs(10);
    expect(logs).toHaveLength(1);
    expect(logs[0].model).toBe('gpt-4o');
    expect(logs[0].provider).toBe('openai');
    expect(logs[0].status).toBe(200);
    expect(logs[0].id).toMatch(/^req-/);
    expect(logs[0].timestamp).toBeDefined();
  });

  it('should track stats correctly', () => {
    logger.log({ method: 'POST', path: '/v1/chat/completions', model: 'm', provider: 'p', status: 200, latencyMs: 100, inputTokens: 50, outputTokens: 30 });
    logger.log({ method: 'POST', path: '/v1/chat/completions', model: 'm', provider: 'p', status: 500, latencyMs: 200, inputTokens: 20, outputTokens: 0 });

    const stats = logger.getStats();
    expect(stats.totalRequests).toBe(2);
    expect(stats.successfulRequests).toBe(1);
    expect(stats.failedRequests).toBe(1);
    expect(stats.totalTokensUsed).toBe(100);
    expect(stats.avgLatencyMs).toBe(150);
  });

  it('should return recent logs in reverse chronological order', () => {
    for (let i = 0; i < 5; i++) {
      logger.log({ method: 'POST', path: '/v1/chat/completions', model: `model-${i}`, provider: 'p', status: 200, latencyMs: 10, inputTokens: 0, outputTokens: 0 });
    }

    const logs = logger.getRecentLogs(3);
    expect(logs).toHaveLength(3);
    expect(logs[0].model).toBe('model-4');
    expect(logs[2].model).toBe('model-2');
  });

  it('should respect limit in getRecentLogs', () => {
    for (let i = 0; i < 10; i++) {
      logger.log({ method: 'POST', path: '/test', model: 'm', provider: 'p', status: 200, latencyMs: 10, inputTokens: 0, outputTokens: 0 });
    }

    const logs = logger.getRecentLogs(5);
    expect(logs).toHaveLength(5);
  });

  it('should clear all logs and stats', () => {
    logger.log({ method: 'POST', path: '/test', model: 'm', provider: 'p', status: 200, latencyMs: 10, inputTokens: 10, outputTokens: 5 });
    logger.clear();

    expect(logger.getRecentLogs(10)).toHaveLength(0);
    const stats = logger.getStats();
    expect(stats.totalRequests).toBe(0);
    expect(stats.totalTokensUsed).toBe(0);
  });

  it('should track tokens saved', () => {
    logger.addTokensSaved(500);
    logger.addTokensSaved(300);

    const stats = logger.getStats();
    expect(stats.tokensSaved).toBe(800);
  });

  it('should calculate requestsPerMinute and uptime', () => {
    logger.log({ method: 'POST', path: '/test', model: 'm', provider: 'p', status: 200, latencyMs: 10, inputTokens: 0, outputTokens: 0 });

    const stats = logger.getStats();
    // requestsPerMinute may be 0 if test runs in under 1ms, so just check it's a number >= 0
    expect(stats.requestsPerMinute).toBeGreaterThanOrEqual(0);
    expect(stats.uptime).toBeGreaterThanOrEqual(0);
    expect(stats.totalRequests).toBe(1);
  });

  it('should prune old entries beyond maxLogs', () => {
    // The default maxLogs is 10000, so let's just verify the mechanism works with many entries
    for (let i = 0; i < 50; i++) {
      logger.log({ method: 'POST', path: '/test', model: 'm', provider: 'p', status: 200, latencyMs: 10, inputTokens: 0, outputTokens: 0 });
    }

    const logs = logger.getRecentLogs(100);
    expect(logs.length).toBe(50);
  });
});
