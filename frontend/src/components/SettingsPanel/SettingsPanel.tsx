import { useStore } from '../../store/useStore';
import { Shield, Mic, Bell, Trash2 } from 'lucide-react';

const SERVICES = [
  { id: 'swiggy', label: 'Swiggy', emoji: '🍔' },
  { id: 'zomato', label: 'Zomato', emoji: '🍕' },
  { id: 'blinkit', label: 'Blinkit', emoji: '⚡' },
  { id: 'zepto', label: 'Zepto', emoji: '🛒' },
  { id: 'flights', label: 'Flights', emoji: '✈️' },
  { id: 'payments', label: 'Payments', emoji: '💳' },
];

function SpendingLimitRow({
  id,
  label,
  emoji,
}: {
  id: string;
  label: string;
  emoji: string;
}) {
  const { spendingLimits, updateSpendingLimit } = useStore();
  const limit = spendingLimits[id] ?? 0;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
      <span className="text-xl">{emoji}</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-slate-500">Max per action</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">₹</span>
        <input
          type="number"
          value={limit}
          onChange={(e) => updateSpendingLimit(id, Number(e.target.value))}
          className="w-20 bg-[#24243a] border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white text-right outline-none focus:border-indigo-500/50 transition-colors"
          min={0}
          step={100}
        />
      </div>
    </div>
  );
}

export function SettingsPanel() {
  const { clearMessages } = useStore();

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/5">
        <h2 className="text-base font-semibold text-white">Settings</h2>
        <p className="text-xs text-slate-500 mt-1">Configure your trust layer & preferences</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-6">
        {/* Spending Limits */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Spending Limits</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Actions above these limits will always require your confirmation.
          </p>
          <div className="bg-[#1a1a27] rounded-xl border border-white/5 px-4">
            {SERVICES.map((s) => (
              <SpendingLimitRow key={s.id} {...s} />
            ))}
          </div>
        </section>

        {/* Voice Settings */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Mic size={16} className="text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Voice</h3>
          </div>
          <div className="bg-[#1a1a27] rounded-xl border border-white/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Language</p>
                <p className="text-xs text-slate-500">Speech recognition language</p>
              </div>
              <select className="bg-[#24243a] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500/50">
                <option value="en-IN">English (India)</option>
                <option value="hi-IN">Hindi</option>
                <option value="en-US">English (US)</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Voice Feedback</p>
                <p className="text-xs text-slate-500">Read responses aloud</p>
              </div>
              <button className="w-12 h-6 rounded-full bg-[#24243a] border border-white/10 relative transition-all">
                <span className="w-4 h-4 rounded-full bg-slate-500 absolute top-1 left-1 transition-all" />
              </button>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Bell size={16} className="text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
          </div>
          <div className="bg-[#1a1a27] rounded-xl border border-white/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Order Updates</p>
                <p className="text-xs text-slate-500">Get notified when orders are confirmed</p>
              </div>
              <button className="w-12 h-6 rounded-full bg-indigo-600 border border-indigo-500 relative transition-all">
                <span className="w-4 h-4 rounded-full bg-white absolute top-1 right-1 transition-all" />
              </button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section>
          <h3 className="text-sm font-semibold text-red-400 mb-3">Danger Zone</h3>
          <button
            onClick={clearMessages}
            className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
          >
            <Trash2 size={16} />
            Clear Conversation
          </button>
        </section>

        {/* About */}
        <section className="pb-4">
          <div className="p-4 rounded-xl bg-[#12121a] border border-white/5 text-center">
            <p className="text-2xl mb-2">🤖</p>
            <p className="text-sm font-semibold text-white">AgentHub</p>
            <p className="text-xs text-slate-500 mt-1">Version 1.0.0</p>
            <p className="text-xs text-slate-600 mt-2">
              Powered by Claude · Built for India
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
