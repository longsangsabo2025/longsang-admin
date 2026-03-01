/**
 * 🚀 useActivityLog Hook
 * Tracks user actions with Supabase persistence
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ActivityLogEntry, ActivityAction, ACTIVITY_ICONS } from './types';

export function useActivityLog() {
  // Load from localStorage initially
  const [entries, setEntries] = useState<ActivityLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('library-activity-log');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);

  // Keep only last 50 entries in localStorage
  useEffect(() => {
    localStorage.setItem('library-activity-log', JSON.stringify(entries.slice(0, 50)));
  }, [entries]);

  // Load from Supabase on mount
  useEffect(() => {
    loadFromSupabase();
  }, []);

  // Load activity log from Supabase
  const loadFromSupabase = useCallback(async () => {
    try {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.user?.id) return;

      const { data, error } = await supabase
        .from('library_activity_log')
        .select('*')
        .eq('user_id', session.session.user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading activity log:', error);
        return;
      }

      if (data && data.length > 0) {
        const logEntries: ActivityLogEntry[] = data.map(row => ({
          id: row.id,
          action: row.action as ActivityAction,
          description: row.description,
          count: row.item_count,
          timestamp: row.created_at,
          icon: ACTIVITY_ICONS[row.action as ActivityAction] || '📝',
        }));
        setEntries(logEntries);
      }
    } catch (error) {
      console.error('Failed to load activity log:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add log entry
  const logAction = useCallback(async (action: ActivityAction, description: string, count?: number) => {
    const entry: ActivityLogEntry = {
      id: Date.now().toString(),
      action,
      description,
      count,
      timestamp: new Date().toISOString(),
      icon: ACTIVITY_ICONS[action] || '📝',
    };

    // Update local state
    setEntries(prev => [entry, ...prev]);

    // Save to Supabase
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) return;

      await supabase.from('library_activity_log').insert({
        user_id: session.session.user.id,
        action,
        description,
        item_count: count || 1,
        metadata: {},
      });
    } catch (error) {
      console.error('Failed to save activity log:', error);
    }
  }, []);

  // Clear all entries
  const clearAll = useCallback(async () => {
    setEntries([]);
    localStorage.removeItem('library-activity-log');

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) return;

      await supabase
        .from('library_activity_log')
        .delete()
        .eq('user_id', session.session.user.id);
    } catch (error) {
      console.error('Failed to clear activity log:', error);
    }
  }, []);

  return {
    entries,
    loading,
    logAction,
    clearAll,
    refresh: loadFromSupabase,
  };
}
