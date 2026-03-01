/**
 * 🚀 Projects Hook - Load from Supabase
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: 'active' | 'inactive' | 'development';
  icon: string;
  color: string;
  local_url: string;
  production_url: string;
  github_url: string;
  created_at: string;
  updated_at: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('priority', { ascending: false })
        .order('name');

      if (error) throw error;
      setProjects(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return { projects, loading, error, refresh: fetchProjects };
}

export default useProjects;
