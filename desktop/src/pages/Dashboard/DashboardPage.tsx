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
  Play,
  Square,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('dashboard.title')}</h1>
          <p className="text-dark-muted text-sm mt-1">
            {t('app.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={copyEndpoint}
            className="flex items-center gap-2 px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-dark-muted hover:text-white hover:border-primary-600/50 transition-colors"
          >
            <Copy className="w-4 h-4" />
            {copied ? t('common.copied') : t('dashboard.copyEndpoint')}
          </button>
          <button
            onClick={loadStatus}
            className="flex items-center gap-2 px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-dark-muted hover:text-white hover:border-primary-600/50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t('dashboard.refreshStatus')}
          </button>
        </div>
      </div>

      {/* Proxy Endpoint Banner */}
      <div className="bg-gradient-to-r from-primary-600/20 to-primary-800/20 border border-primary-600/30 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-primary-300 mb-1">{t('proxy.endpoint')}</p>
            <p className="text-lg font-mono text-white">
              http://{proxyConfig.host}:{proxyConfig.port}/v1
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              proxyStatus === 'running' ? 'bg-green-400 animate-pulse-dot' :
              proxyStatus === 'error' ? 'bg-red-400' : 'bg-gray-500'
            }`} />
            <span className="text-sm text-white font-medium">
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
          icon={<Activity className="w-5 h-5 text-white" />}
          color="bg-blue-600"
        />
        <StatusCard
          title={t('dashboard.successRate')}
          value={`${successRate}%`}
          icon={<CheckCircle className="w-5 h-5 text-white" />}
          color="bg-green-600"
        />
        <StatusCard
          title={t('dashboard.avgLatency')}
          value={`${proxyStats.avgLatencyMs} ${t('common.ms')}`}
          icon={<Clock className="w-5 h-5 text-white" />}
          color="bg-yellow-600"
        />
        <StatusCard
          title={t('dashboard.tokensUsed')}
          value={proxyStats.totalTokensUsed.toLocaleString()}
          subtitle={proxyStats.tokensSaved > 0 ? `${t('dashboard.tokensSaved')}: ${proxyStats.tokensSaved.toLocaleString()}` : undefined}
          icon={<Cpu className="w-5 h-5 text-white" />}
          color="bg-purple-600"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatusCard
          title={t('dashboard.uptime')}
          value={formatUptime(proxyStats.uptime)}
          icon={<Zap className="w-5 h-5 text-white" />}
          color="bg-emerald-600"
        />
        <StatusCard
          title={t('dashboard.activeProviders')}
          value={activeProviders}
          icon={<Cloud className="w-5 h-5 text-white" />}
          color="bg-indigo-600"
        />
        <StatusCard
          title={t('dashboard.totalModels')}
          value={totalModels}
          icon={<Box className="w-5 h-5 text-white" />}
          color="bg-pink-600"
        />
        <StatusCard
          title="RPM"
          value={proxyStats.requestsPerMinute.toFixed(1)}
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          color="bg-orange-600"
        />
      </div>

      {/* CLI Configuration Guide */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-white font-medium mb-4">{t('proxy.cliConfig')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-dark-bg rounded-lg p-4">
            <p className="text-xs text-primary-400 mb-2">Claude Code / OpenClaw</p>
            <pre className="text-xs text-dark-text font-mono whitespace-pre-wrap">{`export ANTHROPIC_BASE_URL=http://${proxyConfig.host}:${proxyConfig.port}
export ANTHROPIC_API_KEY=unused`}</pre>
          </div>
          <div className="bg-dark-bg rounded-lg p-4">
            <p className="text-xs text-primary-400 mb-2">Cursor / Codex / Aider</p>
            <pre className="text-xs text-dark-text font-mono whitespace-pre-wrap">{`export OPENAI_BASE_URL=http://${proxyConfig.host}:${proxyConfig.port}/v1
export OPENAI_API_KEY=unused`}</pre>
          </div>
          <div className="bg-dark-bg rounded-lg p-4">
            <p className="text-xs text-primary-400 mb-2">Windsurf / Kiro</p>
            <pre className="text-xs text-dark-text font-mono whitespace-pre-wrap">{`Endpoint: http://${proxyConfig.host}:${proxyConfig.port}/v1
API Key: unused`}</pre>
          </div>
          <div className="bg-dark-bg rounded-lg p-4">
            <p className="text-xs text-primary-400 mb-2">Gemini CLI</p>
            <pre className="text-xs text-dark-text font-mono whitespace-pre-wrap">{`export GEMINI_API_KEY=unused
export GEMINI_BASE_URL=http://${proxyConfig.host}:${proxyConfig.port}`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
