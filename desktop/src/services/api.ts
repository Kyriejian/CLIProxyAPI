const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error?.message ?? error.error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  getStatus: () => request<{
    status: string;
    version: string;
    host: string;
    port: number;
    providers: number;
    models: number;
    stats: Record<string, number>;
  }>('/status'),

  getProviders: () => request<Array<Record<string, unknown>>>('/providers'),
  addProvider: (data: Record<string, unknown>) => request<Record<string, unknown>>('/providers', { method: 'POST', body: JSON.stringify(data) }),
  updateProvider: (id: string, data: Record<string, unknown>) => request<Record<string, unknown>>(`/providers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProvider: (id: string) => request<void>(`/providers/${id}`, { method: 'DELETE' }),
  testProvider: (id: string) => request<{ success: boolean; latencyMs: number; error?: string }>(`/providers/${id}/test`, { method: 'POST' }),

  getModels: () => request<Array<Record<string, unknown>>>('/models'),
  getStats: () => request<Record<string, number>>('/stats'),
  getLogs: (limit = 100) => request<Array<Record<string, unknown>>>(`/logs?limit=${limit}`),

  getAccounts: () => request<Array<Record<string, unknown>>>('/accounts'),
  addAccount: (data: Record<string, unknown>) => request<Record<string, unknown>>('/accounts', { method: 'POST', body: JSON.stringify(data) }),
  deleteAccount: (id: string) => request<void>(`/accounts/${id}`, { method: 'DELETE' }),

  // API Key management
  getKeys: () => request<{ keys: string[]; authEnabled: boolean }>('/keys'),
  addKey: (key: string) => request<{ key: string; total: number }>('/keys', { method: 'POST', body: JSON.stringify({ key }) }),
  generateKey: () => request<{ key: string; total: number }>('/keys/generate', { method: 'POST' }),
  deleteKey: (key: string) => request<{ deleted: boolean; total: number }>(`/keys/${encodeURIComponent(key)}`, { method: 'DELETE' }),
  updateAuthConfig: (enableAuth: boolean) => request<{ enableAuth: boolean; keys: number }>('/config/auth', { method: 'PUT', body: JSON.stringify({ enableAuth }) }),
};
