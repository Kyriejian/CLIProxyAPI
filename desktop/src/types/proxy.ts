export type ProxyStatus = 'running' | 'stopped' | 'starting' | 'error';

export type RequestFormat = 'openai' | 'anthropic' | 'gemini' | 'ollama';

export interface ProxyConfig {
  host: string;
  port: number;
  apiKeys: string[];
  enableAuth: boolean;
  enableCors: boolean;
  maxRetries: number;
  routingStrategy: 'round-robin' | 'priority' | 'least-used' | 'random';
  tierSystem: {
    enabled: boolean;
    tiers: TierConfig[];
  };
  rtkCompression: boolean;
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
  };
}

export interface TierConfig {
  name: string;
  priority: number;
  providerIds: string[];
  fallbackToNext: boolean;
}

export interface ProxyStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokensUsed: number;
  tokensSaved: number;
  avgLatencyMs: number;
  requestsPerMinute: number;
  uptime: number;
  activeConnections: number;
}

export interface RequestLog {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  model: string;
  provider: string;
  status: number;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  error?: string;
}

export interface ModelAlias {
  alias: string;
  targetModel: string;
  targetProvider: string;
}
