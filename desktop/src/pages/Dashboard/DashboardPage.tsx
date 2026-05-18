import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { StatusCard } from '../../components/StatusCard';
import { api } from '../../services/api';
import {
  Activity,
  CheckCircle,
  Clock,
  Cpu,
  Zap,
  Cloud,
  Box,
  RefreshCw,
  Copy,
  TrendingUp,
} from 'lucide-react';

export function DashboardPage() {
  const { t } = useTranslation();
  const {
    proxyStatus, proxyStats, proxyConfig,
    setProxyStatus, setProxyStats, providers,
  } = useAppStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadStatus() {
    try {
      const status = await api.getStatus();
      setProxyStatus(status.status as 'running' | 'stopped');
      setProxyStats({
        totalRequests: status.stats.totalRequests ?? 0,
        successfulRequests: status.stats.successfulRequests ?? 0,
        failedRequests: status.stats.failedRequests ?? 0,
        totalTokensUsed: status.stats.totalTokensUsed ?? 0,
        tokensSaved: status.stats.tokensSaved ?? 0,
        avgLatencyMs: status.stats.avgLatencyMs ?? 0,
        requestsPerMinute: status.stats.requestsPerMinute ?? 0,
        uptime: status.stats.uptime ?? 0,
        activeConnections: status.stats.activeConnections ?? 0,
      });
    } catch {
      // Proxy might not be running yet
    }
  }

  function formatUptime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  function copyEndpoint() {
    const endpoint = `http://${proxyConfig.host}:${proxyConfig.port}/v1`;
    navigator.clipboard.writeText(endpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const successRate = proxyStats.totalRequests > 0
    ? Math.round((proxyStats.successfulRequests / proxyStats.totalRequests) * 100)
    : 0;

  const activeProviders = providers.filter(p => p.enabled && p.status === 'active').length;
  const totalModels = providers.reduce((sum, p) => sum + p.models.length, 0);

  return (
    <div className="flex flex-col gap-6" style={{ animation: 'heroEnter 0.5s ease-out both' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{t('dashboard.title')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {t('app.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={copyEndpoint}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer"
            style={{
              background: 'color-mix(in srgb, var(--bg-primary) 68%, transparent)',
              color: 'var(--text-secondary)',
              border: '1px solid color-mix(in srgb, var(--border-color) 68%, transparent)',
              transition: 'border-color 150ms ease, color 150ms ease',
            }}
          >
            <Copy className="w-4 h-4" />
            {copied ? t('common.copied') : t('dashboard.copyEndpoint')}
          </button>
          <button
            onClick={loadStatus}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer"
            style={{
              background: 'color-mix(in srgb, var(--bg-primary) 68%, transparent)',
              color: 'var(--text-secondary)',
              border: '1px solid color-mix(in srgb, var(--border-color) 68%, transparent)',
              transition: 'border-color 150ms ease, color 150ms ease',
            }}
          >
            <RefreshCw className="w-4 h-4" />
            {t('dashboard.refreshStatus')}
          </button>
        </div>
      </div>

      {/* Proxy Endpoint Banner */}
      <div
        className="p-5"
        style={{
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 8%, var(--bg-primary)), color-mix(in srgb, var(--primary-color) 14%, var(--bg-secondary)))',
          border: '1px solid color-mix(in srgb, var(--primary-color) 22%, var(--border-color))',
          borderRadius: 'var(--radius-lg)',
          backdropFilter: 'blur(var(--glass-blur))',
          animation: 'fadeSlideUp 0.5s ease-out both',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{t('proxy.endpoint')}</p>
            <p className="text-lg font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
              http://{proxyConfig.host}:{proxyConfig.port}/v1
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              proxyStatus === 'running' ? 'animate-pulse-dot' : ''
            }`} style={{
              background: proxyStatus === 'running' ? 'var(--success-color)' :
                         proxyStatus === 'error' ? 'var(--error-color)' : 'var(--text-quaternary)',
              boxShadow: proxyStatus === 'running' ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none',
            }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t(`dashboard.${proxyStatus}`)}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <StatusCard
          title={t('dashboard.totalRequests')}
          value={proxyStats.totalRequests.toLocaleString()}
          icon={<Activity className="w-5 h-5" />}
        />
        <StatusCard
          title={t('dashboard.successRate')}
          value={`${successRate}%`}
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <StatusCard
          title={t('dashboard.avgLatency')}
          value={`${proxyStats.avgLatencyMs} ${t('common.ms')}`}
          icon={<Clock className="w-5 h-5" />}
        />
        <StatusCard
          title={t('dashboard.tokensUsed')}
          value={proxyStats.totalTokensUsed.toLocaleString()}
          subtitle={proxyStats.tokensSaved > 0 ? `${t('dashboard.tokensSaved')}: ${proxyStats.tokensSaved.toLocaleString()}` : undefined}
          icon={<Cpu className="w-5 h-5" />}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatusCard
          title={t('dashboard.uptime')}
          value={formatUptime(proxyStats.uptime)}
          icon={<Zap className="w-5 h-5" />}
        />
        <StatusCard
          title={t('dashboard.activeProviders')}
          value={activeProviders}
          icon={<Cloud className="w-5 h-5" />}
        />
        <StatusCard
          title={t('dashboard.totalModels')}
          value={totalModels}
          icon={<Box className="w-5 h-5" />}
        />
        <StatusCard
          title="RPM"
          value={proxyStats.requestsPerMinute.toFixed(1)}
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      {/* CLI Configuration Guide */}
      <div
        className="p-6"
        style={{
          background: 'linear-gradient(145deg, color-mix(in srgb, var(--bg-primary) 86%, transparent), color-mix(in srgb, var(--bg-secondary) 72%, transparent))',
          border: '1px solid color-mix(in srgb, var(--border-color) 66%, transparent)',
          borderRadius: 'var(--radius-lg)',
          backdropFilter: 'blur(var(--glass-blur))',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{t('proxy.cliConfig')}</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Claude Code / OpenClaw', code: `export ANTHROPIC_BASE_URL=http://${proxyConfig.host}:${proxyConfig.port}\nexport ANTHROPIC_API_KEY=unused` },
            { label: 'Cursor / Codex / Aider', code: `export OPENAI_BASE_URL=http://${proxyConfig.host}:${proxyConfig.port}/v1\nexport OPENAI_API_KEY=unused` },
            { label: 'Windsurf / Kiro', code: `Endpoint: http://${proxyConfig.host}:${proxyConfig.port}/v1\nAPI Key: unused` },
            { label: 'Gemini CLI', code: `export GEMINI_API_KEY=unused\nexport GEMINI_BASE_URL=http://${proxyConfig.host}:${proxyConfig.port}` },
          ].map((item) => (
            <div key={item.label} className="p-4 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--primary-color)' }}>{item.label}</p>
              <pre className="text-xs font-mono whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{item.code}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
