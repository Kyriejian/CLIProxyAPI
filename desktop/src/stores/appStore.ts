import { create } from 'zustand';
import type { Provider } from '../types/provider';
import type { IDEAccount } from '../types/account';
import type { ProxyStats, RequestLog, ProxyConfig } from '../types/proxy';

interface AppState {
  // Navigation
  currentPage: string;
  setCurrentPage: (page: string) => void;

  // Proxy
  proxyStatus: 'running' | 'stopped' | 'starting' | 'error';
  proxyConfig: ProxyConfig;
  proxyStats: ProxyStats;
  requestLogs: RequestLog[];
  setProxyStatus: (status: 'running' | 'stopped' | 'starting' | 'error') => void;
  setProxyConfig: (config: Partial<ProxyConfig>) => void;
  setProxyStats: (stats: ProxyStats) => void;
  setRequestLogs: (logs: RequestLog[]) => void;

  // Providers
  providers: Provider[];
  setProviders: (providers: Provider[]) => void;
  addProvider: (provider: Provider) => void;
  updateProvider: (id: string, updates: Partial<Provider>) => void;
  removeProvider: (id: string) => void;

  // Accounts
  accounts: IDEAccount[];
  setAccounts: (accounts: IDEAccount[]) => void;
  addAccount: (account: IDEAccount) => void;
  removeAccount: (id: string) => void;

  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Language
  language: 'zh' | 'en';
  setLanguage: (lang: 'zh' | 'en') => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),

  proxyStatus: 'stopped',
  proxyConfig: {
    host: '127.0.0.1',
    port: 18765,
    apiKeys: [],
    enableAuth: false,
    enableCors: true,
    maxRetries: 3,
    routingStrategy: 'round-robin',
    tierSystem: {
      enabled: true,
      tiers: [
        { name: 'Subscription', priority: 1, providerIds: [], fallbackToNext: true },
        { name: 'Cheap', priority: 2, providerIds: [], fallbackToNext: true },
        { name: 'Free', priority: 3, providerIds: [], fallbackToNext: false },
      ],
    },
    rtkCompression: true,
    logging: { enabled: true, level: 'info' },
  },
  proxyStats: {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalTokensUsed: 0,
    tokensSaved: 0,
    avgLatencyMs: 0,
    requestsPerMinute: 0,
    uptime: 0,
    activeConnections: 0,
  },
  requestLogs: [],
  setProxyStatus: (status) => set({ proxyStatus: status }),
  setProxyConfig: (config) => set((state) => ({ proxyConfig: { ...state.proxyConfig, ...config } })),
  setProxyStats: (stats) => set({ proxyStats: stats }),
  setRequestLogs: (logs) => set({ requestLogs: logs }),

  providers: [],
  setProviders: (providers) => set({ providers }),
  addProvider: (provider) => set((state) => ({ providers: [...state.providers, provider] })),
  updateProvider: (id, updates) => set((state) => ({
    providers: state.providers.map((p) => (p.id === id ? { ...p, ...updates } : p)),
  })),
  removeProvider: (id) => set((state) => ({
    providers: state.providers.filter((p) => p.id !== id),
  })),

  accounts: [],
  setAccounts: (accounts) => set({ accounts }),
  addAccount: (account) => set((state) => ({ accounts: [...state.accounts, account] })),
  removeAccount: (id) => set((state) => ({
    accounts: state.accounts.filter((a) => a.id !== id),
  })),

  theme: 'dark',
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

  language: 'zh',
  setLanguage: (language) => set({ language }),
}));
