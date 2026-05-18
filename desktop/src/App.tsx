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
    <div className="flex h-screen" style={{ background: 'linear-gradient(180deg, var(--bg-secondary), var(--bg-quinary))' }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto" style={{ padding: '70px clamp(20px, 3vw, 48px) 40px' }}>
        <div className="max-w-[1000px] mx-auto flex flex-col gap-6">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default App;
