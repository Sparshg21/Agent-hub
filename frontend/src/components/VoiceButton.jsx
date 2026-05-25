import { Mic, MicOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function VoiceButton({ isListening, onClick, disabled, transcript }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          relative w-14 h-14 rounded-full flex items-center justify-center
          transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500
          ${isListening
            ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/40'
            : 'bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-600/30'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
        `}
        title={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {/* Ripple effect when listening */}
        <AnimatePresence>
          {isListening && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-red-400"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.5,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {isListening
          ? <MicOff className="w-6 h-6 text-white z-10" />
          : <Mic className="w-6 h-6 text-white z-10" />
        }
      </button>

      {/* Live transcript */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-sm text-brand-300 italic max-w-xs text-center truncate"
          >
            "{transcript}"
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
