import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const STORAGE_KEY = 'admin-sidebar-favorites';
const MAX_FAVORITES = 7;

export interface FavoriteItem {
  href: string;
  title: string;
  icon: string;
}

function loadFavorites(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item: unknown): item is FavoriteItem =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as FavoriteItem).href === 'string' &&
        typeof (item as FavoriteItem).title === 'string' &&
        typeof (item as FavoriteItem).icon === 'string'
    );
  } catch {
    return [];
  }
}

export function useSidebarFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(loadFavorites);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const isFavorite = useCallback(
    (href: string) => favorites.some((f) => f.href === href),
    [favorites]
  );

  const addFavorite = useCallback((item: FavoriteItem) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.href === item.href)) return prev;
      if (prev.length >= MAX_FAVORITES) {
        toast.warning(`Tối đa ${MAX_FAVORITES} mục ghim`);
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const removeFavorite = useCallback((href: string) => {
    setFavorites((prev) => prev.filter((f) => f.href !== href));
  }, []);

  const toggleFavorite = useCallback((item: FavoriteItem) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.href === item.href)) {
        return prev.filter((f) => f.href !== item.href);
      }
      if (prev.length >= MAX_FAVORITES) {
        toast.warning(`Tối đa ${MAX_FAVORITES} mục ghim`);
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const reorderFavorites = useCallback((from: number, to: number) => {
    setFavorites((prev) => {
      if (from < 0 || from >= prev.length || to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    reorderFavorites,
  } as const;
}
