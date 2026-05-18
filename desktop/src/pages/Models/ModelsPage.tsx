import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { api } from '../../services/api';
import { Search, Box, Check, X, Wrench, Eye } from 'lucide-react';

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  providerName: string;
  contextWindow: number;
  streaming: boolean;
  toolCalling: boolean;
  vision: boolean;
  pricing: { input: number; output: number } | null;
  available: boolean;
}

export function ModelsPage() {
  const { t } = useTranslation();
  const { providers } = useAppStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [models, setModels] = useState<ModelInfo[]>([]);

  useEffect(() => {
    buildModelList();
  }, [providers]);

  function buildModelList() {
    const list: ModelInfo[] = [];
    for (const provider of providers) {
      for (const model of provider.models) {
        list.push({
          id: `${provider.id}:${model.name}`,
          name: model.name,
          provider: provider.id,
          providerName: provider.displayName,
          contextWindow: model.contextWindow ?? 128000,
          streaming: model.supportsStreaming,
          toolCalling: model.supportsTools,
          vision: model.supportsVision,
          pricing: model.pricing ? { input: model.pricing.inputPer1M / 1000, output: model.pricing.outputPer1M / 1000 } : null,
          available: provider.enabled && provider.status === 'active',
        });
      }
    }
    setModels(list);
  }

  const filtered = models.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.providerName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' ||
      (filter === 'free' && (!m.pricing || (m.pricing.input === 0 && m.pricing.output === 0))) ||
      (filter === 'paid' && m.pricing && (m.pricing.input > 0 || m.pricing.output > 0));
    return matchesSearch && matchesFilter;
  });

  const freeCount = models.filter(m => !m.pricing || (m.pricing.input === 0 && m.pricing.output === 0)).length;
  const paidCount = models.length - freeCount;

  function formatContextWindow(tokens: number): string {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(0)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`;
    return `${tokens}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('models.title')}</h1>
          <p className="text-dark-muted text-sm mt-1">
            {models.length} {t('models.available')} / {freeCount} {t('models.free')} / {paidCount} {t('models.paid')}
          </p>
        </div>
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
          {(['all', 'free', 'paid'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                filter === tab ? 'bg-primary-600 text-white' : 'text-dark-muted hover:text-white'
              }`}
            >
              {t(`models.${tab}`)}
              <span className="ml-1 text-[10px]">
                ({tab === 'all' ? models.length : tab === 'free' ? freeCount : paidCount})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Models Table */}
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-border">
              <th className="text-left px-5 py-3 text-xs text-dark-muted font-medium">{t('models.name')}</th>
              <th className="text-left px-5 py-3 text-xs text-dark-muted font-medium">{t('models.provider')}</th>
              <th className="text-center px-5 py-3 text-xs text-dark-muted font-medium">{t('models.context')}</th>
              <th className="text-center px-5 py-3 text-xs text-dark-muted font-medium">{t('models.streaming')}</th>
              <th className="text-center px-5 py-3 text-xs text-dark-muted font-medium">{t('models.tools')}</th>
              <th className="text-center px-5 py-3 text-xs text-dark-muted font-medium">{t('models.vision')}</th>
              <th className="text-right px-5 py-3 text-xs text-dark-muted font-medium">{t('models.pricing')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(model => (
              <tr key={model.id} className={`border-b border-dark-border/50 hover:bg-dark-border/20 ${!model.available ? 'opacity-50' : ''}`}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-primary-400" />
                    <span className="text-sm text-white font-mono">{model.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="text-sm text-dark-text">{model.providerName}</span>
                </td>
                <td className="px-5 py-3 text-center">
                  <span className="text-sm text-dark-text">{formatContextWindow(model.contextWindow)}</span>
                </td>
                <td className="px-5 py-3 text-center">
                  {model.streaming ? (
                    <Check className="w-4 h-4 text-green-400 mx-auto" />
                  ) : (
                    <X className="w-4 h-4 text-dark-muted mx-auto" />
                  )}
                </td>
                <td className="px-5 py-3 text-center">
                  {model.toolCalling ? (
                    <Wrench className="w-4 h-4 text-blue-400 mx-auto" />
                  ) : (
                    <X className="w-4 h-4 text-dark-muted mx-auto" />
                  )}
                </td>
                <td className="px-5 py-3 text-center">
                  {model.vision ? (
                    <Eye className="w-4 h-4 text-purple-400 mx-auto" />
                  ) : (
                    <X className="w-4 h-4 text-dark-muted mx-auto" />
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  {!model.pricing || (model.pricing.input === 0 && model.pricing.output === 0) ? (
                    <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">{t('models.free')}</span>
                  ) : (
                    <span className="text-xs text-dark-muted">
                      ${model.pricing.input.toFixed(4)}/{model.pricing.output.toFixed(4)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-dark-muted">
          <Box className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t('common.noData')}</p>
        </div>
      )}
    </div>
  );
}
