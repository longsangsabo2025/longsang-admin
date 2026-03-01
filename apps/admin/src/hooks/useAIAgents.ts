/**
 * 🤖 AI Agents Hook - Load agents from Supabase
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface AIAgent {
  id: string;
  name: string;
  type: string;
  model: string;
  status: 'online' | 'offline' | 'busy';
  description: string;
  total_tasks: number;
  success_rate: number;
  avg_response_time: number;
  last_active: string;
  config: Record<string, any>;
  created_at: string;
}

export function useAIAgents() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .order('status')
        .order('name');

      if (error) throw error;
      setAgents(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching agents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return { agents, loading, error, refresh: fetchAgents };
}

export default useAIAgents;
