/**
 * 🎤 VoiceInputButton Component
 * 
 * Beautiful voice input button with visual feedback
 * Press and hold to record, release to stop
 */

import { useState, useCallback } from 'react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  language?: string;
  className?: string;
  disabled?: boolean;
}

export function VoiceInputButton({
  onTranscript,
  language = 'vi-VN',
  className,
  disabled = false,
}: VoiceInputButtonProps) {
  const [showPulse, setShowPulse] = useState(false);

  const handleResult = useCallback((text: string, isFinal: boolean) => {
    if (isFinal && text.trim()) {
      onTranscript(text.trim());
    }
  }, [onTranscript]);

  const {
    isListening,
    isSupported,
    interimTranscript,
    error,
    toggleListening,
  } = useVoiceInput({
    language,
    continuous: false,
    interimResults: true,
    onResult: handleResult,
  });

  const handleClick = useCallback(() => {
    if (!isSupported) {
      alert('Trình duyệt của bạn không hỗ trợ nhận dạng giọng nói. Vui lòng sử dụng Chrome hoặc Edge.');
      return;
    }
    toggleListening();
    setShowPulse(!isListening);
  }, [isSupported, isListening, toggleListening]);

  if (!isSupported) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled
              className={cn('opacity-50', className)}
            >
              <MicOff className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Trình duyệt không hỗ trợ Voice Input</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            {/* Pulse animation when listening */}
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25" />
                <span className="absolute inset-0 rounded-full bg-red-500 animate-pulse opacity-50" />
              </>
            )}
            
            <Button
              variant={isListening ? 'destructive' : 'ghost'}
              size="icon"
              onClick={handleClick}
              disabled={disabled}
              className={cn(
                'relative z-10 transition-all duration-200',
                isListening && 'scale-110',
                className
              )}
            >
              {isListening ? (
                <Mic className="h-4 w-4 animate-pulse" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{isListening ? 'Đang nghe... Click để dừng' : 'Click để nói (Voice Input)'}</p>
          {interimTranscript && (
            <p className="text-xs text-muted-foreground mt-1">"{interimTranscript}"</p>
          )}
          {error && (
            <p className="text-xs text-red-400 mt-1">{error}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default VoiceInputButton;
