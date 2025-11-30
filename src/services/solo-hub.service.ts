/**
 * Solo Founder Hub - API Service
 * Supabase operations for all Solo Hub tables
 */

import { supabase } from '@/lib/supabase';
import type {
  MorningBriefing,
  AIAgent,
  AgentTask,
  CreateTaskInput,
  Decision,
  DecisionStatus,
  AgentMemory,
  CreateMemoryInput,
  AgentCommunication,
  AgentResponse,
  PendingDecisionsSummary,
  AgentPerformanceSummary,
  ApiResponse,
  PaginatedResponse,
} from '@/types/solo-hub.types';

// =====================================================
// MORNING BRIEFINGS
// =====================================================

export const briefingService = {
  /**
   * Get today's briefing for current user
   */
  async getToday(): Promise<ApiResponse<MorningBriefing>> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('morning_briefings')
      .select('*')
      .eq('date', today)
      .single();

    return {
      data,
      error: error?.message || null,
      success: !error,
    };
  },

  /**
   * Get briefings for date range
   */
  async getRange(startDate: string, endDate: string): Promise<ApiResponse<MorningBriefing[]>> {
    const { data, error } = await supabase
      .from('morning_briefings')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    return {
      data: data || [],
      error: error?.message || null,
      success: !error,
    };
  },

  /**
   * Mark briefing as read
   */
  async markAsRead(id: string): Promise<ApiResponse<MorningBriefing>> {
    const { data, error } = await supabase
      .from('morning_briefings')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    return {
      data,
      error: error?.message || null,
      success: !error,
    };
  },

  /**
   * Trigger briefing generation via n8n webhook
   */
  async triggerGeneration(): Promise<ApiResponse<{ triggered: boolean }>> {
    try {
      const n8nWebhookUrl = import.meta.env.VITE_N8N_BRIEFING_WEBHOOK;
      if (!n8nWebhookUrl) {
        return { data: null, error: 'N8N webhook URL not configured', success: false };
      }

      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'manual', timestamp: new Date().toISOString() }),
      });

      return {
        data: { triggered: response.ok },
        error: response.ok ? null : 'Failed to trigger generation',
        success: response.ok,
      };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false,
      };
    }
  },
};

// =====================================================
// AI AGENTS
// =====================================================

export const agentService = {
  /**
   * Get all agents for current user
   */
  async getAll(): Promise<ApiResponse<AIAgent[]>> {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('is_active', true)
      .order('role');

    return {
      data: data || [],
      error: error?.message || null,
      success: !error,
    };
  },

  /**
   * Get agent by ID
   */
  async getById(id: string): Promise<ApiResponse<AIAgent>> {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', id)
      .single();

    return {
      data,
      error: error?.message || null,
      success: !error,
    };
  },

  /**
   * Update agent status
   */
  async updateStatus(id: string, status: AIAgent['status']): Promise<ApiResponse<AIAgent>> {
    const { data, error } = await supabase
      .from('ai_agents')
      .update({ 
        status, 
        last_active_at: status === 'online' ? new Date().toISOString() : undefined 
      })
      .eq('id', id)
      .select()
      .single();

    return {
      data,
      error: error?.message || null,
      success: !error,
    };
  },

  /**
   * Update agent configuration
   */
  async updateConfig(id: string, config: Partial<AIAgent>): Promise<ApiResponse<AIAgent>> {
    const { data, error } = await supabase
      .from('ai_agents')
      .update(config)
      .eq('id', id)
      .select()
      .single();

    return {
      data,
      error: error?.message || null,
      success: !error,
    };
  },

  /**
   * Get agent performance summary
   */
  async getPerformance(): Promise<ApiResponse<AgentPerformanceSummary[]>> {
    const { data, error } = await supabase
      .from('v_agent_performance')
      .select('*');

    return {
      data: data || [],
      error: error?.message || null,
      success: !error,
    };
  },

  /**
   * Create default agents for new user
   */
  async createDefaults(): Promise<ApiResponse<AIAgent[]>> {
    const defaultAgents = [
      {
        name: 'Dev Agent',
        role: 'dev',
        description: 'Handles code, architecture, and technical tasks',
        model: 'gpt-4o',
        temperature: 0.3,
        capabilities: ['code_review', 'debugging', 'architecture', 'deployment'],
        status: 'online',
      },
      {
        name: 'Content Agent',
        role: 'content',
        description: 'Creates blog posts, social content, and copy',
        model: 'gpt-4o',
        temperature: 0.7,
        capabilities: ['blog_writing', 'social_posts', 'copywriting', 'editing'],
        status: 'online',
      },
      {
        name: 'Marketing Agent',
        role: 'marketing',
        description: 'Plans campaigns, analyzes data, optimizes ads',
        model: 'gpt-4o-mini',
        temperature: 0.5,
        capabilities: ['campaign_planning', 'analytics', 'seo', 'ads'],
        status: 'online',
      },
      {
        name: 'Sales Agent',
        role: 'sales',
        description: 'Handles outreach, follow-ups, and lead qualification',
        model: 'gpt-4o-mini',
        temperature: 0.6,
        capabilities: ['outreach', 'lead_scoring', 'follow_up', 'proposals'],
        status: 'offline',
      },
      {
        name: 'Admin Agent',
        role: 'admin',
        description: 'Manages scheduling, emails, and routine tasks',
        model: 'gpt-4o-mini',
        temperature: 0.3,
        capabilities: ['scheduling', 'email_management', 'data_entry', 'reporting'],
        status: 'offline',
      },
      {
        name: 'Advisor Agent',
        role: 'advisor',
        description: 'Provides strategic advice and decision support',
        model: 'gpt-4o',
        temperature: 0.5,
        capabilities: ['strategy', 'analysis', 'recommendations', 'planning'],
        status: 'online',
      },
    ];

    const { data, error } = await supabase
      .from('ai_agents')
      .insert(defaultAgents)
      .select();

    return {
      data: data || [],
      error: error?.message || null,
      success: !error,
    };
  },
};

