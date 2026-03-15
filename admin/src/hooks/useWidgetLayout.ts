/**
 * 🧩 Widget Layout Hook — Persists widget order + visibility in localStorage
 */

import { useCallback, useEffect, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────

export interface WidgetConfig {
  id: string;
  visible: boolean;
  order: number;
}

export interface UseWidgetLayoutReturn {
  layout: WidgetConfig[];
  toggleVisibility: (id: string) => void;
  moveUp: (id: string) => void;
  moveDown: (id: string) => void;
  reorder: (fromIndex: number, toIndex: number) => void;
  resetLayout: () => void;
  isVisible: (id: string) => boolean;
}

// ─── Constants ────────────────────────────────────────────────────────

export const DEFAULT_LAYOUT: WidgetConfig[] = [
  { id: 'ecosystem-health', visible: true, order: 0 },
  { id: 'quick-actions', visible: true, order: 1 },
  { id: 'ai-tools', visible: true, order: 2 },
  { id: 'automation', visible: true, order: 3 },
  { id: 'revenue', visible: true, order: 4 },
  { id: 'calendar-queue', visible: true, order: 5 },
  { id: 'recent-activity', visible: true, order: 6 },
];

export const STORAGE_KEY = 'mission-control-layout';
export const COLLAPSED_PREFIX = 'mission-control-collapsed-';

// ─── Helpers ──────────────────────────────────────────────────────────

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded — silently ignore
  }
}

// ─── Hook: useWidgetLayout ────────────────────────────────────────────

export function useWidgetLayout(): UseWidgetLayoutReturn {
  const [layout, setLayout] = useState<WidgetConfig[]>(() => {
    const stored = readStorage<WidgetConfig[]>(STORAGE_KEY, []);
    if (!stored.length) return DEFAULT_LAYOUT;

    // Merge: keep stored order/visibility, add any new widgets from defaults
    const storedIds = new Set(stored.map((w) => w.id));
    const merged = [...stored];
    for (const def of DEFAULT_LAYOUT) {
      if (!storedIds.has(def.id)) {
        merged.push({ ...def, order: merged.length });
      }
    }
    // Remove widgets that no longer exist in defaults
    const defaultIds = new Set(DEFAULT_LAYOUT.map((w) => w.id));
    return merged
      .filter((w) => defaultIds.has(w.id))
      .sort((a, b) => a.order - b.order)
      .map((w, i) => ({ ...w, order: i }));
  });

  // Persist on change
  useEffect(() => {
    writeStorage(STORAGE_KEY, layout);
  }, [layout]);

  const toggleVisibility = useCallback((id: string) => {
    setLayout((prev) => prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)));
  }, []);

  const moveUp = useCallback((id: string) => {
    setLayout((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((w) => w.id === id);
      if (idx <= 0) return prev;
      const newLayout = sorted.map((w, i) => {
        if (i === idx - 1) return { ...w, order: idx };
        if (i === idx) return { ...w, order: idx - 1 };
        return { ...w, order: i };
      });
      return newLayout.sort((a, b) => a.order - b.order);
    });
  }, []);

  const moveDown = useCallback((id: string) => {
    setLayout((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((w) => w.id === id);
      if (idx < 0 || idx >= sorted.length - 1) return prev;
      const newLayout = sorted.map((w, i) => {
        if (i === idx) return { ...w, order: idx + 1 };
        if (i === idx + 1) return { ...w, order: idx };
        return { ...w, order: i };
      });
      return newLayout.sort((a, b) => a.order - b.order);
    });
  }, []);

  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    setLayout((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const [moved] = sorted.splice(fromIndex, 1);
      sorted.splice(toIndex, 0, moved);
      return sorted.map((w, i) => ({ ...w, order: i }));
    });
  }, []);

  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
    for (const w of DEFAULT_LAYOUT) {
      try {
        localStorage.removeItem(`${COLLAPSED_PREFIX}${w.id}`);
      } catch {
        // ignore
      }
    }
  }, []);

  const isVisible = useCallback(
    (id: string) => layout.find((w) => w.id === id)?.visible ?? true,
    [layout]
  );

  return { layout, toggleVisibility, moveUp, moveDown, reorder, resetLayout, isVisible };
}
