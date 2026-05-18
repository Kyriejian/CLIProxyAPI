import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { Sun, Moon, Globe, Info, Github } from 'lucide-react';

const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(145deg, color-mix(in srgb, var(--bg-primary) 86%, transparent), color-mix(in srgb, var(--bg-secondary) 72%, transparent))',
  border: '1px solid color-mix(in srgb, var(--border-color) 66%, transparent)',
  borderRadius: 'var(--radius-lg)',
  backdropFilter: 'blur(var(--glass-blur))',
  boxShadow: 'var(--shadow-card)',
  padding: '20px',
};

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, language, toggleTheme, setLanguage } = useAppStore();

  function handleLanguageChange(lang: 'zh' | 'en') {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  }

  function optionStyle(active: boolean): React.CSSProperties {
    return {
      background: active ? 'color-mix(in srgb, var(--primary-color) 12%, var(--bg-secondary))' : 'transparent',
      border: active ? '1px solid color-mix(in srgb, var(--primary-color) 40%, var(--border-color))' : '1px solid var(--border-color)',
      color: active ? 'var(--primary-active)' : 'var(--text-secondary)',
      fontWeight: active ? 600 : 400,
      transition: 'all 150ms ease',
      cursor: 'pointer',
    };
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl" style={{ animation: 'heroEnter 0.5s ease-out both' }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{t('settings.title')}</h1>
      </div>

      {/* Theme */}
      <div style={cardStyle}>
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          {theme === 'dark' ? <Moon className="w-4 h-4" style={{ color: 'var(--primary-color)' }} /> : <Sun className="w-4 h-4" style={{ color: '#e0aa14' }} />}
          {t('settings.theme')}
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => theme !== 'dark' && toggleTheme()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg"
            style={optionStyle(theme === 'dark')}
          >
            <Moon className="w-4 h-4" />
            {t('settings.dark')}
          </button>
          <button
            onClick={() => theme !== 'light' && toggleTheme()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg"
            style={optionStyle(theme === 'light')}
          >
            <Sun className="w-4 h-4" />
            {t('settings.light')}
          </button>
        </div>
      </div>

      {/* Language */}
      <div style={cardStyle}>
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Globe className="w-4 h-4" style={{ color: 'var(--primary-color)' }} />
          {t('settings.language')}
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => handleLanguageChange('zh')}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg"
            style={optionStyle(language === 'zh')}
          >
            {t('settings.chinese')}
          </button>
          <button
            onClick={() => handleLanguageChange('en')}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg"
            style={optionStyle(language === 'en')}
          >
            {t('settings.english')}
          </button>
        </div>
      </div>

      {/* About */}
      <div style={cardStyle}>
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Info className="w-4 h-4" style={{ color: 'var(--primary-color)' }} />
          {t('settings.about')}
        </h3>
        <div className="flex flex-col gap-3">
          {[
            { label: t('settings.version'), value: '1.0.0' },
            { label: 'Runtime', value: 'Electron + React + TypeScript' },
            { label: 'Proxy Engine', value: 'Express.js + Node.js' },
            { label: 'Database', value: 'SQLite' },
          ].map(item => (
            <div key={item.label} className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-tertiary)' }}>{item.label}</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
            </div>
          ))}
          <div className="pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Based on CLIProxyAPI, cockpit-tools, 9router, and openrelay.
              Aggregating free AI model quotas with unified proxy management.
            </p>
          </div>
          <a
            href="https://github.com/router-for-me/CLIProxyAPI"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm"
            style={{ color: 'var(--primary-color)', transition: 'color 150ms ease' }}
          >
            <Github className="w-4 h-4" />
            GitHub Repository
          </a>
        </div>
      </div>
    </div>
  );
}
