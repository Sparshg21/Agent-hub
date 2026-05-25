import { useRef, useCallback, useEffect } from 'react';
import { useStore } from '../store/useStore';

type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList;
  resultIndex: number;
};

// Extend window for browser Speech API
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
  }
}

export function useSpeechRecognition() {
  const { setListening, setTranscript, sendMessage } = useStore();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const isListening = useStore((s) => s.isListening);

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // Indian English for better accuracy

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      finalTranscriptRef.current += finalTranscript;
      setTranscript(finalTranscriptRef.current || interimTranscript);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      const transcript = finalTranscriptRef.current.trim();
      setListening(false);

      if (transcript) {
        sendMessage(transcript);
        setTranscript('');
        finalTranscriptRef.current = '';
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [isSupported, setListening, setTranscript, sendMessage]);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) return;
    finalTranscriptRef.current = '';
    setTranscript('');
    setListening(true);
    recognitionRef.current.start();
  }, [isSupported, setListening, setTranscript]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    // onend will fire and handle sending
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return { isSupported, startListening, stopListening, toggleListening };
}
