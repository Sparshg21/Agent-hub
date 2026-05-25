import { useStore } from '../store/useStore';
import { Sidebar } from '../components/Layout/Sidebar';
import { Header } from '../components/Layout/Header';
import { ChatInterface } from '../components/ChatInterface/ChatInterface';
import { ActivityFeed } from '../components/ActivityFeed/ActivityFeed';
import { ServicePanel } from '../components/ServicePanel/ServicePanel';
import { SettingsPanel } from '../components/SettingsPanel/SettingsPanel';

export function App() {
  const activeTab = useStore((s) => s.activeTab);

  return (
    <div className="flex h-screen bg-[#0a0a0f] overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 overflow-hidden">
          {activeTab === 'chat' && <ChatInterface />}
          {activeTab === 'activity' && <ActivityFeed />}
          {activeTab === 'services' && <ServicePanel />}
          {activeTab === 'settings' && <SettingsPanel />}
        </main>
      </div>
    </div>
  );
}
