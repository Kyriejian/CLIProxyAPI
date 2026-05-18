import { useTranslation } from 'react-i18next';
import { Cloud, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import type { Provider } from '../types/provider';

interface ProviderCardProps {
  provider: Provider;
  onToggle: (id: string, enabled: boolean) => void;
  onTest: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ProviderCard({ provider, onToggle, onTest, onEdit, onDelete }: ProviderCardProps) {
  const { t } = useTranslation();

  const statusBadge = provider.status === 'active'
    ? { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' }
    : provider.status === 'error'
      ? { bg: 'rgba(198, 87, 70, 0.14)', color: '#8a3a30', border: 'rgba(198, 87, 70, 0.35)' }
      : { bg: 'rgba(139, 134, 128, 0.18)', color: 'var(--primary-active)', border: 'var(--border-color)' };

  const typeBadge = provider.type === 'free'
    ? { bg: '#d1fae5', color: '#065f46' }
    : provider.type === 'oauth'
      ? { bg: 'rgba(59, 130, 246, 0.12)', color: '#1e40af' }
      : provider.type === 'api-key'
        ? { bg: 'rgba(139, 92, 246, 0.12)', color: '#5b21b6' }
        : { bg: 'rgba(249, 115, 22, 0.12)', color: '#9a3412' };

  return (
    <div
      className="flex flex-col gap-3 p-5"
      style={{
        background: 'linear-gradient(145deg, color-mix(in srgb, var(--bg-primary) 86%, transparent), color-mix(in srgb, var(--bg-secondary) 72%, transparent))',
        border: '1px solid color-mix(in srgb, var(--border-color) 66%, transparent)',
        borderRadius: 'var(--radius-lg)',
        backdropFilter: 'blur(var(--glass-blur))',
        boxShadow: 'var(--shadow-card)',
        transition: 'border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease',
        opacity: provider.enabled ? 1 : 0.6,
        animation: 'cardEnter 0.4s ease-out both',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--border-hover) 82%, transparent)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--border-color) 66%, transparent)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 flex items-center justify-center flex-shrink-0"
            style={{
              borderRadius: 'var(--radius-md)',
              background: 'color-mix(in srgb, var(--primary-color) 10%, var(--bg-secondary))',
              color: 'var(--primary-color)',
            }}
          >
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{provider.displayName}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: typeBadge.bg, color: typeBadge.color }}>
                {t(`providers.${provider.type === 'api-key' ? 'apikey' : provider.type}`)}
              </span>
              <span className="flex items-center gap-1 text-xs font-medium" style={{ color: statusBadge.color }}>
                {provider.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {t(`providers.${provider.status}`)}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onToggle(provider.id, !provider.enabled)}
          className="px-2.5 py-1 text-xs rounded-md font-semibold"
          style={{
            background: provider.enabled ? statusBadge.bg : 'var(--bg-tertiary)',
            color: provider.enabled ? statusBadge.color : 'var(--text-tertiary)',
            border: `1px solid ${provider.enabled ? statusBadge.border : 'var(--border-color)'}`,
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
        >
          {provider.enabled ? t('common.enabled') : t('common.disabled')}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span style={{ color: 'var(--text-tertiary)' }}>{t('providers.models')}:</span>
          <span className="ml-1 font-medium" style={{ color: 'var(--text-primary)' }}>{provider.models.length}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-tertiary)' }}>{t('providers.priority')}:</span>
          <span className="ml-1 font-medium" style={{ color: 'var(--text-primary)' }}>{provider.priority}</span>
        </div>
        {provider.baseUrl && (
          <div className="col-span-2 truncate">
            <span style={{ color: 'var(--text-tertiary)' }}>URL:</span>
            <span className="ml-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{provider.baseUrl}</span>
          </div>
        )}
      </div>

      {provider.quota && (
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
            <span>{t('accounts.quota')}</span>
            <span>{provider.quota.used}/{provider.quota.total} {provider.quota.unit}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (provider.quota.used / provider.quota.total) * 100)}%`,
                background: 'var(--primary-color)',
              }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onTest(provider.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg cursor-pointer"
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            transition: 'all 150ms ease',
          }}
        >
          <Zap className="w-3 h-3" />
          {t('providers.test')}
        </button>
        <button
          onClick={() => onEdit(provider.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg cursor-pointer"
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            transition: 'all 150ms ease',
          }}
        >
          {t('common.edit')}
        </button>
        <button
          onClick={() => onDelete(provider.id)}
          className="py-1.5 px-2.5 text-xs font-medium rounded-lg cursor-pointer"
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--text-tertiary)',
            border: '1px solid var(--border-color)',
            transition: 'all 150ms ease',
          }}
        >
          {t('common.delete')}
        </button>
      </div>
    </div>
  );
}
