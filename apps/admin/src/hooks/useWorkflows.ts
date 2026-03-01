/**
 * 🔄 Workflows Hook - N8N Workflows from Supabase
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'error';
  trigger_type: string;
  last_execution: string;
  total_runs: number;
  success_rate: number;
  n8n_workflow_id: string;
  created_at: string;
}

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('n8n_workflows')
        .select('*')
        .order('last_execution', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching workflows:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  return { workflows, loading, error, refresh: fetchWorkflows };
}

export default useWorkflows;
