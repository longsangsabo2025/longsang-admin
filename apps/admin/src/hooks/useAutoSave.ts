/**
 * 💾 Universal Auto-Save Hook
 * Generic hook for automatic data persistence
 * 
 * @author LongSang (Elon Mode 🚀)
 */

import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseAutoSaveOptions<T> {
  /** Data to auto-save */
  data: T;
  /** Save function that returns a Promise */
  saveFunction: (data: T) => Promise<void>;
  /** Auto-save interval in milliseconds (default: 10000 = 10s) */
  interval?: number;
  /** Enable/disable auto-save (default: true) */
  enabled?: boolean;
  /** Show toast notifications (default: false) */
  showToast?: boolean;
  /** Custom success message */
  successMessage?: string;
  /** Custom error message */
  errorMessage?: string;
  /** Debounce delay for rapid changes (default: 1000ms) */
  debounceDelay?: number;
}

interface UseAutoSaveReturn {
  /** Is currently saving */
  isSaving: boolean;
  /** Last save timestamp */
  lastSaved: Date | null;
  /** Last error message */
  error: string | null;
  /** Manual save trigger */
  save: () => Promise<void>;
  /** Reset error state */
  clearError: () => void;
}

/**
 * Universal auto-save hook with debouncing and error handling
 * 
 * @example
 * ```tsx
 * const { isSaving, lastSaved, save } = useAutoSave({
 *   data: formData,
 *   saveFunction: async (data) => {
 *     await fetch('/api/save', {
 *       method: 'POST',
 *       body: JSON.stringify(data)
 *     });
 *   },
 *   interval: 10000, // 10 seconds
 *   enabled: isDirty,
 *   showToast: true
 * });
 * ```
 */
export function useAutoSave<T>({
  data,
  saveFunction,
  interval = 10000,
  enabled = true,
  showToast = false,
  successMessage = 'Đã lưu tự động',
  errorMessage = 'Lỗi khi lưu',
  debounceDelay = 1000
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const { toast } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const saveTimerRef = useRef<NodeJS.Timeout>();
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const lastDataRef = useRef<T>(data);
  const isMountedRef = useRef(true);

  /**
   * Manual save function
   */
  const save = async () => {
    if (!enabled || isSaving) return;

    try {
      setIsSaving(true);
      setError(null);

      await saveFunction(data);

      if (isMountedRef.current) {
        setLastSaved(new Date());
        lastDataRef.current = data;

        if (showToast) {
          toast({
            title: '✅ ' + successMessage,
            duration: 2000
          });
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      
      if (isMountedRef.current) {
        setError(errorMsg);

        if (showToast) {
          toast({
            title: '❌ ' + errorMessage,
            description: errorMsg,
            variant: 'destructive',
            duration: 4000
          });
        }
      }

      console.error('[Auto-Save] Error:', err);
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Auto-save effect with debouncing
   */
  useEffect(() => {
    // Skip if disabled or no data
    if (!enabled || !data) {
      return;
    }

    // Skip if data hasn't changed (deep comparison)
    const dataChanged = JSON.stringify(data) !== JSON.stringify(lastDataRef.current);
    if (!dataChanged) {
      return;
    }

    // Clear existing timers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Debounce rapid changes
    debounceTimerRef.current = setTimeout(() => {
      // Schedule auto-save after interval
      saveTimerRef.current = setTimeout(() => {
        save();
      }, interval);
    }, debounceDelay);

    // Cleanup on unmount or dependency change
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [data, saveFunction, interval, enabled, debounceDelay]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  return {
    isSaving,
    lastSaved,
    error,
    save,
    clearError
  };
}

/**
 * Format last saved time for display
 */
export function formatLastSaved(lastSaved: Date | null): string {
  if (!lastSaved) return 'Chưa lưu';

  const now = new Date();
  const diff = now.getTime() - lastSaved.getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 10) return 'Vừa lưu';
  if (seconds < 60) return `${seconds}s trước`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  
  return lastSaved.toLocaleString('vi-VN');
}
