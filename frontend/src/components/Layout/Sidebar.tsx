import { MessageSquare, Activity, Grid3X3, Settings, ChevronLeft, ChevronRight, Bot } from 'lucide-react';
import { useStore } from '../../store/useStore';

const TABS = [
  { id: 'chat' as const, icon: MessageSquare, label: 'Chat' },
  { id: 'activity' as const, icon: Activity, label: 'Activity' },
  { id: 'services' as const, icon: Grid3X3, label: 'Services' },
  { id: 'settings' as const, icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, activeTab, setActiveTab } = useStore();

  return (
    <aside
      className={`
        flex flex-col bg-[#0e0e1a] border-r border-white/5 transition-all duration-300 flex-shrink-0
        ${sidebarOpen ? 'w-56' : 'w-16'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <Bot size={18} className="text-white" />
        </div>
        {sidebarOpen && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-tight">AgentHub</p>
            <p className="text-xs text-slate-500 truncate">AI Assistant</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {TABS.map(({ id, icon: Icon, label }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              title={!sidebarOpen ? label : undefined}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left
                ${active
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }
              `}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium truncate">{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="flex items-center justify-center py-4 border-t border-white/5 text-slate-500 hover:text-slate-200 transition-colors"
      >
        {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>
    </aside>
  );
}
