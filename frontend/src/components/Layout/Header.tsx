import { useStore } from '../../store/useStore';
import { useState, useEffect } from 'react';
import axios from 'axios';

export function Header() {
  const activeTab = useStore((s) => s.activeTab);
  const [apiStatus, setApiStatus] = useState<'ok' | 'error' | 'checking'>('checking');

  const TAB_LABELS: Record<string, string> = {
    chat: 'Chat',
    activity: 'Activity Log',
    services: 'Services',
    settings: 'Settings',
  };

  useEffect(() => {
    const check = async () => {
      try {
        await axios.get('/api/health', { timeout: 3000 });
        setApiStatus('ok');
      } catch {
        setApiStatus('error');
      }
    };
    check();
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-white/5 bg-[#0e0e1a]/80 backdrop-blur-md flex-shrink-0">
      <h1 className="text-base font-semibold text-white">{TAB_LABELS[activeTab]}</h1>

      <div className="flex items-center gap-3">
        {/* API status */}
        <div className="flex items-center gap-1.5 text-xs">
          {apiStatus === 'ok' ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 hidden sm:block">API Connected</span>
            </>
          ) : apiStatus === 'error' ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span className="text-red-400 hidden sm:block">API Offline</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
              <span className="text-slate-400 hidden sm:block">Connecting…</span>
            </>
          )}
        </div>

        {/* Model badge */}
        <div className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 font-medium hidden sm:block">
          Claude Powered
        </div>
      </div>
    </header>
  );
}
