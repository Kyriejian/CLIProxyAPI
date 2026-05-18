import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { Sun, Moon, Globe, Info, Github } from 'lucide-react';

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, language, toggleTheme, setLanguage } = useAppStore();

  function handleLanguageChange(lang: 'zh' | 'en') {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{t('settings.title')}</h1>
      </div>

      {/* Theme */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-white font-medium mb-4 flex items-center gap-2">
          {theme === 'dark' ? <Moon className="w-4 h-4 text-primary-400" /> : <Sun className="w-4 h-4 text-yellow-400" />}
          {t('settings.theme')}
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => theme !== 'dark' && toggleTheme()}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-colors ${
              theme === 'dark' ? 'border-primary-600 bg-primary-600/10 text-primary-400' : 'border-dark-border text-dark-muted hover:text-white'
            }`}
          >
            <Moon className="w-4 h-4" />
            {t('settings.dark')}
          </button>
          <button
            onClick={() => theme !== 'light' && toggleTheme()}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-colors ${
              theme === 'light' ? 'border-primary-600 bg-primary-600/10 text-primary-400' : 'border-dark-border text-dark-muted hover:text-white'
            }`}
          >
            <Sun className="w-4 h-4" />
            {t('settings.light')}
          </button>
        </div>
      </div>

      {/* Language */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-white font-medium mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary-400" />
          {t('settings.language')}
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => handleLanguageChange('zh')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-colors ${
              language === 'zh' ? 'border-primary-600 bg-primary-600/10 text-primary-400' : 'border-dark-border text-dark-muted hover:text-white'
            }`}
          >
            {t('settings.chinese')}
          </button>
          <button
            onClick={() => handleLanguageChange('en')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-colors ${
              language === 'en' ? 'border-primary-600 bg-primary-600/10 text-primary-400' : 'border-dark-border text-dark-muted hover:text-white'
            }`}
          >
            {t('settings.english')}
          </button>
        </div>
      </div>

      {/* About */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-white font-medium mb-4 flex items-center gap-2">
          <Info className="w-4 h-4 text-primary-400" />
          {t('settings.about')}
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-dark-muted">{t('settings.version')}</span>
            <span className="text-white">1.0.0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-dark-muted">Runtime</span>
            <span className="text-white">Electron + React + TypeScript</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-dark-muted">Proxy Engine</span>
            <span className="text-white">Express.js + Node.js</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-dark-muted">Database</span>
            <span className="text-white">SQLite</span>
          </div>
          <div className="pt-3 border-t border-dark-border">
            <p className="text-xs text-dark-muted">
              Based on CLIProxyAPI, cockpit-tools, 9router, and openrelay.
              Aggregating free AI model quotas with unified proxy management.
            </p>
          </div>
          <a
            href="https://github.com/router-for-me/CLIProxyAPI"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            <Github className="w-4 h-4" />
            GitHub Repository
          </a>
        </div>
      </div>
    </div>
  );
}
