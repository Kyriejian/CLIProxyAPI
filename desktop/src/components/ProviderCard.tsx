import { useTranslation } from 'react-i18next';
import { Cloud, MoreVertical, Zap, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import type { Provider } from '../types/provider';

interface ProviderCardProps {
  provider: Provider;
  onToggle: (id: string, enabled: boolean) => void;
  onTest: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<string, string> = {
  active: 'text-green-400',
  inactive: 'text-gray-500',
  error: 'text-red-400',
  'rate-limited': 'text-yellow-400',
  'quota-exhausted': 'text-orange-400',
};

const typeColors: Record<string, string> = {
  free: 'bg-green-500/20 text-green-400',
  oauth: 'bg-blue-500/20 text-blue-400',
  'api-key': 'bg-purple-500/20 text-purple-400',
  local: 'bg-orange-500/20 text-orange-400',
};

export function ProviderCard({ provider, onToggle, onTest, onEdit, onDelete }: ProviderCardProps) {
  const { t } = useTranslation();

  return (
    <div className={`bg-dark-card border rounded-xl p-5 transition-all ${
      provider.enabled ? 'border-dark-border hover:border-primary-600/50' : 'border-dark-border/50 opacity-60'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-dark-border rounded-lg flex items-center justify-center">
            <Cloud className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h3 className="text-white font-medium">{provider.displayName}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[provider.type] ?? 'bg-gray-500/20 text-gray-400'}`}>
                {t(`providers.${provider.type === 'api-key' ? 'apikey' : provider.type}`)}
              </span>
              <span className={`flex items-center gap-1 text-xs ${statusColors[provider.status] ?? 'text-gray-400'}`}>
                {provider.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {t(`providers.${provider.status}`)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggle(provider.id, !provider.enabled)}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
              provider.enabled
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                : 'bg-dark-border text-dark-muted hover:bg-dark-border/80'
            }`}
          >
            {provider.enabled ? t('common.enabled') : t('common.disabled')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div>
          <span className="text-dark-muted">{t('providers.models')}:</span>
          <span className="text-white ml-1">{provider.models.length}</span>
        </div>
        <div>
          <span className="text-dark-muted">{t('providers.priority')}:</span>
          <span className="text-white ml-1">{provider.priority}</span>
        </div>
        {provider.baseUrl && (
          <div className="col-span-2 truncate">
            <span className="text-dark-muted">URL:</span>
            <span className="text-white ml-1 text-xs">{provider.baseUrl}</span>
          </div>
        )}
      </div>

      {provider.quota && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-dark-muted mb-1">
            <span>{t('accounts.quota')}</span>
            <span>{provider.quota.used}/{provider.quota.total} {provider.quota.unit}</span>
          </div>
          <div className="h-1.5 bg-dark-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, (provider.quota.used / provider.quota.total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onTest(provider.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs bg-dark-border hover:bg-dark-border/80 text-dark-muted hover:text-white rounded-lg transition-colors"
        >
          <Zap className="w-3 h-3" />
          {t('providers.test')}
        </button>
        <button
          onClick={() => onEdit(provider.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs bg-dark-border hover:bg-dark-border/80 text-dark-muted hover:text-white rounded-lg transition-colors"
        >
          {t('common.edit')}
        </button>
        <button
          onClick={() => onDelete(provider.id)}
          className="py-1.5 px-2.5 text-xs bg-dark-border hover:bg-red-500/20 text-dark-muted hover:text-red-400 rounded-lg transition-colors"
        >
          {t('common.delete')}
        </button>
      </div>
    </div>
  );
}
