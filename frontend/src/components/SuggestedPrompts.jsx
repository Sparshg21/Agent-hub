import { motion } from 'framer-motion'

const PROMPTS = [
  { text: 'Order Chicken Biryani from Zomato', emoji: '🍛' },
  { text: 'Book cheapest flight to Delhi next Friday', emoji: '✈️' },
  { text: 'Order milk and eggs from Blinkit', emoji: '🥛' },
  { text: 'Recharge my Jio number 9876543210', emoji: '📱' },
  { text: 'Pay my electricity bill', emoji: '💡' },
  { text: 'Set a reminder for my 3pm meeting tomorrow', emoji: '🔔' },
]

export function SuggestedPrompts({ onSelect }) {
  return (
    <div className="px-4 pb-4">
      <p className="text-xs text-gray-600 mb-2 text-center">Try asking...</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {PROMPTS.map((prompt, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(prompt.text)}
            className="
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs
              bg-white/5 border border-white/10 text-gray-300
              hover:bg-white/10 hover:border-brand-600/50 hover:text-white
              transition-all duration-200 active:scale-95
            "
          >
            <span>{prompt.emoji}</span>
            <span>{prompt.text}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
