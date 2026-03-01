/**
 * Projects Service
 * API service for managing projects, credentials, agents, and workflows
 *
 * NOTE: This service uses generic types because the database tables are not yet
 * defined in the Supabase types. After running the migration, regenerate types
 * using: npx supabase gen types typescript --project-id <project-id> > src/integrations/supabase/types.ts
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================
// TYPES
// ============================================================

export interface Project {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  status: 'active' | 'development' | 'paused' | 'archived';
  local_url: string | null;
  production_url: string | null;
  github_url: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

export interface ProjectCredential {
  id: string;
  project_id: string;
  name: string;
  type:
    | 'api'
    | 'database'
    | 'cloud'
    | 'email'
    | 'payment'
    | 'deployment'
    | 'analytics'
    | 'cdn'
    | 'social'
    | 'other';
  key_value: string;
  key_preview: string | null;
  status: 'active' | 'inactive' | 'expired' | 'revoked';
  environment: 'development' | 'staging' | 'production';
  expires_at: string | null;
  last_used_at: string | null;
  last_rotated_at: string | null;
  created_at: string;
  updated_at: string;
  tags: string[];
}

export interface ProjectAgent {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  model: string;
  provider: 'openai' | 'anthropic' | 'google' | 'openrouter' | 'local' | 'other';
  status: 'active' | 'paused' | 'development' | 'deprecated';
  system_prompt: string | null;
  temperature: number;
  max_tokens: number;
  total_runs: number;
  total_tokens_used: number;
  total_cost_usd: number;
  last_run_at: string | null;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProjectWorkflow {
  id: string;
  project_id: string;
  n8n_workflow_id: string | null;
  name: string;
  description: string | null;
  status: 'active' | 'paused' | 'development' | 'error';
  trigger_type: 'webhook' | 'schedule' | 'manual' | 'event';
  webhook_url: string | null;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  last_execution_at: string | null;
  last_execution_status: string | null;
  average_execution_time_ms: number | null;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithStats extends Project {
  credentials_count: number;
  agents_count: number;
  workflows_count: number;
}

export interface ProjectFullData extends Project {
  credentials: ProjectCredential[];
  agents: ProjectAgent[];
  workflows: ProjectWorkflow[];
}

// ============================================================
// HELPER: Generic Supabase query wrapper
// ============================================================

const db = supabase as any;

// ============================================================
// HELPER: Get accessible project IDs for current user
// ============================================================

async function getAccessibleProjectIds(): Promise<string[] | null> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  // Admin sees all projects
  const role = user.user_metadata?.role;
  if (role === 'admin') {
    return null; // null means "all projects"
  }
  
  // Non-admin: get projects from project_access table
  const { data, error } = await db
    .from('project_access')
    .select('project_id')
    .eq('user_id', user.id);
  
  if (error) {
    console.error('Error getting project access:', error);
    return [];
  }
  
  return data?.map((row: { project_id: string }) => row.project_id) || [];
}

// ============================================================
// PROJECTS API
// ============================================================

export const projectsApi = {
  // Get all projects (filtered by user access)
  async getAll(): Promise<Project[]> {
    const accessibleIds = await getAccessibleProjectIds();
    
    let query = db.from('projects').select('*').order('name');
    
    // If not admin, filter by accessible project IDs
    if (accessibleIds !== null) {
      if (accessibleIds.length === 0) return [];
      query = query.in('id', accessibleIds);
    }
    
    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  // Get all projects with stats (filtered by user access)
  async getAllWithStats(): Promise<ProjectWithStats[]> {
    const accessibleIds = await getAccessibleProjectIds();
    
    // Build query
    let query = db.from('projects').select('*').order('name');
    
    // If not admin, filter by accessible project IDs  
    if (accessibleIds !== null) {
      if (accessibleIds.length === 0) return [];
      query = query.in('id', accessibleIds);
    }
    
    const { data: projects, error: projectsError } = await query;

    if (projectsError) throw projectsError;
    if (!projects || projects.length === 0) return [];

    // Then get counts for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project: Project) => {
        const [credentialsResult, agentsResult, workflowsResult] = await Promise.all([
          db
            .from('project_credentials')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', project.id),
          db
            .from('project_agents')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', project.id),
          db
            .from('project_workflows')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', project.id),
        ]);

        return {
          ...project,
          credentials_count: credentialsResult.count || 0,
          agents_count: agentsResult.count || 0,
          workflows_count: workflowsResult.count || 0,
        };
      })
    );

    return projectsWithStats;
  },

  // Get project by slug
  async getBySlug(slug: string): Promise<Project | null> {
    const { data, error } = await db.from('projects').select('*').eq('slug', slug).maybeSingle();

    if (error) {
      console.error('Error fetching project by slug:', error);
      throw error;
    }
    return data;
  },

  // Get project by ID
  async getById(id: string): Promise<Project | null> {
    const { data, error } = await db.from('projects').select('*').eq('id', id).maybeSingle();

    if (error) {
      console.error('Error fetching project by id:', error);
      throw error;
    }
    return data;
  },

  // Create project
  async create(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    const { data, error } = await db.from('projects').insert(project).select().single();

    if (error) throw error;
    return data;
  },

  // Update project
  async update(id: string, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await db
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete project
  async delete(id: string): Promise<void> {
    const { error } = await db.from('projects').delete().eq('id', id);

    if (error) throw error;
  },
};

// ============================================================
// CREDENTIALS API
// ============================================================

export const credentialsApi = {
  // Get all credentials for a project
  async getByProject(projectId: string): Promise<ProjectCredential[]> {
    const { data, error } = await db
      .from('project_credentials')
      .select('*')
      .eq('project_id', projectId)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Get credential by ID
  async getById(id: string): Promise<ProjectCredential | null> {
    const { data, error } = await db.from('project_credentials').select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  // Create credential
  async create(
    credential: Omit<ProjectCredential, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ProjectCredential> {
    // Generate key preview
    const keyPreview =
      credential.key_value.length > 10
        ? `${credential.key_value.slice(0, 8)}...${credential.key_value.slice(-4)}`
        : '•'.repeat(credential.key_value.length);

    const { data, error } = await db
      .from('project_credentials')
      .insert({ ...credential, key_preview: keyPreview })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update credential
  async update(id: string, updates: Partial<ProjectCredential>): Promise<ProjectCredential> {
    // If key_value is updated, regenerate preview
    if (updates.key_value) {
      updates.key_preview =
        updates.key_value.length > 10
          ? `${updates.key_value.slice(0, 8)}...${updates.key_value.slice(-4)}`
          : '•'.repeat(updates.key_value.length);
    }

    const { data, error } = await db
      .from('project_credentials')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete credential
  async delete(id: string): Promise<void> {
    const { error } = await db.from('project_credentials').delete().eq('id', id);

    if (error) throw error;
  },

  // Update last used
  async markUsed(id: string): Promise<void> {
    const { error } = await db
      .from('project_credentials')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },
};

// ============================================================
// AGENTS API
// ============================================================

export const agentsApi = {
  // Get all agents for a project
  async getByProject(projectId: string): Promise<ProjectAgent[]> {
    const { data, error } = await db
      .from('project_agents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get agent by ID
  async getById(id: string): Promise<ProjectAgent | null> {
    const { data, error } = await db.from('project_agents').select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  // Create agent
  async create(
    agent: Omit<
      ProjectAgent,
      'id' | 'created_at' | 'updated_at' | 'total_runs' | 'total_tokens_used' | 'total_cost_usd'
    >
  ): Promise<ProjectAgent> {
    const { data, error } = await db.from('project_agents').insert(agent).select().single();

    if (error) throw error;
    return data;
  },

  // Update agent
  async update(id: string, updates: Partial<ProjectAgent>): Promise<ProjectAgent> {
    const { data, error } = await db
      .from('project_agents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete agent
  async delete(id: string): Promise<void> {
    const { error } = await db.from('project_agents').delete().eq('id', id);

    if (error) throw error;
  },

  // Increment run count and update stats
  async recordRun(id: string, tokensUsed: number, costUsd: number): Promise<void> {
    const { data: agent, error: fetchError } = await db
      .from('project_agents')
      .select('total_runs, total_tokens_used, total_cost_usd')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await db
      .from('project_agents')
      .update({
        total_runs: (agent?.total_runs || 0) + 1,
        total_tokens_used: (agent?.total_tokens_used || 0) + tokensUsed,
        total_cost_usd: (agent?.total_cost_usd || 0) + costUsd,
        last_run_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  },
};

// ============================================================
// WORKFLOWS API
// ============================================================

export const workflowsApi = {
  // Get all workflows for a project
  async getByProject(projectId: string): Promise<ProjectWorkflow[]> {
    const { data, error } = await db
      .from('project_workflows')
      .select('*')
      .eq('project_id', projectId)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Get workflow by ID
  async getById(id: string): Promise<ProjectWorkflow | null> {
    const { data, error } = await db.from('project_workflows').select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  // Create workflow
  async create(
    workflow: Omit<
      ProjectWorkflow,
      | 'id'
      | 'created_at'
      | 'updated_at'
      | 'total_executions'
      | 'successful_executions'
      | 'failed_executions'
    >
  ): Promise<ProjectWorkflow> {
    const { data, error } = await db.from('project_workflows').insert(workflow).select().single();

    if (error) throw error;
    return data;
  },

  // Update workflow
  async update(id: string, updates: Partial<ProjectWorkflow>): Promise<ProjectWorkflow> {
    const { data, error } = await db
      .from('project_workflows')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete workflow
  async delete(id: string): Promise<void> {
    const { error } = await db.from('project_workflows').delete().eq('id', id);

    if (error) throw error;
  },

  // Record execution
  async recordExecution(id: string, success: boolean, executionTimeMs: number): Promise<void> {
    const { data: workflow, error: fetchError } = await db
      .from('project_workflows')
      .select(
        'total_executions, successful_executions, failed_executions, average_execution_time_ms'
      )
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const totalExecutions = (workflow?.total_executions || 0) + 1;
    const successfulExecutions = success
      ? (workflow?.successful_executions || 0) + 1
      : workflow?.successful_executions || 0;
    const failedExecutions = success
      ? workflow?.failed_executions || 0
      : (workflow?.failed_executions || 0) + 1;

    // Calculate new average
    const currentAvg = workflow?.average_execution_time_ms || 0;
    const prevTotal = workflow?.total_executions || 0;
    const newAvg =
      prevTotal === 0
        ? executionTimeMs
        : Math.round((currentAvg * prevTotal + executionTimeMs) / totalExecutions);

    const { error } = await db
      .from('project_workflows')
      .update({
        total_executions: totalExecutions,
        successful_executions: successfulExecutions,
        failed_executions: failedExecutions,
        average_execution_time_ms: newAvg,
        last_execution_at: new Date().toISOString(),
        last_execution_status: success ? 'success' : 'failed',
      })
      .eq('id', id);

    if (error) throw error;
  },
};

// ============================================================
// COMBINED PROJECT DATA
// ============================================================

export const projectsFullApi = {
  // Get project with all related data
  async getFullBySlug(slug: string): Promise<ProjectFullData | null> {
    const project = await projectsApi.getBySlug(slug);
    if (!project) return null;

    const [credentials, agents, workflows] = await Promise.all([
      credentialsApi.getByProject(project.id),
      agentsApi.getByProject(project.id),
      workflowsApi.getByProject(project.id),
    ]);

    return {
      ...project,
      credentials,
      agents,
      workflows,
    };
  },

  // Get project with all related data by ID
  async getFullById(id: string): Promise<ProjectFullData | null> {
    const project = await projectsApi.getById(id);
    if (!project) return null;

    const [credentials, agents, workflows] = await Promise.all([
      credentialsApi.getByProject(project.id),
      agentsApi.getByProject(project.id),
      workflowsApi.getByProject(project.id),
    ]);

    return {
      ...project,
      credentials,
      agents,
      workflows,
    };
  },
};

// Default export
const projectsService = {
  projects: projectsApi,
  credentials: credentialsApi,
  agents: agentsApi,
  workflows: workflowsApi,
  full: projectsFullApi,
};

export default projectsService;
