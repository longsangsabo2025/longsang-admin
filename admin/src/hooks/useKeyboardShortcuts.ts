/**
 * Global keyboard shortcuts hook (Gmail/GitHub style sequential keys)
 * Press G then a letter within 500ms to navigate, N then a letter to create.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export interface ShortcutEntry {
  keys: string;
  description: string;
  category: 'navigation' | 'create' | 'general';
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  onShowHelp?: () => void;
}

const SEQUENCE_TIMEOUT = 500;

const GO_TO_MAP: Record<string, string> = {
  h: '/admin/mission-control',
  y: '/admin/youtube-channels',
  p: '/admin/pipeline-builder',
  v: '/admin/video-factory',
  b: '/admin/brain',
  a: '/admin/ai-workspace',
  s: '/admin/social-media',
  c: '/admin/content-queue',
  m: '/admin/unified-analytics',
};

const NEW_ITEM_MAP: Record<string, string> = {
  v: '/admin/video-factory?tab=create',
  p: '/admin/pipeline-builder?view=builder',
};

const GO_LABELS: Record<string, string> = {
  h: 'Trang chủ (Mission Control)',
  y: 'Kênh YouTube',
  p: 'Pipeline Builder',
  v: 'Video Factory',
  b: 'Bộ não AI (Brain)',
  a: 'AI Workspace',
  s: 'Mạng xã hội',
  c: 'Hàng đợi nội dung',
  m: 'Phân tích & Metrics',
};

const NEW_LABELS: Record<string, string> = {
  v: 'Tạo video mới',
  p: 'Tạo pipeline mới',
};

export const SHORTCUTS: ShortcutEntry[] = [
  ...Object.entries(GO_LABELS).map(([key, desc]) => ({
    keys: `G + ${key.toUpperCase()}`,
    description: desc,
    category: 'navigation' as const,
  })),
  ...Object.entries(NEW_LABELS).map(([key, desc]) => ({
    keys: `N + ${key.toUpperCase()}`,
    description: desc,
    category: 'create' as const,
  })),
  { keys: '?', description: 'Hiện bảng phím tắt', category: 'general' },
];

function isEditableTarget(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true, onShowHelp } = options;
  const navigate = useNavigate();

  const pendingPrefix = useRef<'g' | 'n' | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPending = useCallback(() => {
    pendingPrefix.current = null;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      // Second key of a sequence
      if (pendingPrefix.current) {
        const prefix = pendingPrefix.current;
        clearPending();

        if (prefix === 'g' && GO_TO_MAP[key]) {
          e.preventDefault();
          navigate(GO_TO_MAP[key]);
          return;
        }
        if (prefix === 'n' && NEW_ITEM_MAP[key]) {
          e.preventDefault();
          navigate(NEW_ITEM_MAP[key]);
          return;
        }
        // Unrecognized second key — ignore
        return;
      }

      // Prefix keys
      if (key === 'g' || key === 'n') {
        e.preventDefault();
        pendingPrefix.current = key;
        timeoutRef.current = setTimeout(clearPending, SEQUENCE_TIMEOUT);
        return;
      }

      // Single key shortcuts
      if (e.key === '?' && onShowHelp) {
        e.preventDefault();
        onShowHelp();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearPending();
    };
  }, [enabled, navigate, onShowHelp, clearPending]);

  return { shortcuts: SHORTCUTS };
}
