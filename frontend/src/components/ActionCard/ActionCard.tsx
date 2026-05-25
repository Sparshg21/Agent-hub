import { CheckCircle, XCircle, Loader2, Clock, AlertCircle } from 'lucide-react';
import type { PendingAction } from '../../types';
import { useStore } from '../../store/useStore';

interface ActionCardProps {
  action: PendingAction;
}

const SERVICE_COLORS: Record<string, string> = {
  swiggy: '#FC8019',
  zomato: '#E23744',
  blinkit: '#F8C200',
  zepto: '#9B59B6',
  flights: '#2980B9',
  payments: '#27AE60',
};

const SERVICE_EMOJI: Record<string, string> = {
  swiggy: '🍔',
  zomato: '🍕',
  blinkit: '⚡',
  zepto: '🛒',
  flights: '✈️',
  payments: '💳',
};

const TYPE_LABELS: Record<string, string> = {
  food_order: 'Food Order',
  grocery_order: 'Grocery Order',
  flight_booking: 'Flight Booking',
  bill_payment: 'Bill Payment',
  recharge: 'Mobile Recharge',
};

function OrderItems({ details }: { details: Record<string, unknown> }) {
  const items = details.items as Array<{ name: string; quantity: number; price: number }> | undefined;
  if (!items?.length) return null;
  return (
    <ul className="mt-2 space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex justify-between text-xs text-slate-400">
          <span>{item.name} × {item.quantity}</span>
          <span>₹{item.price * item.quantity}</span>
        </li>
      ))}
    </ul>
  );
}

function FlightDetails({ details }: { details: Record<string, unknown> }) {
  return (
    <div className="mt-2 text-xs text-slate-400 space-y-1">
      <p>✈️ <strong className="text-slate-300">{details.airline as string}</strong> {details.flightNo as string}</p>
      <p>🗺 {details.route as string}</p>
      {details.departure ? <p>🕐 Departs {String(details.departure)}</p> : null}
      <p>👤 {details.passengerName as string}</p>
    </div>
  );
}

function PaymentDetails({ details }: { details: Record<string, unknown> }) {
  return (
    <div className="mt-2 text-xs text-slate-400 space-y-1">
      {details.billerName ? <p>📋 Biller: {String(details.billerName)}</p> : null}
      {details.operator ? <p>📡 {String(details.operator)} — {String(details.phoneNumber ?? '')}</p> : null}
      {details.accountNumber ? <p>🔢 Account: {String(details.accountNumber)}</p> : null}
    </div>
  );
}

export function ActionCard({ action }: ActionCardProps) {
  const { confirmAction, cancelAction } = useStore();
  const color = SERVICE_COLORS[action.service] || '#6366f1';
  const emoji = SERVICE_EMOJI[action.service] || '🤖';
  const typeLabel = TYPE_LABELS[action.type] || action.type;

  const isPending = action.status === 'pending_confirmation';
  const isExecuting = action.status === 'executing';
  const isCompleted = action.status === 'completed';
  const isFailed = action.status === 'failed';

  return (
    <div
      className="rounded-2xl overflow-hidden border border-white/10 glass my-2 fade-slide-in"
      style={{ borderColor: `${color}30` }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-3"
        style={{ background: `${color}15` }}
      >
        <span className="text-2xl">{emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color }}>
            {typeLabel}
          </p>
          <p className="text-sm font-semibold text-white truncate">{action.summary}</p>
        </div>
        <StatusBadge status={action.status} />
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {/* Item breakdown */}
        {(action.type === 'food_order' || action.type === 'grocery_order') && (
          <OrderItems details={action.details} />
        )}
        {action.type === 'flight_booking' && (
          <FlightDetails details={action.details} />
        )}
        {(action.type === 'bill_payment' || action.type === 'recharge') && (
          <PaymentDetails details={action.details} />
        )}

        {/* Cost */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">Estimated total</span>
          <span className="text-lg font-bold text-white">₹{action.estimatedCost.toLocaleString('en-IN')}</span>
        </div>

        {/* Result */}
        {isCompleted && action.result && (
          <div className="mt-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
            {(action.result as any).orderId && (
              <p>Order ID: <strong>{(action.result as any).orderId}</strong></p>
            )}
            {(action.result as any).pnr && (
              <p>PNR: <strong>{(action.result as any).pnr}</strong></p>
            )}
            {(action.result as any).transactionId && (
              <p>Transaction: <strong>{(action.result as any).transactionId}</strong></p>
            )}
            {(action.result as any).estimatedTime && (
              <p>Delivery in {(action.result as any).estimatedTime}</p>
            )}
          </div>
        )}

        {isFailed && (
          <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
            {action.error || 'Action failed'}
          </div>
        )}
      </div>

      {/* Actions */}
      {isPending && (
        <div className="px-4 pb-4 flex gap-3">
          <button
            onClick={() => confirmAction(action.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
              bg-indigo-600 hover:bg-indigo-500 text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <CheckCircle size={16} />
            Confirm
          </button>
          <button
            onClick={() => cancelAction(action.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
              bg-[#1a1a27] hover:bg-[#24243a] text-slate-300 border border-white/10 transition-all hover:scale-[1.02]"
          >
            <XCircle size={16} />
            Cancel
          </button>
        </div>
      )}

      {isExecuting && (
        <div className="px-4 pb-4 flex items-center justify-center gap-2 text-indigo-300 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Processing…
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs = {
    pending_confirmation: { icon: AlertCircle, label: 'Confirm?', cls: 'text-amber-400 bg-amber-400/10' },
    executing: { icon: Loader2, label: 'Working', cls: 'text-indigo-400 bg-indigo-400/10' },
    completed: { icon: CheckCircle, label: 'Done', cls: 'text-emerald-400 bg-emerald-400/10' },
    failed: { icon: XCircle, label: 'Failed', cls: 'text-red-400 bg-red-400/10' },
    cancelled: { icon: XCircle, label: 'Cancelled', cls: 'text-slate-400 bg-slate-400/10' },
    confirmed: { icon: Clock, label: 'Queued', cls: 'text-blue-400 bg-blue-400/10' },
  };
  const cfg = configs[status as keyof typeof configs] || configs.confirmed;
  const Icon = cfg.icon;

  return (
    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.cls}`}>
      <Icon size={12} className={status === 'executing' ? 'animate-spin' : ''} />
      {cfg.label}
    </span>
  );
}
