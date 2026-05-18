import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { Plus, Search, RefreshCw, Trash2, ExternalLink } from 'lucide-react';
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

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    inactive: 'bg-gray-500/20 text-gray-400',
    expired: 'bg-red-500/20 text-red-400',
    error: 'bg-red-500/20 text-red-400',
    suspended: 'bg-orange-500/20 text-orange-400',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('accounts.title')}</h1>
          <p className="text-dark-muted text-sm mt-1">
            {accounts.length} {t('accounts.title')} / {PLATFORMS.length} {t('accounts.platform')}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('accounts.add')}
        </button>
      </div>

      {/* Platform Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedPlatform('all')}
          className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
            selectedPlatform === 'all' ? 'bg-primary-600 text-white' : 'bg-dark-card border border-dark-border text-dark-muted hover:text-white'
          }`}
        >
          {t('models.all')} ({accounts.length})
        </button>
        {PLATFORMS.map(platform => {
          const info = IDE_PLATFORM_INFO[platform];
          const count = accounts.filter(a => a.platform === platform).length;
          return (
            <button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1.5 ${
                selectedPlatform === platform ? 'bg-primary-600 text-white' : 'bg-dark-card border border-dark-border text-dark-muted hover:text-white'
              }`}
            >
              <span>{info.icon}</span>
              <span>{info.name}</span>
              {count > 0 && <span className="bg-dark-border rounded-full px-1.5 text-[10px]">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
        <input
          type="text"
          placeholder={t('models.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-white placeholder-dark-muted focus:outline-none focus:border-primary-600"
        />
      </div>

      {/* Accounts Table */}
      {filteredAccounts.length > 0 ? (
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left px-5 py-3 text-xs text-dark-muted font-medium">{t('accounts.platform')}</th>
                <th className="text-left px-5 py-3 text-xs text-dark-muted font-medium">{t('accounts.email')}</th>
                <th className="text-left px-5 py-3 text-xs text-dark-muted font-medium">{t('accounts.plan')}</th>
                <th className="text-left px-5 py-3 text-xs text-dark-muted font-medium">{t('accounts.status')}</th>
                <th className="text-left px-5 py-3 text-xs text-dark-muted font-medium">{t('accounts.quota')}</th>
                <th className="text-right px-5 py-3 text-xs text-dark-muted font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map(account => {
                const info = IDE_PLATFORM_INFO[account.platform];
                return (
                  <tr key={account.id} className="border-b border-dark-border/50 hover:bg-dark-border/20">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span>{info.icon}</span>
                        <span className="text-sm text-white">{info.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-dark-text">{account.email ?? '-'}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded-full">
                        {account.plan}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[account.status] ?? ''}`}>
                        {t(`accounts.${account.status}`)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {account.quotas.length > 0 ? (
                        <div className="space-y-1">
                          {account.quotas.map((q, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="h-1 w-16 bg-dark-border rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary-500 rounded-full"
                                  style={{ width: `${Math.min(100, (q.used / q.total) * 100)}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-dark-muted">{q.used}/{q.total}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-dark-muted">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 text-dark-muted hover:text-white rounded-lg hover:bg-dark-border/50 transition-colors">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeAccount(account.id)}
                          className="p-1.5 text-dark-muted hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
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
        <div className="text-center py-16 text-dark-muted">
          <p className="text-lg mb-2">{t('accounts.noAccounts')}</p>
          <p className="text-sm">{t('accounts.add')}</p>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-[480px]">
            <h2 className="text-lg font-bold text-white mb-4">{t('accounts.add')}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-dark-muted">{t('accounts.platform')}</label>
                <select
                  value={newAccount.platform}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, platform: e.target.value as IDEPlatform }))}
                  className="w-full mt-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:border-primary-600"
                >
                  {PLATFORMS.map(p => (
                    <option key={p} value={p}>{IDE_PLATFORM_INFO[p].icon} {IDE_PLATFORM_INFO[p].name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-dark-muted">{t('accounts.email')}</label>
                <input
                  type="email"
                  value={newAccount.email}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:border-primary-600"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="text-sm text-dark-muted">Display Name</label>
                <input
                  type="text"
                  value={newAccount.displayName}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:border-primary-600"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm text-dark-muted hover:text-white transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAddAccount}
                className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
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
