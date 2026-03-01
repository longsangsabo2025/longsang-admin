/**
 * 📝 Content Queue Hook - Manage scheduled posts
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ContentItem {
  id: string;
  agent_id: string;
  content_type: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  status: 'pending' | 'scheduled' | 'published' | 'failed';
  priority: number;
  scheduled_for: string | null;
  published_at: string | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export function useContentQueue() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async (status?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('content_queue')
        .select('*')
        .order('priority', { ascending: false })
        .order('scheduled_for', { ascending: true });
      
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      setItems(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching content queue:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = async (item: Partial<ContentItem>) => {
    try {
      const { data, error } = await supabase
        .from('content_queue')
        .insert([{ ...item, status: 'pending' }])
        .select()
        .single();
      
      if (error) throw error;
      setItems(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      console.error('Error creating content:', err);
      throw err;
    }
  };

  const updateItem = async (id: string, updates: Partial<ContentItem>) => {
    try {
      const { data, error } = await supabase
        .from('content_queue')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      setItems(prev => prev.map(item => item.id === id ? data : item));
      return data;
    } catch (err: any) {
      console.error('Error updating content:', err);
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('content_queue')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      console.error('Error deleting content:', err);
      throw err;
    }
  };

  const scheduleItem = async (id: string, scheduledFor: Date) => {
    return updateItem(id, { 
      scheduled_for: scheduledFor.toISOString(),
      status: 'scheduled'
    });
  };

  const publishNow = async (id: string) => {
    return updateItem(id, { 
      status: 'published',
      published_at: new Date().toISOString()
    });
  };

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Stats
  const stats = {
    total: items.length,
    pending: items.filter(i => i.status === 'pending').length,
    scheduled: items.filter(i => i.status === 'scheduled').length,
    published: items.filter(i => i.status === 'published').length,
    failed: items.filter(i => i.status === 'failed').length,
  };

  return {
    items,
    loading,
    error,
    stats,
    refresh: fetchItems,
    createItem,
    updateItem,
    deleteItem,
    scheduleItem,
    publishNow,
  };
}

export default useContentQueue;
