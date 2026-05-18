import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { ProviderCard } from '../../components/ProviderCard';
import { api } from '../../services/api';
import { Plus, Search } from 'lucide-react';
import type { Provider } from '../../types/provider';

export function ProvidersPage() {
  const { t } = useTranslation();
  const { providers, setProviders, updateProvider, removeProvider } = useAppStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'free' | 'api-key' | 'oauth' | 'local'>('all');
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; latencyMs: number; error?: string }>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProvider, setNewProvider] = useState({ name: '', displayName: '', type: 'api-key' as const, baseUrl: '', apiKey: '' });

  useEffect(() => {
    loadProviders();
  }, []);

  async function loadProviders() {
    try {
      const data = await api.getProviders();
      setProviders(data as unknown as Provider[]);
    } catch {
      // Use defaults
    }
  }

  async function handleTest(id: string) {
    setTestResults(prev => ({ ...prev, [id]: { success: false, latencyMs: 0, error: t('providers.testing') } }));
    try {
      const result = await api.testProvider(id);
      setTestResults(prev => ({ ...prev, [id]: result }));
    } catch (err) {
      setTestResults(prev => ({ ...prev, [id]: { success: false, latencyMs: 0, error: (err as Error).message } }));
    }
  }

  function handleToggle(id: string, enabled: boolean) {
    updateProvider(id, { enabled, status: enabled ? 'active' : 'inactive' });
  }

  function handleDelete(id: string) {
    if (confirm(t('common.confirm') + '?')) {
      removeProvider(id);
      api.deleteProvider(id).catch(() => {});
    }
  }

  function handleEdit(id: string) {
    // For now, toggle enabled state
    const provider = providers.find(p => p.id === id);
    if (provider) {
      handleToggle(id, !provider.enabled);
    }
  }

  async function handleAddProvider() {
    try {
      const result = await api.addProvider({
        name: newProvider.name,
        displayName: newProvider.displayName || newProvider.name,
        type: newProvider.type,
        authMethod: newProvider.type,
        baseUrl: newProvider.baseUrl,
        apiKey: newProvider.apiKey,
        enabled: true,
        models: [],
      });
      setProviders([...providers, result as unknown as Provider]);
      setShowAddModal(false);
      setNewProvider({ name: '', displayName: '', type: 'api-key', baseUrl: '', apiKey: '' });
    } catch {
      // Handle error
    }
  }

  const filteredProviders = providers.filter(p => {
    const matchesSearch = p.displayName.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || p.type === filter;
    return matchesSearch && matchesFilter;
  });

  const filterTabs = ['all', 'free', 'api-key', 'oauth', 'local'] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('providers.title')}</h1>
          <p className="text-dark-muted text-sm mt-1">
            {providers.length} {t('providers.title')} / {providers.filter(p => p.enabled).length} {t('common.enabled')}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('providers.add')}
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
          <input
            type="text"
            placeholder={t('models.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-white placeholder-dark-muted focus:outline-none focus:border-primary-600"
          />
        </div>
        <div className="flex gap-1 bg-dark-card border border-dark-border rounded-lg p-1">
          {filterTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                filter === tab ? 'bg-primary-600 text-white' : 'text-dark-muted hover:text-white'
              }`}
            >
              {tab === 'all' ? t('models.all') : tab === 'api-key' ? 'API Key' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Provider Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredProviders.map(provider => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            onToggle={handleToggle}
            onTest={handleTest}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {filteredProviders.length === 0 && (
        <div className="text-center py-12 text-dark-muted">
          <p>{t('providers.noProviders')}</p>
        </div>
      )}

      {/* Add Provider Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-[480px]">
            <h2 className="text-lg font-bold text-white mb-4">{t('providers.add')}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-dark-muted">{t('providers.name')}</label>
                <input
                  type="text"
                  value={newProvider.name}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:border-primary-600"
                  placeholder="my-provider"
                />
              </div>
              <div>
                <label className="text-sm text-dark-muted">Display Name</label>
                <input
                  type="text"
                  value={newProvider.displayName}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:border-primary-600"
                  placeholder="My Provider"
                />
              </div>
              <div>
                <label className="text-sm text-dark-muted">{t('providers.baseUrl')}</label>
                <input
                  type="text"
                  value={newProvider.baseUrl}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, baseUrl: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:border-primary-600"
                  placeholder="https://api.example.com/v1"
                />
              </div>
              <div>
                <label className="text-sm text-dark-muted">{t('providers.apiKey')}</label>
                <input
                  type="password"
                  value={newProvider.apiKey}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:border-primary-600"
                  placeholder="sk-..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm text-dark-muted hover:text-white transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAddProvider}
                className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                {t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