// =====================================================
// AGENT TASKS
// =====================================================

export const taskService = {
  /**
   * Get all tasks with optional filters
   */
  async getAll(filters?: {
    status?: AgentTask['status'];
    agent_id?: string;
    task_type?: AgentTask['task_type'];
    limit?: number;
  }): Promise<PaginatedResponse<AgentTask>> {
    let query = supabase
      .from('agent_tasks')
      .select('*', { count: 'exact' });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.agent_id) query = query.eq('agent_id', filters.agent_id);
    if (filters?.task_type) query = query.eq('task_type', filters.task_type);
    
    query = query
      .order('created_at', { ascending: false })
      .limit(filters?.limit || 50);

    const { data, error, count } = await query;

    return {
      data: data || [],
      total: count || 0,
      page: 1,
      per_page: filters?.limit || 50,
      has_more: (count || 0) > (filters?.limit || 50),
    };
  },

  /**
   * Create a new task
   */
  async create(input: CreateTaskInput): Promise<ApiResponse<AgentTask>> {
    const { data, error } = await supabase
      .from('agent_tasks')
      .insert({
        ...input,
        status: 'pending',
        progress: 0,
      })
      .select()
      .single();

    // Trigger n8n workflow if configured
    if (data && !error) {
      const n8nWebhookUrl = import.meta.env.VITE_N8N_TASK_WEBHOOK;
      if (n8nWebhookUrl) {
        fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: data.id,
            taskType: data.task_type,
            task: data.title,
            context: data.description,
            ...data.input_data,
          }),
        }).catch(console.error);
      }
    }

    return {
      data,
      error: error?.message || null,
      success: !error,
    };
  },

  /**
   * Update task status
   */
  async updateStatus(
    id: string, 
    status: AgentTask['status'],
    output_data?: Record<string, unknown>
  ): Promise<ApiResponse<AgentTask>> {
    const updates: Partial<AgentTask> = { status };
    
    if (status === 'in_progress') {
      updates.started_at = new Date().toISOString();
    } else if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString();
      updates.progress = status === 'completed' ? 100 : updates.progress;
    }
    
    if (output_data) {
      updates.output_data = output_data;
    }

    const { data, error } = await supabase
      .from('agent_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return {
      data,
      error: error?.message || null,
      success: !error,
    };
  },

  /**
   * Get tasks for specific agent
   */
  async getByAgent(agentId: string): Promise<ApiResponse<AgentTask[]>> {
    const { data, error } = await supabase
      .from('agent_tasks')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(20);

    return {
      data: data || [],
      error: error?.message || null,
      success: !error,
    };
  },
};

// =====================================================
// DECISION QUEUE
// =====================================================

export const decisionService = {
  /**
   * Get all pending decisions
   */
  async getPending(): Promise<ApiResponse<Decision[]>> {
    const { data, error } = await supabase
      .from('decision_queue')
      .select('*')
      .eq('status', 'pending')
      .order('urgency', { ascending: true }) // immediate first
      .order('created_at', { ascending: false });

    return {
      data: data || [],
      error: error?.message || null,
      success: !error,
    };
  },

  /**
   * Get pending decisions summary
   */
  async getSummary(): Promise<ApiResponse<PendingDecisionsSummary>> {
    const { data, error } = await supabase
      .from('v_pending_decisions')
      .select('*')
      .single();

    return {
      data,
      error: error?.message || null,
      success: !error,
    };
  },

  /**
   * Approve a decision
   */
  async approve(id: string, feedback?: string): Promise<ApiResponse<Decision>> {
    return this.updateStatus(id, 'approved', feedback);
  },

  /**
   * Reject a decision
   */
  async reject(id: string, feedback?: string): Promise<ApiResponse<Decision>> {
    return this.updateStatus(id, 'rejected', feedback);
  },

  /**
   * Defer a decision (change urgency to this_week)
   */
  async defer(id: string): Promise<ApiResponse<Decision>> {
    const { data, error } = await supabase
      .from('decision_queue')
      .update({ urgency: 'this_week' })
      .eq('id', id)
      .select()
      .single();

    return {
      data,
      error: error?.message || null,
      success: !error,
    };
  },

  /**
   * Update decision status
   */
  async updateStatus(
    id: string, 
    status: DecisionStatus, 
    feedback?: string
  ): Promise<ApiResponse<Decision>> {
    const { data, error } = await supabase
      .from('decision_queue')
      .update({
        status,
        user_feedback: feedback,
        decided_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    // Trigger action based on decision
    if (data && !error && status === 'approved') {
      // Could trigger n8n workflow to execute the approved action
      const n8nWebhookUrl = import.meta.env.VITE_N8N_DECISION_WEBHOOK;
      if (n8nWebhookUrl) {
        fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decisionId: data.id,
            action: 'approved',
            details: data.details,
          }),
        }).catch(console.error);
      }
    }

    return {
      data,
      error: error?.message || null,
      success: !error,
    };
  },

  /**
   * Create a new decision (usually from agents)
   */
  async create(decision: Partial<Decision>): Promise<ApiResponse<Decision>> {
    const { data, error } = await supabase
      .from('decision_queue')
      .insert({
        ...decision,
        status: 'pending',
      })
      .select()
      .single();

    return {
      data,
      error: error?.message || null,
      success: !error,
    };
  },
};

