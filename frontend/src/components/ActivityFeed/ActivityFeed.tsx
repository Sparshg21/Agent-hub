import { useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { PendingAction } from '../../types';

const SERVICE_EMOJI: Record<string, string> = {
  swiggy: '🍔',
  zomato: '🍕',
  blinkit: '⚡',
  zepto: '🛒',
  flights: '✈️',
  payments: '💳',
};

const STATUS_CONFIG = {
  pending_confirmation: { icon: AlertCircle, label: 'Awaiting confirmation', cls: 'text-amber-400' },
  confirmed: { icon: Clock, label: 'Queued', cls: 'text-blue-400' },
  executing: { icon: Clock, label: 'Processing', cls: 'text-indigo-400' },
  completed: { icon: CheckCircle, label: 'Completed', cls: 'text-emerald-400' },
  failed: { icon: XCircle, label: 'Failed', cls: 'text-red-400' },
  cancelled: { icon: XCircle, label: 'Cancelled', cls: 'text-slate-500' },
};

function ActivityItem({ action }: { action: PendingAction }) {
  const cfg = STATUS_CONFIG[action.status] || STATUS_CONFIG.cancelled;
  const Icon = cfg.icon;
  const emoji = SERVICE_EMOJI[action.service] || '🤖';

  const timeStr = new Date(action.createdAt).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="w-10 h-10 rounded-xl bg-[#24243a] flex items-center justify-center flex-shrink-0 text-xl">
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{action.summary}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Icon size={12} className={cfg.cls} />
          <span className={`text-xs ${cfg.cls}`}>{cfg.label}</span>
          <span className="text-xs text-slate-600">·</span>
          <span className="text-xs text-slate-500">{timeStr}</span>
        </div>
        {action.result && (action.result as any).orderId && (
          <p className="text-xs text-slate-500 mt-0.5">
            ID: {(action.result as any).orderId}
          </p>
        )}
        {action.result && (action.result as any).pnr && (
          <p className="text-xs text-slate-500 mt-0.5">
            PNR: {(action.result as any).pnr}
          </p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <span className="text-sm font-semibold text-white">
          ₹{action.estimatedCost.toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  );
}

export function ActivityFeed() {
  const { activityLog, loadActivityLog } = useStore();

  useEffect(() => {
    loadActivityLog();
    const interval = setInterval(loadActivityLog, 10000);
    return () => clearInterval(interval);
  }, []);

  const total = activityLog
    .filter((a) => a.status === 'completed')
    .reduce((sum, a) => sum + a.estimatedCost, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Activity Log</h2>
          <button
            onClick={loadActivityLog}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        </div>
        {activityLog.length > 0 && (
          <p className="text-xs text-slate-500 mt-1">
            {activityLog.filter((a) => a.status === 'completed').length} completed · ₹{total.toLocaleString('en-IN')} spent
          </p>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4">
        {activityLog.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
            <span className="text-5xl">📋</span>
            <p className="text-sm text-slate-500">No activity yet.</p>
            <p className="text-xs text-slate-600">Your actions will appear here.</p>
          </div>
        ) : (
          <div>
            {activityLog.map((action) => (
              <ActivityItem key={action.id} action={action} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
