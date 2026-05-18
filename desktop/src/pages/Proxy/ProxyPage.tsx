import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { Copy, Shield, Globe, FileText, Layers } from 'lucide-react';

export function ProxyPage() {
  const { t } = useTranslation();
  const { proxyConfig, proxyStatus, requestLogs } = useAppStore();
  const [copied, setCopied] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState('');

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const endpoint = `http://${proxyConfig.host}:${proxyConfig.port}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('proxy.title')}</h1>
          <p className="text-dark-muted text-sm mt-1">{t('app.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Endpoint Config */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary-400" />
            {t('proxy.endpoint')}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-dark-muted">{t('proxy.host')}</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  value={proxyConfig.host}
                  readOnly
                  className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-white"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-dark-muted">{t('proxy.port')}</label>
              <input
                type="number"
                value={proxyConfig.port}
                readOnly
                className="w-full mt-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-white"
              />
            </div>
            <div className="pt-2 border-t border-dark-border">
              <p className="text-xs text-dark-muted mb-2">OpenAI Compatible</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-dark-bg rounded-lg text-xs text-primary-400 font-mono truncate">
                  {endpoint}/v1
                </code>
                <button
                  onClick={() => copyText(`${endpoint}/v1`, 'openai')}
                  className="p-2 text-dark-muted hover:text-white rounded-lg hover:bg-dark-border/50 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs text-dark-muted mb-2">Anthropic Compatible</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-dark-bg rounded-lg text-xs text-primary-400 font-mono truncate">
                  {endpoint}/v1/messages
                </code>
                <button
                  onClick={() => copyText(`${endpoint}/v1/messages`, 'anthropic')}
                  className="p-2 text-dark-muted hover:text-white rounded-lg hover:bg-dark-border/50 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Routing Config */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary-400" />
            {t('proxy.routing')}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-dark-muted">{t('proxy.routing')}</label>
              <select
                value={proxyConfig.routingStrategy}
                className="w-full mt-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-white"
              >
                <option value="round-robin">{t('proxy.roundRobin')}</option>
                <option value="priority">{t('proxy.priority')}</option>
                <option value="least-used">{t('proxy.leastUsed')}</option>
                <option value="random">{t('proxy.random')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-dark-muted">{t('proxy.maxRetries')}</label>
              <input
                type="number"
                value={proxyConfig.maxRetries}
                className="w-full mt-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-white"
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-dark-text">{t('proxy.tierEnabled')}</span>
              <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${
                              proxyConfig.tierSystem.enabled ? 'bg-primary-600' : 'bg-dark-border'
                            }`}>
                              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                                proxyConfig.tierSystem.enabled ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </div>
            </div>
            {proxyConfig.tierSystem.enabled && (
              <div className="space-y-2 pl-2 border-l-2 border-primary-600/30">
                <div className="text-xs text-dark-muted">{t('proxy.tier1')}: {t('proxy.priority')} 1</div>
                <div className="text-xs text-dark-muted">{t('proxy.tier2')}: {t('proxy.priority')} 2</div>
                <div className="text-xs text-dark-muted">{t('proxy.tier3')}: {t('proxy.priority')} 3</div>
              </div>
            )}
          </div>
        </div>

        {/* Auth Config */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary-400" />
            {t('proxy.auth')}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-dark-text">{t('proxy.auth')}</span>
              <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${
                              proxyConfig.enableAuth ? 'bg-primary-600' : 'bg-dark-border'
                            }`}>
                              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                                proxyConfig.enableAuth ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </div>
            </div>
            <div>
              <label className="text-xs text-dark-muted">{t('proxy.apiKeys')}</label>
              <div className="mt-2 space-y-2">
                {proxyConfig.apiKeys.map((key, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-1.5 bg-dark-bg rounded-lg text-xs text-dark-text font-mono truncate">
                      {key.slice(0, 8)}{'*'.repeat(24)}
                    </code>
                    <button className="p-1.5 text-dark-muted hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors text-xs">
                      {t('common.delete')}
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="flex-1 px-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-xs text-white placeholder-dark-muted focus:outline-none focus:border-primary-600"
                />
                <button className="px-3 py-1.5 text-xs bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
                  {t('proxy.addApiKey')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Logging */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-400" />
            {t('proxy.logging')}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-dark-text">{t('proxy.logging')}</span>
              <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${
                              proxyConfig.logging.enabled ? 'bg-primary-600' : 'bg-dark-border'
                            }`}>
                              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                                proxyConfig.logging.enabled ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-dark-text">{t('proxy.compression')}</span>
              <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${
                              proxyConfig.rtkCompression ? 'bg-primary-600' : 'bg-dark-border'
                            }`}>
                              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                                proxyConfig.rtkCompression ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-dark-text">{t('proxy.cors')}</span>
              <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${
                              proxyConfig.enableCors ? 'bg-primary-600' : 'bg-dark-border'
                            }`}>
                              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                                proxyConfig.enableCors ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Logs */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-white font-medium mb-4">{t('dashboard.recentRequests')}</h3>
        {requestLogs.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {requestLogs.slice(0, 20).map((log, i) => (
              <div key={i} className="flex items-center gap-4 px-3 py-2 bg-dark-bg rounded-lg text-xs">
                <span className={`px-1.5 py-0.5 rounded ${
                                  log.status < 400 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {log.status}
                </span>
                <span className="text-dark-text font-mono flex-1 truncate">{log.model}</span>
                <span className="text-dark-muted">{log.provider}</span>
                <span className="text-dark-muted">{log.latencyMs}{t('common.ms')}</span>
                <span className="text-dark-muted">{log.inputTokens + log.outputTokens} tok</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-dark-muted text-center py-8">{t('common.noData')}</p>
        )}
      </div>
    </div>
  );
}
