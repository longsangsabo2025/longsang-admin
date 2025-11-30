/**
 * 🔄 usePersistedState Hook
 *
 * Hook này wrap useState để tự động persist state vào localStorage.
 * Sử dụng khi bạn muốn giữ state của component sau khi navigate.
 *
 * @example
 * ```tsx
 * // Thay vì:
 * const [tab, setTab] = useState('home');
 *
 * // Sử dụng:
 * const [tab, setTab] = usePersistedState('my-page-tab', 'home');
 * ```
 */

import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = T | ((val: T) => T);

export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, (value: SetValue<T>) => void] {
  // Lazy initialization - chỉ đọc localStorage 1 lần
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored) as T;
      }
    } catch (error) {
      console.warn(`[usePersistedState] Failed to parse ${key}:`, error);
    }
    return defaultValue;
  });

  // Persist to localStorage khi state thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`[usePersistedState] Failed to save ${key}:`, error);
    }
  }, [key, state]);

  // Wrapped setter
  const setValue = useCallback((value: SetValue<T>) => {
    setState((prev) => {
      const nextValue = typeof value === 'function' ? (value as (val: T) => T)(prev) : value;
      return nextValue;
    });
  }, []);

  return [state, setValue];
}

/**
 * 🔄 useSessionState Hook
 *
 * Tương tự usePersistedState nhưng dùng sessionStorage.
 * State sẽ bị xóa khi đóng tab/window.
 */
export function useSessionState<T>(
  key: string,
  defaultValue: T
): [T, (value: SetValue<T>) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored) as T;
      }
    } catch (error) {
      console.warn(`[useSessionState] Failed to parse ${key}:`, error);
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`[useSessionState] Failed to save ${key}:`, error);
    }
  }, [key, state]);

  const setValue = useCallback((value: SetValue<T>) => {
    setState((prev) => {
      const nextValue = typeof value === 'function' ? (value as (val: T) => T)(prev) : value;
      return nextValue;
    });
  }, []);

  return [state, setValue];
}

/**
 * 🔄 useScrollRestore Hook
 *
 * Tự động save và restore scroll position khi navigate.
 */
export function useScrollRestore(pageId: string) {
  useEffect(() => {
    // Restore scroll position on mount
    const savedPosition = sessionStorage.getItem(`scroll-${pageId}`);
    if (savedPosition) {
      window.scrollTo(0, Number.parseInt(savedPosition, 10));
    }

    // Save scroll position on unmount or before navigate
    const handleScroll = () => {
      sessionStorage.setItem(`scroll-${pageId}`, String(window.scrollY));
    };

    // Debounced scroll handler
    let timeoutId: ReturnType<typeof setTimeout>;
    const debouncedHandler = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 100);
    };

    window.addEventListener('scroll', debouncedHandler, { passive: true });

    return () => {
      handleScroll(); // Save final position
      window.removeEventListener('scroll', debouncedHandler);
      clearTimeout(timeoutId);
    };
  }, [pageId]);
}

export default usePersistedState;
