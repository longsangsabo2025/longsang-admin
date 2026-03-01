/**
 * 🎬 useSeries Hook
 * Fetch and manage series list from Supabase
 * Shared between Series Planner and Production tabs
 * 
 * @author LongSang (Elon Mode 🚀)
 */

import { useState, useEffect, useCallback } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface SeriesEpisode {
  id: string;
  number: number;
  title: string;
  synopsis: string;
  hook?: string;
  story?: string;
  punchline?: string;
  cta?: string;
  visualNotes?: string;
  duration: number;
  status: 'outline' | 'scripted' | 'in_production' | 'completed';
}

export interface SeriesItem {
  id: string;
  title: string;
  description: string;
  theme: string;
  totalEpisodes: number;
  episodes: SeriesEpisode[];
  status: 'planning' | 'in_production' | 'completed';
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// HOOK
// =============================================================================

export function useSeries() {
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch series from Supabase
  const fetchSeries = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/series');
      const result = await response.json();
      
      if (result.success && result.data) {
        // Transform Supabase data to our SeriesItem format
        const transformedData: SeriesItem[] = result.data.map((item: {
          id: string;
          title?: string;
          name?: string;
          description?: string;
          theme?: string;
          total_episodes?: number;
          episodes?: Array<{
            id: string;
            episode_number: number;
            title?: string;
            description?: string;
            hook?: string;
            script_content?: string;
            status?: string;
          }>;
          status?: string;
          created_at?: string;
          updated_at?: string;
        }) => ({
          id: item.id,
          title: item.title || item.name || 'Untitled Series',
          description: item.description || '',
          theme: item.theme || '',
          totalEpisodes: item.total_episodes || item.episodes?.length || 0,
          episodes: (item.episodes || []).map((ep, idx) => {
            // Determine episode status
            let epStatus: SeriesEpisode['status'] = 'outline';
            if (ep.status === 'scripted') epStatus = 'scripted';
            else if (ep.status === 'completed') epStatus = 'completed';
            else if (ep.status === 'in_production') epStatus = 'in_production';
            
            return {
              id: ep.id,
              number: ep.episode_number || idx + 1,
              title: ep.title || `Episode ${ep.episode_number || idx + 1}`,
              synopsis: ep.description || '',
              hook: ep.hook || '',
              story: ep.script_content || '',
              punchline: '',
              cta: '',
              visualNotes: '',
              duration: 60,
              status: epStatus,
            };
          }),
          status: (item.status as SeriesItem['status']) || 'planning',
          createdAt: item.created_at || new Date().toISOString(),
          updatedAt: item.updated_at || new Date().toISOString(),
        }));
        
        setSeriesList(transformedData);
      } else {
        setSeriesList([]);
      }
    } catch (err) {
      console.error('Failed to fetch series:', err);
      setError('Không thể tải danh sách series');
      setSeriesList([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  // Get episodes for a specific series
  const getSeriesEpisodes = useCallback((seriesId: string): SeriesEpisode[] => {
    const series = seriesList.find(s => s.id === seriesId);
    return series?.episodes || [];
  }, [seriesList]);

  // Get a specific series by ID
  const getSeriesById = useCallback((seriesId: string): SeriesItem | null => {
    return seriesList.find(s => s.id === seriesId) || null;
  }, [seriesList]);

  // Refetch (useful after creating/deleting series)
  const refetch = useCallback(() => {
    fetchSeries();
  }, [fetchSeries]);

  return {
    seriesList,
    isLoading,
    error,
    refetch,
    getSeriesEpisodes,
    getSeriesById,
  };
}

export default useSeries;
