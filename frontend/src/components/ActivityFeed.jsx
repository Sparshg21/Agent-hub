import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, CheckCircle2, XCircle, Clock, Zap, X } from 'lucide-react'

const SERVICE_CONFIG = {
  zomato: { emoji: '🍕', label: 'Zomato', color: 'text-red-400', bg: 'bg-red-900/30 border-red-800/40' },
  swiggy: { emoji: '🧡', label: 'Swiggy', color: 'text-orange-400', bg: 'bg-orange-900/30 border-orange-800/40' },
  blinkit: { emoji: '⚡', label: 'Blinkit', color: 'text-yellow-400', bg: 'bg-yellow-900/30 border-yellow-800/40' },
  zepto: { emoji: '🟣', label: 'Zepto', color: 'text-purple-400', bg: 'bg-purple-900/30 border-purple-800/40' },
  flights: { emoji: '✈️', label: 'Flights', color: 'text-sky-400', bg: 'bg-sky-900/30 border-sky-800/40' },
  utilities: { emoji: '💡', label: 'Utilities', color: 'text-green-400', bg: 'bg-green-900/30 border-green-800/40' },
  calendar: { emoji: '📅', label: 'Calendar', color: 'text-indigo-400', bg: 'bg-indigo-900/30 border-indigo-800/40' },
  other: { emoji: '⚙️', label: 'Service', color: 'text-gray-400', bg: 'bg-gray-800/40 border-gray-700/40' },
}

const ACTION_LABELS = {
  order_food: 'Food Order',
  order_grocery: 'Grocery Order',
  book_flight: 'Flight Booking',
  pay_bill: 'Bill Payment',
  create_calendar_event: 'Event Created',
  set_reminder: 'Reminder Set',
}

function StatusBadge({ status }) {
  if (status === 'completed') return (
    <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle2 className="w-3.5 h-3.5" /> Done</span>
  )
  if (status === 'cancelled') return (
    <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="w-3.5 h-3.5" /> Cancelled</span>
  )
  if (status === 'pending') return (
    <span className="flex items-center gap-1 text-xs text-yellow-400"><Clock className="w-3.5 h-3.5" /> Pending</span>
  )
  return <span className="text-xs text-gray-500">{status}</span>
}

function ActivityCard({ item }) {
  const svc = SERVICE_CONFIG[item.service] || SERVICE_CONFIG.other
  const label = ACTION_LABELS[item.action] || item.action
  const date = item.created_at ? new Date(item.created_at).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  }) : ''

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-xl border p-3 ${svc.bg}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">{svc.emoji}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold ${svc.color}`}>{svc.label}</span>
              <span className="text-xs text-gray-500">·</span>
              <span className="text-xs text-gray-400">{label}</span>
            </div>
            {item.intent && (
              <p className="text-xs text-gray-400 mt-0.5 truncate" title={item.intent}>
                "{item.intent}"
              </p>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <StatusBadge status={item.status} />
          {item.amount && (
            <p className="text-xs text-white font-semibold mt-0.5">₹{item.amount.toFixed(0)}</p>
          )}
        </div>
      </div>
      <p className="text-[11px] text-gray-600 mt-1.5">{date}</p>
    </motion.div>
  )
}

export function ActivityFeed({ onClose }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/activity/default_user?limit=30')
      if (res.ok) {
        const data = await res.json()
        setActivities(data)
      }
    } catch (e) {
      console.error('Failed to fetch activities', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
    const interval = setInterval(fetchActivities, 10000)
    return () => clearInterval(interval)
  }, [])

  const totalSpend = activities
    .filter(a => a.status === 'completed' && a.amount)
    .reduce((sum, a) => sum + a.amount, 0)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h2 className="font-semibold text-white">Activity Feed</h2>
          <p className="text-xs text-gray-500 mt-0.5">{activities.length} actions · ₹{totalSpend.toFixed(0)} spent</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchActivities}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Activity list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence mode="popLayout">
          {activities.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-600">
              <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No actions yet</p>
              <p className="text-xs mt-1">Try ordering food or booking a flight!</p>
            </div>
          )}
          {activities.map(item => (
            <ActivityCard key={item.id} item={item} />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
