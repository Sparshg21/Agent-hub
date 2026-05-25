import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Send, Trash2, Wifi, WifiOff, LayoutList, Settings,
  ChevronRight, Zap, Bot,
} from 'lucide-react'

import { useWebSocket } from './hooks/useWebSocket'
import { useVoice } from './hooks/useVoice'
import { MessageBubble, TypingIndicator } from './components/MessageBubble'
import { VoiceButton } from './components/VoiceButton'
import { ToolIndicator } from './components/ToolIndicator'
import { ActivityFeed } from './components/ActivityFeed'
import { SettingsPanel } from './components/SettingsPanel'
import { SuggestedPrompts } from './components/SuggestedPrompts'

export default function App() {
  const [input, setInput] = useState('')
  const [sidePanel, setSidePanel] = useState('none') // 'none' | 'activity' | 'settings'
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const { connected, messages, isThinking, activeTools, sendMessage, clearMessages } = useWebSocket()

  const handleVoiceTranscript = useCallback((text) => {
    sendMessage(text)
  }, [sendMessage])

  const { isListening, transcript, supported, toggleListening } = useVoice(handleVoiceTranscript)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input.trim())
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestedPrompt = (text) => {
    sendMessage(text)
    inputRef.current?.focus()
  }

  const showSuggestions = messages.length === 0

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* ── Main Chat ─────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 glass-dark">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm leading-none">AgentHub</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                {connected
                  ? <><Wifi className="w-3 h-3 text-green-400" /><span className="text-[10px] text-green-400">Connected</span></>
                  : <><WifiOff className="w-3 h-3 text-red-400" /><span className="text-[10px] text-red-400">Reconnecting...</span></>
                }
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setSidePanel(p => p === 'activity' ? 'none' : 'activity')}
              className={`p-2 rounded-lg transition-colors ${sidePanel === 'activity' ? 'bg-brand-700/50 text-brand-300' : 'hover:bg-white/10 text-gray-500 hover:text-gray-300'}`}
              title="Activity feed"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSidePanel(p => p === 'settings' ? 'none' : 'settings')}
              className={`p-2 rounded-lg transition-colors ${sidePanel === 'settings' ? 'bg-brand-700/50 text-brand-300' : 'hover:bg-white/10 text-gray-500 hover:text-gray-300'}`}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full gap-8 px-4"
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-700/50 border border-brand-600/50 flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-brand-300" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Hi! I'm AgentHub AI</h2>
                <p className="text-sm text-gray-400 max-w-sm">
                  I can order food, book flights, buy groceries, pay bills and more — just ask or tap the mic!
                </p>
              </div>
              <SuggestedPrompts onSelect={handleSuggestedPrompt} />
            </motion.div>
          )}

          {!showSuggestions && messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isThinking && !activeTools.length && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Tool activity strip */}
        <ToolIndicator activeTools={activeTools} />

        {/* Input bar */}
        <div className="border-t border-white/10 p-3 glass-dark">
          <div className="flex items-end gap-3">
            {/* Voice button */}
            {supported && (
              <div className="flex-shrink-0 pb-1">
                <VoiceButton
                  isListening={isListening}
                  onClick={toggleListening}
                  disabled={isThinking}
                  transcript={transcript}
                />
              </div>
            )}

            {/* Text input */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? 'Listening...' : 'Ask me to do anything...'}
                rows={1}
                className="
                  w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3
                  text-sm text-white placeholder-gray-600 resize-none
                  focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500
                  transition-all duration-200
                "
                style={{ minHeight: '48px', maxHeight: '120px' }}
                onInput={e => {
                  e.target.style.height = 'auto'
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
                }}
              />
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
              className="
                flex-shrink-0 w-11 h-11 rounded-xl bg-brand-600 hover:bg-brand-500
                flex items-center justify-center transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed active:scale-95
                shadow-lg shadow-brand-600/20
              "
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>

          <p className="text-center text-[10px] text-gray-700 mt-2">
            AgentHub AI can make real actions. Review before confirming high-value transactions.
          </p>
        </div>
      </div>

      {/* ── Side Panel ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {sidePanel !== 'none' && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="border-l border-white/10 bg-gray-900 overflow-hidden flex-shrink-0"
            style={{ width: 340 }}
          >
            {sidePanel === 'activity' && (
              <ActivityFeed onClose={() => setSidePanel('none')} />
            )}
            {sidePanel === 'settings' && (
              <SettingsPanel onClose={() => setSidePanel('none')} />
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}
