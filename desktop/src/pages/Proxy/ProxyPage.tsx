import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { api } from '../../services/api';
import { Copy, Shield, Globe, FileText, Layers, Key, Trash2, Plus } from 'lucide-react';

const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(145deg, color-mix(in srgb, var(--bg-primary) 86%, transparent), color-mix(in srgb, var(--bg-secondary) 72%, transparent))',
  border: '1px solid color-mix(in srgb, var(--border-color) 66%, transparent)',
  borderRadius: 'var(--radius-lg)',
  backdropFilter: 'blur(var(--glass-blur))',
  boxShadow: 'var(--shadow-card)',
  padding: '20px',
};

function Toggle({ enabled }: { enabled: boolean }) {
  return (
    <div
      className="w-10 h-5 rounded-full relative cursor-pointer"
      style={{
        background: enabled ? 'var(--primary-color)' : 'var(--border-color)',
        transition: 'background 150ms ease',
      }}
    >
      <div
        className="absolute top-0.5 w-4 h-4 bg-white rounded-full"
        style={{
          transform: enabled ? 'translateX(20px)' : 'translateX(2px)',
          transition: 'transform 150ms ease',
          boxShadow: '0 1px 3px rgb(0 0 0 / 0.15)',
        }}
      />
    </div>
  );
}

