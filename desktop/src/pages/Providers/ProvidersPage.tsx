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
    <div className="flex flex-col gap-6" style={{ animation: 'heroEnter 0.5s ease-out both' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{t('providers.title')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {providers.length} {t('providers.title')} / {providers.filter(p => p.enabled).length} {t('common.enabled')}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer"
          style={{ background: 'var(--primary-color)', color: 'var(--primary-contrast)', transition: 'background 150ms ease' }}
        >
          <Plus className="w-4 h-4" />
          {t('providers.add')}
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder={t('models.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg outline-none"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          {filterTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className="px-3 py-1 text-xs rounded-md cursor-pointer"
              style={{
                background: filter === tab ? 'var(--primary-color)' : 'transparent',
                color: filter === tab ? 'var(--primary-contrast)' : 'var(--text-secondary)',
                fontWeight: filter === tab ? 600 : 400,
                transition: 'all 150ms ease',
              }}
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
        <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
          <p>{t('providers.noProviders')}</p>
        </div>
      )}

      {/* Add Provider Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgb(0 0 0 / 0.3)', backdropFilter: 'blur(4px)' }}>
          <div className="w-[480px] p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 48px rgb(0 0 0 / 0.22)' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{t('providers.add')}</h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('providers.name')}</label>
                <input
                  type="text"
                  value={newProvider.name}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="my-provider"
                />
              </div>
              <div>
                <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Display Name</label>
                <input
                  type="text"
                  value={newProvider.displayName}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="My Provider"
                />
              </div>
              <div>
                <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('providers.baseUrl')}</label>
                <input
                  type="text"
                  value={newProvider.baseUrl}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, baseUrl: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="https://api.example.com/v1"
                />
              </div>
              <div>
                <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('providers.apiKey')}</label>
                <input
                  type="password"
                  value={newProvider.apiKey}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="sk-..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm cursor-pointer"
                style={{ color: 'var(--text-secondary)', transition: 'color 150ms ease' }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAddProvider}
                className="px-4 py-2 text-sm rounded-lg cursor-pointer"
                style={{ background: 'var(--primary-color)', color: 'var(--primary-contrast)', transition: 'background 150ms ease' }}
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
