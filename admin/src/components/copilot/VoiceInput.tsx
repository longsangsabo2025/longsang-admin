/**
 * 🎤 Voice Input Component
 *
 * Voice input support for Copilot commands
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

import { Loader2, Mic } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onError?: (error: Error) => void;
  language?: string;
  disabled?: boolean;
  className?: string;
}

export function VoiceInput({
  onTranscript,
  onError,
  language = 'vi-VN',
  disabled = false,
  className,
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const errorMessage = getErrorMessage(event.error);
        setError(errorMessage);
        setIsListening(false);
        if (onError) {
          onError(new Error(errorMessage));
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      setError('Voice input không được hỗ trợ trên browser này');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, onTranscript, onError]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting voice recognition:', err);
        setError('Không thể bắt đầu voice input');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'no-speech':
        return 'Không phát hiện giọng nói. Vui lòng thử lại.';
      case 'audio-capture':
        return 'Không thể truy cập microphone. Vui lòng kiểm tra permissions.';
      case 'not-allowed':
        return 'Microphone permission bị từ chối. Vui lòng enable trong browser settings.';
      case 'network':
        return 'Lỗi kết nối mạng. Vui lòng thử lại.';
      default:
        return `Lỗi voice input: ${error}`;
    }
  };

  if (!isSupported) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        Voice input không được hỗ trợ
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        type="button"
        variant={isListening ? 'destructive' : 'outline'}
        size="icon"
        onClick={isListening ? stopListening : startListening}
        disabled={disabled || !isSupported}
        className={cn('h-9 w-9', isListening && 'animate-pulse')}
      >
        {isListening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
        <span className="sr-only">{isListening ? 'Dừng voice input' : 'Bắt đầu voice input'}</span>
      </Button>

      {error && <div className="text-sm text-destructive">{error}</div>}

      {isListening && (
        <div className="text-sm text-muted-foreground animate-pulse">Đang nghe...</div>
      )}
    </div>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
