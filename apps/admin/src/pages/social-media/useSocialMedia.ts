/**
 * Custom hook for Social Media connections data loading
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { type Project, type ProjectSocialAccount } from '@/lib/projects';
import type { StoredCredential, ProjectWithSocial } from './types';

export function useSocialMedia() {
  const { toast } = useToast();
  const [showTokens, setShowTokens] = useState(false);
  const [dbCredentials, setDbCredentials] = useState<StoredCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectWithSocial[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const loadProjects = useCallback(async () => {
    try {
      setProjectsLoading(true);

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects' as unknown as 'profiles')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (projectsError) throw projectsError;

      const { data: accountsData, error: accountsError } = await supabase
        .from('project_social_accounts' as unknown as 'profiles')
        .select('*')
        .eq('is_active', true);

      if (accountsError) throw accountsError;

      const projectsList = (projectsData || []) as unknown as Project[];
      const accountsList = (accountsData || []) as unknown as ProjectSocialAccount[];

      const projectsWithSocial: ProjectWithSocial[] = projectsList.map((project) => ({
        ...project,
        social_accounts: accountsList.filter((a) => a.project_id === project.id),
      }));

      setProjects(projectsWithSocial);
      setExpandedProjects(new Set(projectsWithSocial.map((p) => p.id)));
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const loadCredentials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('social_media_credentials')
        .select('*')
        .eq('is_active', true)
        .order('platform');

      if (error) throw error;

      setDbCredentials(data || []);
      setLastSync(new Date().toLocaleString('vi-VN'));
    } catch (err) {
      console.error('Failed to load credentials:', err);
      toast({
        title: 'Error',
        description: 'Failed to load credentials from database',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isPlatformInDb = (platformId: string) => {
    return dbCredentials.some((c) => c.platform === platformId);
  };

  const getDbCredential = (platformId: string) => {
    return dbCredentials.find((c) => c.platform === platformId);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  useEffect(() => {
    loadCredentials();
    loadProjects();
  }, []);

  return {
    showTokens,
    setShowTokens,
    dbCredentials,
    loading,
    lastSync,
    projects,
    projectsLoading,
    expandedProjects,
    loadProjects,
    loadCredentials,
    toggleProject,
    isPlatformInDb,
    getDbCredential,
    copyToClipboard,
  };
}
