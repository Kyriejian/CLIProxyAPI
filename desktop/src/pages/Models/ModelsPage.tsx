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
    <div className="flex flex-col gap-6" style={{ animation: 'heroEnter 0.5s ease-out both' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{t('models.title')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {models.length} {t('models.available')} / {freeCount} {t('models.free')} / {paidCount} {t('models.paid')}
          </p>
        </div>
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
          {(['all', 'free', 'paid'] as const).map(tab => (
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
              {t(`models.${tab}`)}
              <span className="ml-1 text-[10px]">
                ({tab === 'all' ? models.length : tab === 'free' ? freeCount : paidCount})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Models Table */}
      <div
        className="overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, color-mix(in srgb, var(--bg-primary) 86%, transparent), color-mix(in srgb, var(--bg-secondary) 72%, transparent))',
          border: '1px solid color-mix(in srgb, var(--border-color) 66%, transparent)',
          borderRadius: 'var(--radius-lg)',
          backdropFilter: 'blur(var(--glass-blur))',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>{t('models.name')}</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>{t('models.provider')}</th>
              <th className="text-center px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>{t('models.context')}</th>
              <th className="text-center px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>{t('models.streaming')}</th>
              <th className="text-center px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>{t('models.tools')}</th>
              <th className="text-center px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>{t('models.vision')}</th>
              <th className="text-right px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>{t('models.pricing')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(model => (
              <tr
                key={model.id}
                style={{
                  borderBottom: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)',
                  opacity: model.available ? 1 : 0.5,
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, var(--text-primary) 4%, transparent)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4" style={{ color: 'var(--primary-color)' }} />
                    <span className="text-sm font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{model.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{model.providerName}</span>
                </td>
                <td className="px-5 py-3 text-center">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatContextWindow(model.contextWindow)}</span>
                </td>
                <td className="px-5 py-3 text-center">
                  {model.streaming ? (
                    <Check className="w-4 h-4 mx-auto" style={{ color: 'var(--success-color)' }} />
                  ) : (
                    <X className="w-4 h-4 mx-auto" style={{ color: 'var(--text-quaternary)' }} />
                  )}
                </td>
                <td className="px-5 py-3 text-center">
                  {model.toolCalling ? (
                    <Wrench className="w-4 h-4 mx-auto" style={{ color: '#3b82f6' }} />
                  ) : (
                    <X className="w-4 h-4 mx-auto" style={{ color: 'var(--text-quaternary)' }} />
                  )}
                </td>
                <td className="px-5 py-3 text-center">
                  {model.vision ? (
                    <Eye className="w-4 h-4 mx-auto" style={{ color: '#8b5cf6' }} />
                  ) : (
                    <X className="w-4 h-4 mx-auto" style={{ color: 'var(--text-quaternary)' }} />
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  {!model.pricing || (model.pricing.input === 0 && model.pricing.output === 0) ? (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' }}>{t('models.free')}</span>
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
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
        <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
          <Box className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t('common.noData')}</p>
        </div>
      )}
    </div>
  );
}
