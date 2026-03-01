/**
 * 🪝 useBrainImages Hook
 * Handles loading reference images from Brain Library
 * 
 * @author LongSang (Elon Mode 🚀)
 */

import { useState, useEffect, useCallback } from 'react';
import type { ReferenceImage } from './types';

interface UseBrainImagesReturn {
  brainImages: ReferenceImage[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBrainImages(): UseBrainImagesReturn {
  const [brainImages, setBrainImages] = useState<ReferenceImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrainImages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/brain/images');
      
      // Check for rate limiting or other errors
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limited - please wait a moment and try again');
        }
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      const images = data.data || data;
      if (Array.isArray(images) && images.length > 0) {
        setBrainImages(images.map((img: {
          id: string;
          image_url?: string;
          imageUrl?: string;
          thumbnail_url?: string;
          thumbnailUrl?: string;
          analysis?: { title?: string; shortDescription?: string };
          tags?: string[];
        }) => ({
          id: img.id,
          url: img.image_url || img.imageUrl || '',
          thumbnailUrl: img.thumbnail_url || img.thumbnailUrl || img.image_url || img.imageUrl || '',
          title: img.analysis?.title || img.analysis?.shortDescription || 'Untitled',
          tags: img.tags || [],
        })));
      }
    } catch (e) {
      console.error('Failed to fetch brain images:', e);
      setError('Failed to load reference images');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrainImages();
  }, [fetchBrainImages]);

  return {
    brainImages,
    isLoading,
    error,
    refetch: fetchBrainImages,
  };
}