// =====================================================
// AGENT MEMORY
// =====================================================

export const memoryService = {
  /**
   * Get all memories with optional filters
   */
  async getAll(filters?: {
    memory_type?: AgentMemory['memory_type'];
    category?: string;
    importance?: AgentMemory['importance'];
    search?: string;
  }): Promise<ApiResponse<AgentMemory[]>> {
    let query = supabase
      .from('agent_memory')
      .select('*')
      .eq('is_active', true);

    if (filters?.memory_type) query = query.eq('memory_type', filters.memory_type);
    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.importance) query = query.eq('importance', filters.importance);
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }

    query = query.order('importance', { ascending: true }).order('used_count', { ascending: false });

    const { data, error } = await query;

    return {
      data: data || [],
      error: error?.message || null,
      success: !error,
    };
  },

  /**
   * Create a new memory
   */
  async create(input: CreateMemoryInput): Promise<ApiResponse<AgentMemory>> {
    const { data, error } = await supabase
      .from('agent_memory')
      .insert(input)
      .select()
      .single();

    return {
      data,
      error: error?.message || null,
      success: !error,
    };
  },

  /**
   * Update a memory
   */
  async update(id: string, updates: Partial<AgentMemory>): Promise<ApiResponse<AgentMemory>> {
    const { data, error } = await supabase
      .from('agent_memory')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return {
      data,
      error: error?.message || null,
      success: !error,
    };
  },

  /**
   * Delete (soft) a memory
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    const { error } = await supabase
      .from('agent_memory')
      .update({ is_active: false })
      .eq('id', id);

    return {
      data: null,
      error: error?.message || null,
      success: !error,
    };
  },

  /**
   * Increment usage count (called when memory is used by agent)
   */
  async incrementUsage(id: string): Promise<void> {
    await supabase.rpc('increment_memory_usage', { memory_id: id });
  },

  /**
   * Search memories using semantic search (if pgvector is enabled)
   */
  async semanticSearch(query: string, limit = 10): Promise<ApiResponse<AgentMemory[]>> {
    // This would use embeddings - simplified version uses text search
    const { data, error } = await supabase
      .from('agent_memory')
      .select('*')
      .eq('is_active', true)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%,tags.cs.{${query}}`)
      .limit(limit);

    return {
      data: data || [],
      error: error?.message || null,
      success: !error,
    };
  },

  /**
   * Get all categories
   */
  async getCategories(): Promise<ApiResponse<string[]>> {
    const { data, error } = await supabase
      .from('agent_memory')
      .select('category')
      .eq('is_active', true);

    const categories = [...new Set(data?.map(d => d.category) || [])];

    return {
      data: categories,
      error: error?.message || null,
      success: !error,
    };
  },
};

// =====================================================
// AGENT COMMUNICATIONS
// =====================================================

export const communicationService = {
  /**
   * Get recent communications
   */
  async getRecent(limit = 50): Promise<ApiResponse<AgentCommunication[]>> {
    const { data, error } = await supabase
      .from('agent_communications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    return {
      data: data || [],
      error: error?.message || null,
      success: !error,
    };
  },

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<ApiResponse<number>> {
    const { count, error } = await supabase
      .from('agent_communications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    return {
      data: count || 0,
      error: error?.message || null,
      success: !error,
    };
  },

  /**
   * Mark as read
   */
  async markAsRead(id: string): Promise<ApiResponse<void>> {
    const { error } = await supabase
      .from('agent_communications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);

    return {
      data: null,
      error: error?.message || null,
      success: !error,
    };
  },

  /**
   * Mark all as read
   */
  async markAllAsRead(): Promise<ApiResponse<void>> {
    const { error } = await supabase
      .from('agent_communications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('is_read', false);

    return {
      data: null,
      error: error?.message || null,
      success: !error,
    };
  },
};

// =====================================================
// EXPORT ALL SERVICES
// =====================================================

export const soloHubApi = {
  briefings: briefingService,
  agents: agentService,
  tasks: taskService,
  decisions: decisionService,
  memory: memoryService,
  communications: communicationService,
};

export default soloHubApi;
