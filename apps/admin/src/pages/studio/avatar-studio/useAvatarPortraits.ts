/**
 * Hook for Portrait and Brain Character management
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import type { OwnerPortrait } from './types';

export function useAvatarPortraits() {
  const [ownerPortraits, setOwnerPortraits] = useState<OwnerPortrait[]>([]);
  const [selectedPortraits, setSelectedPortraits] = useState<string[]>([]);
  const [showBrainLibrary, setShowBrainLibrary] = useState(false);
  const [brainCharacters, setBrainCharacters] = useState<any[]>([]);
  const [showCharacterPicker, setShowCharacterPicker] = useState(false);

  // Fetch on mount
  useEffect(() => {
    fetchOwnerPortraits();
    fetchBrainCharacters();
  }, []);

  const fetchBrainCharacters = async () => {
    try {
      const userId = '89917901-cf15-45c4-a7ad-8c4c9513347e';
      const response = await fetch(`/api/brain/characters?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setBrainCharacters(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch brain characters:', error);
    }
  };

  const fetchOwnerPortraits = async () => {
    try {
      const userId = '89917901-cf15-45c4-a7ad-8c4c9513347e';
      const response = await fetch(`/api/brain/images?userId=${userId}&isOwnerPortrait=true`);
      if (response.ok) {
        const data = await response.json();
        const portraits = (data.images || []).map((img: any) => ({
          id: img.id,
          imageUrl: img.image_url || img.imageUrl,
          thumbnailUrl: img.thumbnail_url || img.thumbnailUrl,
          angle: 'front' as const,
          expression: 'neutral' as const,
          outfit: 'default',
          isActive: true,
        }));
        setOwnerPortraits(portraits);
      }
    } catch (error) {
      console.error('Failed to fetch portraits:', error);
    }
  };

  // Fetch images for a specific character to use as portraits
  const fetchImagesForCharacter = async (imageIds: string[]) => {
    try {
      const userId = '89917901-cf15-45c4-a7ad-8c4c9513347e';
      const response = await fetch(`/api/brain/images?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        const allImages = data.data || [];
        const characterImages = allImages.filter((img: any) => imageIds.includes(img.id));

        const newPortraits: OwnerPortrait[] = characterImages.map((img: any) => ({
          id: img.id,
          imageUrl: img.image_url || img.imageUrl,
          thumbnailUrl: img.thumbnail_url || img.thumbnailUrl,
          angle: 'front' as const,
          expression: 'neutral' as const,
          outfit: 'default',
          isActive: true,
        }));

        if (newPortraits.length > 0) {
          setOwnerPortraits(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNew = newPortraits.filter(p => !existingIds.has(p.id));
            return [...prev, ...uniqueNew];
          });
          toast.success(`Đã thêm ${newPortraits.length} ảnh của nhân vật`);
        }
      }
    } catch (error) {
      console.error('Failed to fetch character images:', error);
    }
  };

  // Handle images selected from Brain Library
  const handleBrainLibrarySelect = useCallback((images: any[]) => {
    const newPortraits: OwnerPortrait[] = images.map(img => ({
      id: img.id,
      imageUrl: img.imageUrl || img.image_url,
      thumbnailUrl: img.thumbnailUrl || img.thumbnail_url,
      angle: 'front' as const,
      expression: 'neutral' as const,
      outfit: 'default',
      isActive: true,
    }));

    // Add new portraits, avoiding duplicates
    setOwnerPortraits(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const uniqueNew = newPortraits.filter(p => !existingIds.has(p.id));
      return [...prev, ...uniqueNew];
    });

    setShowBrainLibrary(false);
    toast.success(`Đã thêm ${newPortraits.length} ảnh từ Brain Library`);
  }, []);

  return {
    ownerPortraits,
    selectedPortraits,
    setSelectedPortraits,
    showBrainLibrary,
    setShowBrainLibrary,
    brainCharacters,
    showCharacterPicker,
    setShowCharacterPicker,
    fetchOwnerPortraits,
    fetchImagesForCharacter,
    handleBrainLibrarySelect,
  };
}
