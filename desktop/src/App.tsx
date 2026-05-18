import { useTranslation } from 'react-i18next';
import { useAppStore } from './stores/appStore';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { ProvidersPage } from './pages/Providers/ProvidersPage';
import { AccountsPage } from './pages/Accounts/AccountsPage';
import { ModelsPage } from './pages/Models/ModelsPage';
import { ProxyPage } from './pages/Proxy/ProxyPage';
import { SettingsPage } from './pages/Settings/SettingsPage';

function App() {
  const { currentPage } = useAppStore();
  const { i18n } = useTranslation();
  const theme = useAppStore((s) => s.theme);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'providers': return <ProvidersPage />;
      case 'accounts': return <AccountsPage />;
      case 'models': return <ModelsPage />;
      case 'proxy': return <ProxyPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'dark bg-dark-bg text-dark-text' : 'bg-gray-50 text-gray-900'}`}>
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
