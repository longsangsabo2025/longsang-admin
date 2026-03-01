// ================================================
// DEV MODE - Mock Data for Offline Development
// ================================================

import type {
  AIAgent,
  AutomationTrigger,
  Workflow,
  ActivityLog,
  ContentQueue,
  DashboardStats,
  AgentPerformance,
} from '@/types/automation';

const isDev = import.meta.env.DEV;

// Mock AI Agents
const mockAgents: AIAgent[] = [
  {
    id: 'agent-1',
    name: 'Content Writer Agent',
    type: 'content_writer',
    status: 'active',
    description: 'Monitors new contact form submissions and automatically generates blog posts.',
    config: {
      ai_model: 'claude-sonnet-4',
      auto_publish: false,
      require_approval: true,
      tone: 'professional',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'agent-2',
    name: 'Lead Nurture Agent',
    type: 'lead_nurture',
    status: 'paused',
    description: 'Tracks new form submissions and sends personalized follow-up emails.',
    config: {
      ai_model: 'gpt-4',
      follow_up_delay_hours: 24,
      max_follow_ups: 3,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'agent-3',
    name: 'Social Media Agent',
    type: 'social_media',
    status: 'paused',
    description: 'Automatically generates and schedules social media posts.',
    config: {
      ai_model: 'gpt-4',
      platforms: ['linkedin', 'twitter', 'facebook'],
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock Activity Logs
const mockActivityLogs: ActivityLog[] = [
  {
    id: 'log-1',
    agent_id: 'agent-1',
    action: 'content_generated',
    details: { title: 'New Blog Post Generated', words: 1500 },
    status: 'completed',
    created_at: new Date().toISOString(),
  },
  {
    id: 'log-2',
    agent_id: 'agent-2',
    action: 'email_sent',
    details: { to: 'lead@example.com', subject: 'Follow-up Email' },
    status: 'completed',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

// Mock Content Queue
const mockContentQueue: ContentQueue[] = [
  {
    id: 'queue-1',
    agent_id: 'agent-1',
    content_type: 'blog_post',
    title: 'Getting Started with AI Automation',
    content: 'This is a sample blog post content...',
    status: 'pending',
    scheduled_for: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString(),
  },
];

// Mock Dashboard Stats
const mockStats: DashboardStats = {
  total_agents: 3,
  active_agents: 1,
  paused_agents: 2,
  total_executions_today: 15,
  total_content_generated: 8,
  success_rate: 94.5,
};

// Check if we should use mock data
export const shouldUseMockData = () => {
  if (!isDev) return false;

  // Check if there's a network error flag
  const hasNetworkError = localStorage.getItem('supabase-network-error') === 'true';
  const useMockData = localStorage.getItem('use-mock-data') === 'true';

  return hasNetworkError || useMockData;
};

// Enable mock data mode
export const enableMockData = () => {
  localStorage.setItem('use-mock-data', 'true');
  console.log('✅ Mock data mode enabled');
};

// Disable mock data mode
export const disableMockData = () => {
  localStorage.removeItem('use-mock-data');
  localStorage.removeItem('supabase-network-error');
  console.log('✅ Mock data mode disabled');
};

// Mock API functions
export const mockApi = {
  // Agents
  getAgents: async (): Promise<AIAgent[]> => {
    await delay(300);
    return [...mockAgents];
  },

  getAgent: async (id: string): Promise<AIAgent> => {
    await delay(300);
    const agent = mockAgents.find((a) => a.id === id);
    if (!agent) throw new Error('Agent not found');
    return agent;
  },

  createAgent: async (agent: Partial<AIAgent>): Promise<AIAgent> => {
    await delay(500);
    const newAgent: AIAgent = {
      id: `agent-${Date.now()}`,
      name: agent.name || 'New Agent',
      type: agent.type || 'content_writer',
      status: agent.status || 'active',
      description: agent.description || '',
      config: agent.config || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockAgents.push(newAgent);
    return newAgent;
  },

  updateAgent: async (id: string, updates: Partial<AIAgent>): Promise<AIAgent> => {
    await delay(300);
    const index = mockAgents.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Agent not found');

    mockAgents[index] = {
      ...mockAgents[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return mockAgents[index];
  },

  deleteAgent: async (id: string): Promise<void> => {
    await delay(300);
    const index = mockAgents.findIndex((a) => a.id === id);
    if (index !== -1) {
      mockAgents.splice(index, 1);
    }
  },

  // Activity Logs
  getActivityLogs: async (limit: number = 20): Promise<ActivityLog[]> => {
    await delay(200);
    return mockActivityLogs.slice(0, limit);
  },

  // Content Queue
  getContentQueue: async (limit: number = 10): Promise<ContentQueue[]> => {
    await delay(200);
    return mockContentQueue.slice(0, limit);
  },

  // Dashboard Stats
  getDashboardStats: async (): Promise<DashboardStats> => {
    await delay(200);
    return mockStats;
  },

  // Triggers
  getTriggers: async (): Promise<AutomationTrigger[]> => {
    await delay(200);
    return [];
  },

  // Workflows
  getWorkflows: async (): Promise<Workflow[]> => {
    await delay(200);
    return [];
  },

  // Agent Performance
  getAgentPerformance: async (agentId: string): Promise<AgentPerformance> => {
    await delay(200);
    return {
      agent_id: agentId,
      total_executions: 50,
      successful_executions: 47,
      failed_executions: 3,
      average_execution_time: 2.5,
      last_execution: new Date().toISOString(),
    };
  },
};

// Helper function to simulate network delay
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Export mock data for testing
export const mockData = {
  agents: mockAgents,
  activityLogs: mockActivityLogs,
  contentQueue: mockContentQueue,
  stats: mockStats,
};
