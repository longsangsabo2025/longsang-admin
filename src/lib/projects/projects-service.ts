/**
 * =================================================================
 * PROJECTS SERVICE - Database operations for projects
 * =================================================================
 */

import { supabase } from '@/integrations/supabase/client';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  color: string;
  website_url: string | null;
  is_active: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProjectSocialAccount {
  id: string;
  project_id: string;
  platform: string;
  account_id: string;
  account_name: string;
  account_username: string | null;
  account_avatar: string | null;
  account_type: string;
  is_primary: boolean;
  is_active: boolean;
  credentials_ref: string | null;
  credential_id: string | null;
  page_id: string | null;
  auto_post_enabled: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProjectPost {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  media_urls: string[] | null;
  hashtags: string[] | null;
  link_url: string | null;
  platforms: string[];
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  scheduled_at: string | null;
  published_at: string | null;
  results: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithAccounts extends Project {
  social_accounts: ProjectSocialAccount[];
}

class ProjectsService {
  private static instance: ProjectsService;

  private constructor() {}

  static getInstance(): ProjectsService {
    if (!ProjectsService.instance) {
      ProjectsService.instance = new ProjectsService();
    }
    return ProjectsService.instance;
  }

  /**
   * Get all projects for current user
   */
  async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get project by slug with social accounts
   */
  async getProjectBySlug(slug: string): Promise<ProjectWithAccounts | null> {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .single();

    if (projectError || !project) return null;

    const { data: accounts, error: accountsError } = await supabase
      .from('project_social_accounts')
      .select('*')
      .eq('project_id', project.id)
      .eq('is_active', true)
      .order('platform');

    if (accountsError) throw accountsError;

    return {
      ...project,
      social_accounts: accounts || [],
    };
  }

  /**
   * Get project by ID
   */
  async getProjectById(id: string): Promise<Project | null> {
    const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();

    if (error) return null;
    return data;
  }

  /**
   * Get social accounts for a project
   */
  async getProjectSocialAccounts(projectId: string): Promise<ProjectSocialAccount[]> {
    const { data, error } = await supabase
      .from('project_social_accounts')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('platform');

    if (error) throw error;
    return data || [];
  }

  /**
   * Add social account to project
   */
  async addSocialAccount(
    projectId: string,
    account: Omit<ProjectSocialAccount, 'id' | 'project_id' | 'created_at' | 'updated_at'>
  ): Promise<ProjectSocialAccount> {
    const { data, error } = await supabase
      .from('project_social_accounts')
      .insert({
        project_id: projectId,
        ...account,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Remove social account from project
   */
  async removeSocialAccount(accountId: string): Promise<void> {
    const { error } = await supabase
      .from('project_social_accounts')
      .update({ is_active: false })
      .eq('id', accountId);

    if (error) throw error;
  }

  /**
   * Get posts for a project
   */
  async getProjectPosts(projectId: string, limit = 50): Promise<ProjectPost[]> {
    const { data, error } = await supabase
      .from('project_posts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new post for a project
   */
  async createPost(post: {
    project_id: string;
    content: string;
    media_urls?: string[];
    hashtags?: string[];
    link_url?: string;
    platforms: string[];
    status?: 'draft' | 'scheduled' | 'publishing';
    scheduled_at?: string;
  }): Promise<ProjectPost> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('project_posts')
      .insert({
        ...post,
        user_id: user.id,
        status: post.status || 'draft',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update post status and results
   */
  async updatePostStatus(
    postId: string,
    status: ProjectPost['status'],
    results?: Record<string, unknown>
  ): Promise<void> {
    const updates: Partial<ProjectPost> = { status };

    if (status === 'published') {
      updates.published_at = new Date().toISOString();
    }

    if (results) {
      updates.results = results;
    }

    const { error } = await supabase.from('project_posts').update(updates).eq('id', postId);

    if (error) throw error;
  }

  /**
   * Create a new project
   */
  async createProject(project: {
    name: string;
    slug: string;
    description?: string;
    color?: string;
    website_url?: string;
  }): Promise<Project> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...project,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update project
   */
  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const getProjectsService = () => ProjectsService.getInstance();
