import { Mic, Loader2 } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useStore } from '../../store/useStore';

export function VoiceButton() {
  const { isSupported, toggleListening } = useSpeechRecognition();
  const isListening = useStore((s) => s.isListening);
  const isProcessing = useStore((s) => s.isProcessing);
  const transcript = useStore((s) => s.transcript);

  if (!isSupported) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Transcript preview */}
      {(isListening || transcript) && (
        <div className="px-4 py-2 rounded-full bg-[#1a1a27] border border-indigo-500/30 text-sm text-indigo-200 max-w-xs text-center animate-pulse">
          {transcript || 'Listening…'}
        </div>
      )}

      {/* Main mic button */}
      <div className="relative">
        {/* Pulse rings — only when listening */}
        {isListening && (
          <>
            <span className="absolute inset-0 rounded-full bg-indigo-500/20 pulse-ring" />
            <span className="absolute inset-0 rounded-full bg-indigo-500/10 pulse-ring-2" />
          </>
        )}

        <button
          onClick={toggleListening}
          disabled={isProcessing}
          aria-label={isListening ? 'Stop listening' : 'Start voice input'}
          className={`
            relative z-10 w-16 h-16 rounded-full flex items-center justify-center
            transition-all duration-200 shadow-lg
            ${isListening
              ? 'bg-indigo-600 scale-110 shadow-indigo-500/40'
              : isProcessing
                ? 'bg-[#1a1a27] cursor-not-allowed opacity-60'
                : 'bg-[#1a1a27] border border-[#32324e] hover:border-indigo-500/60 hover:bg-[#24243a] hover:scale-105'
            }
          `}
        >
          {isProcessing ? (
            <Loader2 size={24} className="text-indigo-400 animate-spin" />
          ) : isListening ? (
            <Waveform />
          ) : (
            <Mic size={24} className="text-slate-300" />
          )}
        </button>
      </div>

      <span className="text-xs text-slate-500">
        {isListening ? 'Tap to send' : isProcessing ? 'Processing…' : 'Tap to speak'}
      </span>
    </div>
  );
}

function Waveform() {
  return (
    <div className="flex items-center gap-[3px] h-6">
      {[...Array(7)].map((_, i) => (
        <span key={i} className="wave-bar" />
      ))}
    </div>
  );
}
