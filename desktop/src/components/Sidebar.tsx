import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';
import {
  LayoutDashboard,
  Cloud,
  Users,
  Box,
  Settings,
  Network,
  Zap,
} from 'lucide-react';

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard },
  { key: 'providers', icon: Cloud },
  { key: 'accounts', icon: Users },
  { key: 'models', icon: Box },
  { key: 'proxy', icon: Network },
  { key: 'settings', icon: Settings },
];

export function Sidebar() {
  const { t } = useTranslation();
  const { currentPage, setCurrentPage, proxyStatus } = useAppStore();

  return (
    <aside className="w-64 bg-dark-card border-r border-dark-border flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-dark-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">AI Proxy</h1>
            <p className="text-xs text-dark-muted">Manager v1.0</p>
          </div>
        </div>
      </div>

      {/* Proxy Status */}
      <div className="px-4 py-3 border-b border-dark-border">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${
            proxyStatus === 'running' ? 'bg-green-400 animate-pulse-dot' :
            proxyStatus === 'error' ? 'bg-red-400' :
            proxyStatus === 'starting' ? 'bg-yellow-400 animate-pulse-dot' :
            'bg-gray-500'
          }`} />
          <span className="text-sm text-dark-muted">
            {t(`dashboard.${proxyStatus}`)}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3">
        {navItems.map(({ key, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setCurrentPage(key)}
            className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
              currentPage === key
                ? 'bg-primary-600/20 text-primary-400 border-r-2 border-primary-400'
                : 'text-dark-muted hover:text-white hover:bg-dark-border/50'
            }`}
          >
            <Icon className="w-4.5 h-4.5" />
            <span>{t(`nav.${key}`)}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-dark-border">
        <p className="text-xs text-dark-muted text-center">
          Based on CLIProxyAPI
        </p>
      </div>
    </aside>
  );
}
