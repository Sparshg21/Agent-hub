import { useEffect } from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { useStore } from '../../store/useStore';

export function ServicePanel() {
  const { services, loadServices } = useStore();

  useEffect(() => {
    loadServices();
  }, []);

  const categories = Array.from(new Set(services.map((s) => s.category)));

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/5">
        <h2 className="text-base font-semibold text-white">Connected Services</h2>
        <p className="text-xs text-slate-500 mt-1">
          {services.filter((s) => s.enabled).length} of {services.length} active
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-6">
        {categories.map((cat) => (
          <div key={cat}>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">
              {cat}
            </p>
            <div className="space-y-2">
              {services
                .filter((s) => s.category === cat)
                .map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1a27] border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: `${service.color}20` }}
                    >
                      {service.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{service.name}</p>
                      <p className="text-xs text-slate-500 truncate">{service.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-500">
                        ₹{service.spendingLimit.toLocaleString('en-IN')} limit
                      </span>
                      {service.enabled ? (
                        <CheckCircle size={18} className="text-emerald-400" />
                      ) : (
                        <Circle size={18} className="text-slate-600" />
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}

        {services.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <span className="text-5xl">🔌</span>
            <p className="text-sm text-slate-500">Loading services…</p>
          </div>
        )}

        {/* Coming soon */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">
            Coming Soon
          </p>
          {['Ola / Uber Cabs', 'BookMyShow Tickets', 'MakeMyTrip Hotels', 'Google Calendar'].map((name) => (
            <div
              key={name}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#12121a] border border-white/5 mb-2 opacity-60"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">
                🔮
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-400">{name}</p>
                <p className="text-xs text-slate-600">Integration coming soon</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
