import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { Plus, Search, RefreshCw, Trash2 } from 'lucide-react';
import type { IDEPlatform, IDEAccount } from '../../types/account';
import { IDE_PLATFORM_INFO } from '../../types/account';

const PLATFORMS: IDEPlatform[] = [
  'windsurf', 'kiro', 'cursor', 'copilot', 'codex', 'antigravity',
  'gemini-cli', 'codebuddy', 'codebuddy-cn', 'trae', 'zed', 'qoder',
];

export function AccountsPage() {
  const { t } = useTranslation();
  const { accounts, addAccount, removeAccount } = useAppStore();
  const [selectedPlatform, setSelectedPlatform] = useState<IDEPlatform | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccount, setNewAccount] = useState<{
    platform: IDEPlatform;
    email: string;
    displayName: string;
  }>({ platform: 'windsurf', email: '', displayName: '' });

  const filteredAccounts = accounts.filter(a => {
    const matchesPlatform = selectedPlatform === 'all' || a.platform === selectedPlatform;
    const matchesSearch = !search ||
      (a.email?.toLowerCase().includes(search.toLowerCase())) ||
      (a.displayName?.toLowerCase().includes(search.toLowerCase()));
    return matchesPlatform && matchesSearch;
  });

  function handleAddAccount() {
    const account: IDEAccount = {
      id: crypto.randomUUID(),
      platform: newAccount.platform,
      email: newAccount.email,
      displayName: newAccount.displayName || newAccount.email,
      status: 'active',
      plan: 'free',
      quotas: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addAccount(account);
    setShowAddModal(false);
    setNewAccount({ platform: 'windsurf', email: '', displayName: '' });
  }

  const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
    active: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
    inactive: { bg: 'rgba(139,134,128,0.18)', color: 'var(--primary-active)', border: 'var(--border-color)' },
    expired: { bg: 'rgba(198,87,70,0.14)', color: '#8a3a30', border: 'rgba(198,87,70,0.35)' },
    error: { bg: 'rgba(198,87,70,0.14)', color: '#8a3a30', border: 'rgba(198,87,70,0.35)' },
    suspended: { bg: 'rgba(224,170,20,0.14)', color: '#92700c', border: 'rgba(224,170,20,0.35)' },
  };

  return (
    <div className="flex flex-col gap-6" style={{ animation: 'heroEnter 0.5s ease-out both' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{t('accounts.title')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {accounts.length} {t('accounts.title')} / {PLATFORMS.length} {t('accounts.platform')}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer"
          style={{ background: 'var(--primary-color)', color: 'var(--primary-contrast)', transition: 'background 150ms ease' }}
        >
          <Plus className="w-4 h-4" />
          {t('accounts.add')}
        </button>
      </div>

      {/* Platform Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedPlatform('all')}
          className="px-3 py-1.5 text-xs rounded-lg cursor-pointer"
          style={{
            background: selectedPlatform === 'all' ? 'var(--primary-color)' : 'var(--bg-secondary)',
            color: selectedPlatform === 'all' ? 'var(--primary-contrast)' : 'var(--text-secondary)',
            border: selectedPlatform === 'all' ? 'none' : '1px solid var(--border-color)',
            fontWeight: selectedPlatform === 'all' ? 600 : 400,
            transition: 'all 150ms ease',
          }}
        >
          {t('models.all')} ({accounts.length})
        </button>
        {PLATFORMS.map(platform => {
          const info = IDE_PLATFORM_INFO[platform];
          const count = accounts.filter(a => a.platform === platform).length;
          const isActive = selectedPlatform === platform;
          return (
            <button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              className="px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
              style={{
                background: isActive ? 'var(--primary-color)' : 'var(--bg-secondary)',
                color: isActive ? 'var(--primary-contrast)' : 'var(--text-secondary)',
                border: isActive ? 'none' : '1px solid var(--border-color)',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 150ms ease',
              }}
            >
              <span>{info.icon}</span>
              <span>{info.name}</span>
              {count > 0 && <span className="rounded-full px-1.5 text-[10px]" style={{ background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--bg-tertiary)' }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
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

      {/* Accounts Table */}
      {filteredAccounts.length > 0 ? (
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
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>{t('accounts.platform')}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>{t('accounts.email')}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>{t('accounts.plan')}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>{t('accounts.status')}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>{t('accounts.quota')}</th>
                <th className="text-right px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map(account => {
                const info = IDE_PLATFORM_INFO[account.platform];
                const ss = statusStyles[account.status] ?? statusStyles.inactive;
                return (
                  <tr key={account.id} style={{ borderBottom: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)', transition: 'background 150ms ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, var(--text-primary) 4%, transparent)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span>{info.icon}</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{info.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{account.email ?? '-'}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(139,134,128,0.14)', color: 'var(--primary-active)' }}>
                        {account.plan}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>
                        {t(`accounts.${account.status}`)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {account.quotas.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {account.quotas.map((q, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="h-1 w-16 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${Math.min(100, (q.used / q.total) * 100)}%`, background: 'var(--primary-color)' }}
                                />
                              </div>
                              <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{q.used}/{q.total}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>-</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 rounded-lg cursor-pointer" style={{ color: 'var(--text-tertiary)', transition: 'color 150ms ease' }}>
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeAccount(account.id)}
                          className="p-1.5 rounded-lg cursor-pointer"
                          style={{ color: 'var(--text-tertiary)', transition: 'color 150ms ease' }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16" style={{ color: 'var(--text-tertiary)' }}>
          <p className="text-lg mb-2">{t('accounts.noAccounts')}</p>
          <p className="text-sm">{t('accounts.add')}</p>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgb(0 0 0 / 0.3)', backdropFilter: 'blur(4px)' }}>
          <div className="w-[480px] p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 48px rgb(0 0 0 / 0.22)' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{t('accounts.add')}</h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('accounts.platform')}</label>
                <select
                  value={newAccount.platform}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, platform: e.target.value as IDEPlatform }))}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  {PLATFORMS.map(p => (
                    <option key={p} value={p}>{IDE_PLATFORM_INFO[p].icon} {IDE_PLATFORM_INFO[p].name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('accounts.email')}</label>
                <input
                  type="email"
                  value={newAccount.email}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Display Name</label>
                <input
                  type="text"
                  value={newAccount.displayName}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
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
                onClick={handleAddAccount}
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
