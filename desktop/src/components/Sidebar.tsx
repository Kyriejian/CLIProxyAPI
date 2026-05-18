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
    <aside
      className="w-60 flex flex-col flex-shrink-0 overflow-y-auto"
      style={{
        margin: '24px 0 24px 24px',
        padding: '18px 14px',
        background: 'linear-gradient(180deg, rgb(255 255 255 / 0.035), rgb(255 255 255 / 0)), color-mix(in srgb, var(--bg-primary) 72%, transparent)',
        border: '1px solid color-mix(in srgb, var(--border-color) 72%, transparent)',
        borderRadius: '18px',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        height: 'calc(100vh - 48px)',
        gap: '16px',
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2.5 pb-3" style={{ minHeight: '42px' }}>
        <div
          className="w-8 h-8 flex items-center justify-center flex-shrink-0"
          style={{
            background: 'color-mix(in srgb, var(--primary-color) 14%, var(--bg-primary))',
            borderRadius: '8px',
            boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--primary-color) 24%, transparent)',
          }}
        >
          <Zap className="w-4 h-4" style={{ color: 'var(--primary-active)' }} />
        </div>
        <div className="min-w-0 overflow-hidden">
          <h1 className="text-lg font-extrabold whitespace-nowrap" style={{ color: 'var(--text-primary)', letterSpacing: 0 }}>
            CPAMC
          </h1>
        </div>
      </div>

      {/* Status Pill */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 self-start" style={{
        background: 'color-mix(in srgb, var(--bg-secondary) 82%, transparent)',
        border: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)',
        borderRadius: 'var(--radius-full)',
        backdropFilter: 'blur(8px)',
        fontSize: '12px',
      }}>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
          proxyStatus === 'running' ? 'animate-pulse-dot' : ''
        }`} style={{
          background: proxyStatus === 'running' ? 'var(--success-color)' :
                     proxyStatus === 'error' ? 'var(--error-color)' :
                     proxyStatus === 'starting' ? '#e0aa14' : 'var(--text-quaternary)',
          boxShadow: proxyStatus === 'running' ? '0 0 6px rgba(16, 185, 129, 0.5)' : 'none',
        }} />
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          {t(`dashboard.${proxyStatus}`)}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col flex-1" style={{ gap: '8px' }}>
        {navItems.map(({ key, icon: Icon }) => {
          const isActive = currentPage === key;
          return (
            <button
              key={key}
              onClick={() => setCurrentPage(key)}
              className="flex items-center gap-2 text-left border cursor-pointer"
              style={{
                padding: '10px 12px',
                borderRadius: '11px',
                borderColor: isActive ? 'color-mix(in srgb, var(--border-hover) 70%, transparent)' : 'transparent',
                background: isActive ? 'color-mix(in srgb, var(--text-primary) 10%, transparent)' : 'transparent',
                color: 'var(--text-primary)',
                fontWeight: 650,
                fontSize: '14px',
                transition: 'background 150ms ease, border-color 150ms ease, transform 150ms ease',
                boxShadow: isActive ? 'inset 0 1px 0 rgb(255 255 255 / 0.04)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'color-mix(in srgb, var(--text-primary) 7%, transparent)';
                  e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--border-color) 58%, transparent)';
                  e.currentTarget.style.transform = 'translateX(1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'none';
                }
              }}
            >
              <div
                className="w-7 h-7 flex items-center justify-center flex-shrink-0"
                style={{
                  borderRadius: '8px',
                  background: isActive
                    ? 'linear-gradient(180deg, rgb(255 255 255 / 0.18), rgb(255 255 255 / 0)), color-mix(in srgb, var(--primary-color) 14%, var(--bg-primary))'
                    : 'linear-gradient(180deg, rgb(255 255 255 / 0.12), rgb(255 255 255 / 0)), color-mix(in srgb, var(--bg-secondary) 84%, transparent)',
                  boxShadow: isActive
                    ? 'inset 0 0 0 1px color-mix(in srgb, var(--primary-color) 24%, transparent)'
                    : 'inset 0 0 0 1px color-mix(in srgb, var(--border-primary) 82%, transparent)',
                  color: isActive ? 'var(--primary-active)' : 'currentColor',
                  opacity: 0.96,
                }}
              >
                <Icon style={{ width: '18px', height: '18px' }} />
              </div>
              <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                {t(`nav.${key}`)}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="pt-3 text-center" style={{ borderTop: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-tertiary)' }}>
        Based on CLIProxyAPI
      </div>
    </aside>
  );
}
