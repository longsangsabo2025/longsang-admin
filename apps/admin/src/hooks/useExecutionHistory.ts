/**
 * Hook for managing execution history
 * Save/load execution steps history to/from Supabase (with localStorage fallback)
 */

import { useCallback, useEffect, useState } from 'react';
import { ExecutionStep } from './useExecutionSteps';
import { supabase } from '@/lib/supabase';

export interface ExecutionHistory {
  id: string;
  command: string;
  timestamp: Date;
  steps: ExecutionStep[];
  duration: number;
  status: 'completed' | 'failed' | 'cancelled';
  error?: string;
  user_id?: string;
  layers_used?: string[];
  metadata?: Record<string, any>;
}

const STORAGE_KEY = 'longsang_execution_history';
const MAX_HISTORY_ITEMS = 100;

export function useExecutionHistory() {
  const [history, setHistory] = useState<ExecutionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [useSupabase, setUseSupabase] = useState(true);

  // Load history from Supabase or localStorage
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);

      try {
        // Try Supabase first
        const { data, error } = await supabase
          .from('execution_history')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(MAX_HISTORY_ITEMS);

        if (error) {
          console.warn('Supabase load failed, using localStorage:', error.message);
          setUseSupabase(false);
          loadFromLocalStorage();
        } else if (data) {
          const historyWithDates = data.map((item: any) => ({
            id: item.id,
            command: item.command,
            timestamp: new Date(item.created_at),
            steps: item.steps || [],
            duration: item.duration || 0,
            status: item.status,
            error: item.error,
            user_id: item.user_id,
            layers_used: item.layers_used,
            metadata: item.metadata,
          }));
          setHistory(historyWithDates);
          setUseSupabase(true);
        }
      } catch (err) {
        console.warn('Supabase connection failed, using localStorage');
        setUseSupabase(false);
        loadFromLocalStorage();
      }

      setIsLoading(false);
    };

    const loadFromLocalStorage = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const historyWithDates = parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }));
          setHistory(historyWithDates);
        }
      } catch (error) {
        console.error('Failed to load from localStorage:', error);
      }
    };

    loadHistory();
  }, []);

  // Save to localStorage (fallback)
  const saveToLocalStorage = useCallback((historyItems: ExecutionHistory[]) => {
    try {
      const toStore = historyItems.slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, []);

  // Add execution to history
  const addExecution = useCallback(
    async (execution: Omit<ExecutionHistory, 'id' | 'timestamp'>) => {
      const newExecution: ExecutionHistory = {
        ...execution,
        id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      };

      // Optimistic update
      const updated = [newExecution, ...history];
      setHistory(updated.slice(0, MAX_HISTORY_ITEMS));

      if (useSupabase) {
        try {
          const { data, error } = await supabase
            .from('execution_history')
            .insert({
              user_id: execution.user_id || 'anonymous',
              command: execution.command,
              steps: execution.steps,
              duration: execution.duration,
              status: execution.status,
              error: execution.error,
              layers_used: execution.layers_used || [],
              metadata: execution.metadata || {},
            })
            .select()
            .single();

          if (error) {
            console.warn('Failed to save to Supabase:', error.message);
            saveToLocalStorage(updated);
          } else if (data) {
            // Update with Supabase-generated ID
            newExecution.id = data.id;
            setHistory((prev) =>
              prev.map((h) => (h.id === newExecution.id ? { ...h, id: data.id } : h))
            );
          }
        } catch (err) {
          console.warn('Supabase save failed, saved to localStorage');
          saveToLocalStorage(updated);
        }
      } else {
        saveToLocalStorage(updated);
      }

      return newExecution.id;
    },
    [history, useSupabase, saveToLocalStorage]
  );

  // Get execution by ID
  const getExecution = useCallback(
    (id: string): ExecutionHistory | undefined => {
      return history.find((item) => item.id === id);
    },
    [history]
  );

  // Delete execution
  const deleteExecution = useCallback(
    async (id: string) => {
      const updated = history.filter((item) => item.id !== id);
      setHistory(updated);

      if (useSupabase) {
        try {
          await supabase.from('execution_history').delete().eq('id', id);
        } catch (err) {
          console.warn('Failed to delete from Supabase');
        }
      }

      saveToLocalStorage(updated);
    },
    [history, useSupabase, saveToLocalStorage]
  );

  // Clear all history
  const clearHistory = useCallback(async () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);

    if (useSupabase) {
      try {
        await supabase.from('execution_history').delete().neq('id', '');
      } catch (err) {
        console.warn('Failed to clear Supabase history');
      }
    }
  }, [useSupabase]);

  // Export history as JSON
  const exportHistory = useCallback(() => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `execution-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [history]);

  // Sync localStorage to Supabase (for migration)
  const syncToSupabase = useCallback(async () => {
    if (!useSupabase) return { synced: 0 };

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { synced: 0 };

    try {
      const localHistory = JSON.parse(stored);
      let synced = 0;

      for (const item of localHistory) {
        const { error } = await supabase.from('execution_history').upsert({
          user_id: item.user_id || 'anonymous',
          command: item.command,
          steps: item.steps,
          duration: item.duration,
          status: item.status,
          error: item.error,
          layers_used: item.layers_used || [],
          metadata: item.metadata || {},
          created_at: item.timestamp,
        });

        if (!error) synced++;
      }

      return { synced };
    } catch (err) {
      console.error('Sync failed:', err);
      return { synced: 0, error: err };
    }
  }, [useSupabase]);

  return {
    history,
    isLoading,
    useSupabase,
    addExecution,
    getExecution,
    deleteExecution,
    clearHistory,
    exportHistory,
    syncToSupabase,
  };
}
