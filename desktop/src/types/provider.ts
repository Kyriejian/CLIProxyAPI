export type ProviderType = 'free' | 'oauth' | 'api-key' | 'local';

export type ProviderStatus = 'active' | 'inactive' | 'error' | 'rate-limited' | 'quota-exhausted';

export type AuthMethod = 'oauth' | 'api-key' | 'token' | 'cookie' | 'local' | 'none';

export interface ProviderModel {
  id: string;
  name: string;
  alias?: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  supportsStreaming: boolean;
  supportsTools: boolean;
  supportsVision: boolean;
  pricing?: {
    inputPer1M: number;
    outputPer1M: number;
    currency: string;
  };
}

export interface ProviderQuota {
  used: number;
  total: number;
  resetAt?: string;
  unit: 'requests' | 'tokens' | 'credits' | 'dollars';
}

export interface Provider {
  id: string;
  name: string;
  displayName: string;
  type: ProviderType;
  status: ProviderStatus;
  authMethod: AuthMethod;
  baseUrl?: string;
  apiKey?: string;
  icon?: string;
  models: ProviderModel[];
  quota?: ProviderQuota;
  priority: number;
  enabled: boolean;
  config?: Record<string, unknown>;
  lastChecked?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderGroup {
  id: string;
  name: string;
  providers: string[];
  strategy: 'round-robin' | 'priority' | 'random' | 'least-used';
  failover: boolean;
}
