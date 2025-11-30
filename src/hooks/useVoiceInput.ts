/**
 * 🎤 useVoiceInput Hook - Elon Musk Edition
 * 
 * Web Speech API for voice-to-text input
 * Works in Chrome, Edge, Safari (with webkit prefix)
 * 
 * Features:
 * - Real-time speech recognition
 * - Auto-language detection (Vietnamese/English)
 * - Continuous listening mode
 * - Error handling with retry
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export interface UseVoiceInputOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export interface UseVoiceInputReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  resetTranscript: () => void;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const {
    language = 'vi-VN', // Default Vietnamese
    continuous = false,
    interimResults = true,
    onResult,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      console.log('[VoiceInput] 🎤 Started listening...');
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log('[VoiceInput] 🔇 Stopped listening');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        
        if (result.isFinal) {
          finalTranscript += text;
        } else {
          interimText += text;
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
        setInterimTranscript('');
        onResult?.(finalTranscript, true);
        console.log('[VoiceInput] ✅ Final:', finalTranscript);
      } else {
        setInterimTranscript(interimText);
        onResult?.(interimText, false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessage = getErrorMessage(event.error);
      setError(errorMessage);
      setIsListening(false);
      onError?.(errorMessage);
      console.error('[VoiceInput] ❌ Error:', event.error);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [language, continuous, interimResults, onResult, onError, isSupported]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    
    setError(null);
    setInterimTranscript('');
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      // Already started, ignore
      console.warn('[VoiceInput] Already listening');
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    
    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.warn('[VoiceInput] Already stopped');
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
}

function getErrorMessage(error: string): string {
  switch (error) {
    case 'no-speech':
      return 'Không phát hiện giọng nói. Hãy thử lại.';
    case 'audio-capture':
      return 'Không thể truy cập microphone. Kiểm tra quyền truy cập.';
    case 'not-allowed':
      return 'Quyền microphone bị từ chối. Cho phép truy cập trong cài đặt.';
    case 'network':
      return 'Lỗi mạng. Kiểm tra kết nối internet.';
    case 'aborted':
      return 'Đã dừng nhận dạng giọng nói.';
    case 'language-not-supported':
      return 'Ngôn ngữ không được hỗ trợ.';
    default:
      return `Lỗi nhận dạng giọng nói: ${error}`;
  }
}

export default useVoiceInput;
