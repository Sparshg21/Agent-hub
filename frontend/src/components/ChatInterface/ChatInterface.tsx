import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { ActionCard } from '../ActionCard/ActionCard';
import { VoiceButton } from '../VoiceButton/VoiceButton';

// Simple markdown renderer — install react-markdown below if not already
// For now we do a lightweight inline renderer
function MessageContent({ content }: { content: string }) {
  // Convert **bold** and basic markdown
  const html = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-white/10 px-1 rounded text-indigo-300">$1</code>')
    .split('\n')
    .map((line, i) => line ? `<p key="${i}" class="mb-1">${line}</p>` : '<br/>')
    .join('');

  return (
    <div
      className="text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
        <span className="text-sm">🤖</span>
      </div>
      <div className="bg-[#1a1a27] border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="typing-dot w-2 h-2 rounded-full bg-indigo-400"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ChatInterface() {
  const { messages, sendMessage, isProcessing } = useStore();
  const { isSupported } = useSpeechRecognition();
  const isListening = useStore((s) => s.isListening);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isProcessing) return;
    setInputValue('');
    sendMessage(text);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6 space-y-2">
        {messages.map((msg) => {
          if (msg.isTyping) return <TypingIndicator key="typing" />;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 fade-slide-in ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm">🤖</span>
                </div>
              )}

              <div className={`max-w-[80%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                {/* Bubble */}
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-sm'
                      : 'bg-[#1a1a27] border border-white/10 text-slate-200 rounded-tl-sm'
                  }`}
                >
                  <MessageContent content={msg.content} />
                </div>

                {/* Action card (if any) */}
                {msg.pendingAction && (
                  <div className="w-full max-w-sm">
                    <ActionCard action={msg.pendingAction} />
                  </div>
                )}

                {/* Timestamp */}
                <span className="text-xs text-slate-600 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 pb-6 pt-3 border-t border-white/5">
        <div className="flex items-end gap-3">
          {/* Voice button */}
          {isSupported && (
            <div className="flex-shrink-0 pb-1">
              <VoiceButton />
            </div>
          )}

          {/* Text input */}
          <div className="flex-1 flex items-end gap-2 bg-[#1a1a27] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-indigo-500/50 transition-colors">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? 'Listening…' : 'Type a message or tap the mic…'}
              rows={1}
              disabled={isListening || isProcessing}
              className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 resize-none outline-none max-h-32 scrollbar-thin disabled:opacity-50"
              style={{ minHeight: '24px' }}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isProcessing}
              className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            >
              <Send size={15} className="text-white" />
            </button>
          </div>
        </div>

        {/* Quick suggestions */}
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              disabled={isProcessing || isListening}
              className="px-3 py-1.5 rounded-full text-xs text-slate-400 border border-white/10 hover:border-indigo-500/40 hover:text-indigo-300 hover:bg-indigo-500/5 transition-all disabled:opacity-40"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const QUICK_PROMPTS = [
  '🍔 Order food',
  '✈️ Book a flight',
  '🛒 Get groceries',
  '💳 Recharge Jio',
  '📋 Pay electricity bill',
];
