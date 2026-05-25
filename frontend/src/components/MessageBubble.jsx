import { motion } from 'framer-motion'
import { Bot, User, AlertCircle } from 'lucide-react'

// Simple markdown-to-HTML renderer
function renderMarkdown(text) {
  if (!text) return ''

  return text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Headers
    .replace(/^### (.*)/gm, '<h3>$1</h3>')
    .replace(/^## (.*)/gm, '<h3>$1</h3>')
    // Bullet points
    .replace(/^[-•] (.*)/gm, '<li>$1</li>')
    // Numbered lists
    .replace(/^\d+\. (.*)/gm, '<li>$1</li>')
    // Code inline
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Line breaks
    .replace(/\n/g, '<br/>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li>.*?<\/li>(\s*<br\/>)*)+/gs, (match) => `<ul>${match.replace(/<br\/>/g, '')}</ul>`)
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const isError = message.role === 'error'

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end gap-3 px-4"
      >
        <div className="max-w-[80%] flex flex-col items-end gap-1">
          <div className="bg-brand-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
            {message.content}
          </div>
          <span className="text-xs text-gray-600">{formatTime(message.timestamp)}</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-1">
          <User className="w-4 h-4 text-gray-300" />
        </div>
      </motion.div>
    )
  }

  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-3 px-4"
      >
        <div className="w-8 h-8 rounded-full bg-red-900/60 border border-red-700/50 flex items-center justify-center flex-shrink-0 mt-1">
          <AlertCircle className="w-4 h-4 text-red-400" />
        </div>
        <div className="max-w-[85%] flex flex-col gap-1">
          <div className="bg-red-900/40 border border-red-700/40 text-red-300 px-4 py-3 rounded-2xl rounded-tl-sm text-sm">
            {message.content}
          </div>
        </div>
      </motion.div>
    )
  }

  // Assistant message
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 px-4"
    >
      <div className="w-8 h-8 rounded-full bg-brand-700/60 border border-brand-600/50 flex items-center justify-center flex-shrink-0 mt-1">
        <Bot className="w-4 h-4 text-brand-300" />
      </div>
      <div className="max-w-[85%] flex flex-col gap-1">
        <div
          className="glass text-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed prose-dark"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
        />
        <span className="text-xs text-gray-600">{formatTime(message.timestamp)}</span>
      </div>
    </motion.div>
  )
}

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 px-4"
    >
      <div className="w-8 h-8 rounded-full bg-brand-700/60 border border-brand-600/50 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-brand-300" />
      </div>
      <div className="glass px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </motion.div>
  )
}
