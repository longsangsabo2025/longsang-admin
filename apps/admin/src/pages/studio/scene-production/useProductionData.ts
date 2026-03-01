/**
 * 🪝 useProductionData Hook
 * Handles loading/saving production data from Supabase
 * 
 * @author LongSang (Elon Mode 🚀)
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import type { Scene, EpisodeData, ProductionItem, ProductionStep } from './types';
import { SCENE_PRODUCTION_KEY } from './types';

interface ProductionSettings {
  aspectRatio: string;
  aiModel: string;
  scenePrompt: string;
}

interface UseProductionDataReturn {
  // State
  scenes: Scene[];
  episode: EpisodeData | null;
  productionId: string | null;
  currentStep: ProductionStep;
  availableProductions: ProductionItem[];
  isSaving: boolean;
  isLoading: boolean;
  lastSaved: Date | null;
  
  // Actions
  setScenes: React.Dispatch<React.SetStateAction<Scene[]>>;
  setEpisode: React.Dispatch<React.SetStateAction<EpisodeData | null>>;
  setCurrentStep: React.Dispatch<React.SetStateAction<ProductionStep>>;
  loadProductionById: (id: string) => Promise<void>;
  saveToSupabase: () => Promise<void>;
  clearProduction: () => void;
  fetchAvailableProductions: () => Promise<void>;
  updateScene: (sceneId: string, updates: Partial<Scene>) => void;
}

export function useProductionData(settings: ProductionSettings): UseProductionDataReturn {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [episode, setEpisode] = useState<EpisodeData | null>(null);
  const [productionId, setProductionId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<ProductionStep>('input');
  const [availableProductions, setAvailableProductions] = useState<ProductionItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Update single scene
  const updateScene = useCallback((sceneId: string, updates: Partial<Scene>) => {
    setScenes(prev => prev.map(s => 
      s.id === sceneId ? { ...s, ...updates } : s
    ));
  }, []);

  // Fetch available productions
  const fetchAvailableProductions = useCallback(async () => {
    try {
      const res = await fetch('/api/productions');
      if (res.ok) {
        const { data } = await res.json();
        setAvailableProductions(data || []);
      }
    } catch (e) {
      console.error('Failed to fetch productions:', e);
    }
  }, []);

  // Load production by ID
  const loadProductionById = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/productions/${id}`);
      if (!res.ok) {
        throw new Error('Failed to load production');
      }
      
      const { data } = await res.json();
      if (!data) {
        throw new Error('Production not found');
      }
      
      setProductionId(data.id);
      setScenes(data.scenes || []);
      setCurrentStep(data.status === 'completed' ? 'review' : 'production');
      
      if (data.episode_title) {
        setEpisode(prev => ({ 
          ...prev, 
          title: data.episode_title,
          script: data.script_content 
        } as EpisodeData));
      }
      
      // Save to localStorage for persistence
      localStorage.setItem(SCENE_PRODUCTION_KEY, JSON.stringify({
        productionId: data.id,
        scenes: data.scenes,
        step: 'production'
      }));
      
      toast.success(`Đã load production: ${data.episode_title}`);
    } catch (e) {
      console.error('Failed to load production:', e);
      toast.error('Không thể load production');
    }
  }, []);

  // Save to Supabase
  const saveToSupabase = useCallback(async () => {
    if (scenes.length === 0) return;
    
    setIsSaving(true);
    try {
      const payload = {
        episode_title: episode?.title || 'Untitled Production',
        episode_number: episode?.number,
        script_content: episode?.script,
        scenes,
        settings: {
          aspectRatio: settings.aspectRatio,
          aiModel: settings.aiModel,
          scenePrompt: settings.scenePrompt,
        },
        status: currentStep === 'review' ? 'completed' : 'in_progress',
      };
      
      if (productionId) {
        const res = await fetch(`/api/productions/${productionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to save');
      } else {
        const res = await fetch('/api/productions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create');
        const { data } = await res.json();
        setProductionId(data.id);
      }
      
      setLastSaved(new Date());
      
      // Also save to localStorage as backup
      localStorage.setItem(SCENE_PRODUCTION_KEY, JSON.stringify({
        productionId,
        scenes,
        step: currentStep,
        updatedAt: new Date().toISOString(),
      }));
    } catch (e) {
      console.error('Failed to save to Supabase:', e);
    } finally {
      setIsSaving(false);
    }
  }, [scenes, currentStep, episode, productionId, settings]);

  // Clear production
  const clearProduction = useCallback(() => {
    setScenes([]);
    setEpisode(null);
    setCurrentStep('input');
    setProductionId(null);
    setLastSaved(null);
    localStorage.removeItem(SCENE_PRODUCTION_KEY);
    toast.success('Đã xóa dữ liệu production');
  }, []);

  // Helper: Load episode from Series Planner handoff
  const loadFromSeriesPlanner = useCallback(() => {
    const saved = localStorage.getItem('series_episode_for_production');
    if (!saved) return;
    
    const data = JSON.parse(saved);
    setEpisode(data);
    localStorage.removeItem('series_episode_for_production');
    toast.success(`Đã load episode: ${data.title}`);
  }, []);

  // Helper: Apply Supabase data to state
  const applySupabaseData = useCallback((
    data: { id: string; scenes?: Scene[]; status?: string; episode_title?: string },
    fallbackStep: ProductionStep
  ) => {
    setProductionId(data.id);
    setScenes(data.scenes || []);
    setCurrentStep(data.status === 'completed' ? 'review' : fallbackStep);
    
    if (data.episode_title) {
      setEpisode(prev => ({ ...prev, title: data.episode_title } as EpisodeData));
    }
    toast.success(`Đã khôi phục production: ${data.episode_title}`);
  }, []);

  // Helper: Apply localStorage fallback data
  const applyLocalStorageFallback = useCallback((
    savedScenes: Scene[] | undefined,
    step: ProductionStep | undefined
  ) => {
    if (savedScenes && savedScenes.length > 0) {
      setScenes(savedScenes);
      setCurrentStep(step || 'scenes');
    }
  }, []);

  // Helper: Fetch production from Supabase by ID
  const fetchProductionFromSupabase = useCallback(async (
    savedId: string,
    fallbackStep: ProductionStep
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/productions/${savedId}`);
      if (!res.ok) return false;
      
      const { data } = await res.json();
      if (!data) return false;
      
      applySupabaseData(data, fallbackStep);
      return true;
    } catch (e) {
      console.error('Failed to load from Supabase:', e);
      return false;
    }
  }, [applySupabaseData]);

  // Helper: Load saved production state from localStorage/Supabase
  const loadSavedProduction = useCallback(async () => {
    const savedProduction = localStorage.getItem(SCENE_PRODUCTION_KEY);
    if (!savedProduction) return;
    
    const { productionId: savedId, scenes: savedScenes, step } = JSON.parse(savedProduction);
    
    if (savedId) {
      const loaded = await fetchProductionFromSupabase(savedId, step || 'scenes');
      if (!loaded) {
        applyLocalStorageFallback(savedScenes, step);
      }
    } else {
      applyLocalStorageFallback(savedScenes, step);
    }
  }, [fetchProductionFromSupabase, applyLocalStorageFallback]);

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      
      try {
        loadFromSeriesPlanner();
        await loadSavedProduction();
      } catch (e) {
        console.error('Failed to load initial data:', e);
      } finally {
        setIsLoading(false);
        fetchAvailableProductions();
      }
    };
    
    loadInitialData();
  }, [fetchAvailableProductions, loadFromSeriesPlanner, loadSavedProduction]);

  // Auto-save every 10 seconds when scenes change
  useEffect(() => {
    if (scenes.length === 0) return;
    
    const timer = setTimeout(() => {
      saveToSupabase();
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [scenes, saveToSupabase]);

  return {
    scenes,
    episode,
    productionId,
    currentStep,
    availableProductions,
    isSaving,
    isLoading,
    lastSaved,
    setScenes,
    setEpisode,
    setCurrentStep,
    loadProductionById,
    saveToSupabase,
    clearProduction,
    fetchAvailableProductions,
    updateScene,
  };
}