export function ProxyPage() {
  const { t } = useTranslation();
  const { proxyConfig, proxyStatus, requestLogs, setProxyConfig } = useAppStore();
  const [copied, setCopied] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState('');
  const [apiKeys, setApiKeys] = useState<string[]>([]);
  const [authEnabled, setAuthEnabled] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.getKeys().then(data => {
      setApiKeys(data.keys);
      setAuthEnabled(data.authEnabled);
    }).catch(() => {});
  }, []);

  async function handleGenerateKey() {
    setGenerating(true);
    try {
      const data = await api.generateKey();
      setApiKeys(prev => [...prev, data.key]);
      setProxyConfig({ apiKeys: [...apiKeys, data.key] });
    } catch { /* ignore */ }
    setGenerating(false);
  }

  async function handleAddKey() {
    if (!newApiKey.trim()) return;
    try {
      await api.addKey(newApiKey.trim());
      setApiKeys(prev => [...prev, newApiKey.trim()]);
      setProxyConfig({ apiKeys: [...apiKeys, newApiKey.trim()] });
      setNewApiKey('');
    } catch { /* ignore */ }
  }

  async function handleDeleteKey(key: string) {
    try {
      await api.deleteKey(key);
      setApiKeys(prev => prev.filter(k => k !== key));
      setProxyConfig({ apiKeys: apiKeys.filter(k => k !== key) });
    } catch { /* ignore */ }
  }

  async function handleToggleAuth() {
    const newVal = !authEnabled;
    try {
      await api.updateAuthConfig(newVal);
      setAuthEnabled(newVal);
      setProxyConfig({ enableAuth: newVal });
    } catch { /* ignore */ }
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const endpoint = `http://${proxyConfig.host}:${proxyConfig.port}`;

  return (
    <div className="flex flex-col gap-6" style={{ animation: 'heroEnter 0.5s ease-out both' }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{t('proxy.title')}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{t('app.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Endpoint Config */}
        <div style={cardStyle}>
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Globe className="w-4 h-4" style={{ color: 'var(--primary-color)' }} />
            {t('proxy.endpoint')}
          </h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t('proxy.host')}</label>
              <input
                type="text"
                value={proxyConfig.host}
                readOnly
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t('proxy.port')}</label>
              <input
                type="number"
                value={proxyConfig.port}
                readOnly
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>OpenAI Compatible</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg text-xs font-mono truncate" style={{ background: 'var(--bg-secondary)', color: 'var(--primary-color)' }}>
                  {endpoint}/v1
                </code>
                <button
                  onClick={() => copyText(`${endpoint}/v1`, 'openai')}
                  className="p-2 rounded-lg cursor-pointer"
                  style={{ color: 'var(--text-tertiary)', transition: 'color 150ms ease' }}
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>Anthropic Compatible</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg text-xs font-mono truncate" style={{ background: 'var(--bg-secondary)', color: 'var(--primary-color)' }}>
                  {endpoint}/v1/messages
                </code>
                <button
                  onClick={() => copyText(`${endpoint}/v1/messages`, 'anthropic')}
                  className="p-2 rounded-lg cursor-pointer"
                  style={{ color: 'var(--text-tertiary)', transition: 'color 150ms ease' }}
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Routing Config */}
        <div style={cardStyle}>
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Layers className="w-4 h-4" style={{ color: 'var(--primary-color)' }} />
            {t('proxy.routing')}
          </h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t('proxy.routing')}</label>
              <select
                value={proxyConfig.routingStrategy}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              >
                <option value="round-robin">{t('proxy.roundRobin')}</option>
                <option value="priority">{t('proxy.priority')}</option>
                <option value="least-used">{t('proxy.leastUsed')}</option>
                <option value="random">{t('proxy.random')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t('proxy.maxRetries')}</label>
              <input
                type="number"
                value={proxyConfig.maxRetries}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('proxy.tierEnabled')}</span>
              <Toggle enabled={proxyConfig.tierSystem.enabled} />
            </div>
            {proxyConfig.tierSystem.enabled && (
              <div className="flex flex-col gap-2 pl-2" style={{ borderLeft: '2px solid color-mix(in srgb, var(--primary-color) 30%, transparent)' }}>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t('proxy.tier1')}: {t('proxy.priority')} 1</div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t('proxy.tier2')}: {t('proxy.priority')} 2</div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t('proxy.tier3')}: {t('proxy.priority')} 3</div>
              </div>
            )}
          </div>
        </div>

        {/* Auth Config */}
        <div style={cardStyle}>
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Shield className="w-4 h-4" style={{ color: 'var(--primary-color)' }} />
            {t('proxy.auth')}
          </h3>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('proxy.auth')}</span>
              <div onClick={handleToggleAuth}>
                <Toggle enabled={authEnabled} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t('proxy.apiKeys')} ({apiKeys.length})</label>
                <button
                  onClick={handleGenerateKey}
                  disabled={generating}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg cursor-pointer"
                  style={{ background: 'var(--primary-color)', color: 'var(--primary-contrast)', opacity: generating ? 0.6 : 1, transition: 'all 150ms ease' }}
                >
                  <Key className="w-3 h-3" />
                  {t('proxy.generateKey')}
                </button>
              </div>
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                {apiKeys.map((key, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-1.5 rounded-lg text-xs font-mono truncate" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                      {key.slice(0, 12)}{'*'.repeat(20)}
                    </code>
                    <button
                      onClick={() => copyText(key, `key-${i}`)}
                      className="p-1.5 rounded-lg cursor-pointer"
                      style={{ color: copied === `key-${i}` ? 'var(--success-color)' : 'var(--text-tertiary)', transition: 'color 150ms ease' }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteKey(key)}
                      className="p-1.5 rounded-lg cursor-pointer"
                      style={{ color: 'var(--text-tertiary)', transition: 'color 150ms ease' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddKey()}
                  placeholder="sk-..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg outline-none"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
                <button
                  onClick={handleAddKey}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg cursor-pointer"
                  style={{ background: 'var(--primary-color)', color: 'var(--primary-contrast)', transition: 'background 150ms ease' }}
                >
                  <Plus className="w-3 h-3" />
                  {t('proxy.addApiKey')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Logging */}
        <div style={cardStyle}>
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FileText className="w-4 h-4" style={{ color: 'var(--primary-color)' }} />
            {t('proxy.logging')}
          </h3>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('proxy.logging')}</span>
              <Toggle enabled={proxyConfig.logging.enabled} />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('proxy.compression')}</span>
              <Toggle enabled={proxyConfig.rtkCompression} />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('proxy.cors')}</span>
              <Toggle enabled={proxyConfig.enableCors} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Logs */}
      <div style={cardStyle}>
        <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{t('dashboard.recentRequests')}</h3>
        {requestLogs.length > 0 ? (
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
            {requestLogs.slice(0, 20).map((log, i) => (
              <div key={i} className="flex items-center gap-4 px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--bg-secondary)' }}>
                <span
                  className="px-1.5 py-0.5 rounded font-semibold"
                  style={{
                    background: log.status < 400 ? '#d1fae5' : 'rgba(198,87,70,0.14)',
                    color: log.status < 400 ? '#065f46' : '#8a3a30',
                  }}
                >
                  {log.status}
                </span>
                <span className="font-mono flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{log.model}</span>
                <span style={{ color: 'var(--text-tertiary)' }}>{log.provider}</span>
                <span style={{ color: 'var(--text-tertiary)' }}>{log.latencyMs}{t('common.ms')}</span>
                <span style={{ color: 'var(--text-tertiary)' }}>{log.inputTokens + log.outputTokens} tok</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-tertiary)' }}>{t('common.noData')}</p>
        )}
      </div>
    </div>
  );
}
