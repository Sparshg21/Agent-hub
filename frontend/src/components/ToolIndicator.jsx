import { motion, AnimatePresence } from 'framer-motion'

const TOOL_ICONS = {
  search_food: { icon: '🍕', label: 'Searching restaurants...' },
  order_food: { icon: '🛵', label: 'Placing food order...' },
  search_grocery: { icon: '🛒', label: 'Searching groceries...' },
  order_grocery: { icon: '⚡', label: 'Placing grocery order...' },
  search_flights: { icon: '✈️', label: 'Searching flights...' },
  book_flight: { icon: '🎟️', label: 'Booking flight...' },
  get_bill_details: { icon: '📋', label: 'Fetching bill details...' },
  pay_bill: { icon: '💳', label: 'Processing payment...' },
  create_calendar_event: { icon: '📅', label: 'Creating event...' },
  set_reminder: { icon: '🔔', label: 'Setting reminder...' },
}

export function ToolIndicator({ activeTools }) {
  if (!activeTools.length) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="flex flex-wrap gap-2 px-4 pb-2"
      >
        {activeTools.map((tool, i) => {
          const info = TOOL_ICONS[tool.name] || { icon: '⚙️', label: `Running ${tool.name}...` }
          return (
            <motion.div
              key={`${tool.name}-${i}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 bg-brand-900/60 border border-brand-700/50 rounded-full px-3 py-1.5 text-sm text-brand-300"
            >
              <span>{info.icon}</span>
              <span>{info.label}</span>
              <span className="flex gap-0.5">
                {[0, 1, 2].map(dot => (
                  <span
                    key={dot}
                    className="typing-dot"
                    style={{ animationDelay: `${dot * 0.2}s` }}
                  />
                ))}
              </span>
            </motion.div>
          )
        })}
      </motion.div>
    </AnimatePresence>
  )
}
