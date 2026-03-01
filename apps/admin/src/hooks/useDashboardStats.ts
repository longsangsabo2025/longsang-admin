/**
 * 📊 Dashboard Stats Hook - Real-time data from Supabase
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface DashboardStats {
  workflowsTotal: number;
  workflowsActive: number;
  agentsTotal: number;
  agentsOnline: number;
  executionsToday: number;
  executionsTotal: number;
  successRate: number;
}

const defaultStats: DashboardStats = {
  workflowsTotal: 0,
  workflowsActive: 0,
  agentsTotal: 0,
  agentsOnline: 0,
  executionsToday: 0,
  executionsTotal: 0,
  successRate: 0,
};

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch counts in parallel - using correct table names
      const [
        workflowsRes,
        workflowsActiveRes,
        agentsRes,
        agentsOnlineRes,
        executionsTodayRes,
        executionsTotalRes,
      ] = await Promise.all([
        // Use 'workflows' table (has 3 records) instead of 'n8n_workflows' (empty)
        supabase.from('workflows').select('*', { count: 'exact', head: true }),
        supabase.from('workflows').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('ai_agents').select('*', { count: 'exact', head: true }),
        supabase.from('ai_agents').select('*', { count: 'exact', head: true }).eq('status', 'online'),
        supabase.from('workflow_executions').select('*', { count: 'exact', head: true })
          .gte('created_at', new Date().toISOString().split('T')[0]),
        supabase.from('workflow_executions').select('*', { count: 'exact', head: true }),
      ]);

      // Calculate success rate from recent executions
      const { data: recentExecs } = await supabase
        .from('workflow_executions')
        .select('status')
        .order('created_at', { ascending: false })
        .limit(100);

      const successCount = recentExecs?.filter(e => e.status === 'success').length || 0;
      const successRate = recentExecs?.length ? (successCount / recentExecs.length) * 100 : 0;

      setStats({
        workflowsTotal: workflowsRes.count || 0,
        workflowsActive: workflowsActiveRes.count || 0,
        agentsTotal: agentsRes.count || 0,
        agentsOnline: agentsOnlineRes.count || 0,
        executionsToday: executionsTodayRes.count || 0,
        executionsTotal: executionsTotalRes.count || 0,
        successRate: Math.round(successRate * 10) / 10,
      });
      setError(null);
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error, refresh: fetchStats };
}

export default useDashboardStats;
