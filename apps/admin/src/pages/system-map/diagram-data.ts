/**
 * All diagram node/edge data for SystemMap views
 */

import { Node, Edge, MarkerType } from 'reactflow';

// ============================================================
// FULL SYSTEM ARCHITECTURE
// ============================================================

export const initialNodes: Node[] = [
  // FRONTEND LAYER
  {
    id: 'admin-panel',
    type: 'frontend',
    position: { x: 400, y: 0 },
    data: { label: 'Admin Panel', sublabel: '80+ Pages' },
  },
  {
    id: 'ai-workspace',
    type: 'frontend',
    position: { x: 200, y: 100 },
    data: { label: 'AI Workspace', sublabel: '6 Agents' },
  },
  {
    id: 'brain-system',
    type: 'frontend',
    position: { x: 400, y: 100 },
    data: { label: 'Brain System', sublabel: 'Knowledge Base' },
  },
  {
    id: 'public-pages',
    type: 'frontend',
    position: { x: 600, y: 100 },
    data: { label: 'Public Pages', sublabel: 'Landing, Auth' },
  },

  // BACKEND LAYER
  {
    id: 'api-server',
    type: 'backend',
    position: { x: 250, y: 250 },
    data: { label: 'API Server', sublabel: 'Express :3001' },
  },
  {
    id: 'mcp-server',
    type: 'backend',
    position: { x: 550, y: 250 },
    data: { label: 'MCP Server', sublabel: 'Python :3002' },
  },

  // AI LAYER
  {
    id: 'gemini-api',
    type: 'ai',
    position: { x: 100, y: 400 },
    data: { label: 'Gemini 2.5', sublabel: 'Flash + Pro' },
  },
  {
    id: 'vertex-ai',
    type: 'ai',
    position: { x: 300, y: 400 },
    data: { label: 'Vertex AI', sublabel: 'Imagen 3.0' },
  },
  {
    id: 'openai',
    type: 'ai',
    position: { x: 500, y: 400 },
    data: { label: 'OpenAI', sublabel: 'Embeddings' },
  },

  // DATABASE LAYER
  {
    id: 'supabase',
    type: 'database',
    position: { x: 700, y: 350 },
    data: { label: 'Supabase', sublabel: 'PostgreSQL' },
  },

  // AUTOMATION
  {
    id: 'n8n',
    type: 'automation',
    position: { x: 700, y: 500 },
    data: { label: 'n8n', sublabel: 'Workflows :5678' },
  },

  // EXTERNAL APIS
  {
    id: 'google-apis',
    type: 'external',
    position: { x: 50, y: 550 },
    data: { label: 'Google APIs', sublabel: 'Drive, Calendar, SEO' },
  },
  {
    id: 'youtube-api',
    type: 'external',
    position: { x: 250, y: 550 },
    data: { label: 'YouTube API', sublabel: 'Upload, Analytics' },
  },
  {
    id: 'meta-api',
    type: 'external',
    position: { x: 450, y: 550 },
    data: { label: 'Meta API', sublabel: 'FB, IG, Threads' },
  },
];

export const initialEdges: Edge[] = [
  // Admin Panel connections
  {
    id: 'e1',
    source: 'admin-panel',
    target: 'ai-workspace',
    animated: true,
    style: { stroke: '#3b82f6' },
  },
  {
    id: 'e2',
    source: 'admin-panel',
    target: 'brain-system',
    animated: true,
    style: { stroke: '#3b82f6' },
  },
  { id: 'e3', source: 'admin-panel', target: 'public-pages', style: { stroke: '#3b82f6' } },

  // Frontend to Backend
  {
    id: 'e4',
    source: 'ai-workspace',
    target: 'api-server',
    animated: true,
    label: 'REST API',
    labelStyle: { fill: '#666', fontSize: 10 },
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#22c55e' },
  },
  {
    id: 'e5',
    source: 'brain-system',
    target: 'mcp-server',
    animated: true,
    label: 'MCP Protocol',
    labelStyle: { fill: '#666', fontSize: 10 },
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#22c55e' },
  },
  {
    id: 'e6',
    source: 'ai-workspace',
    target: 'mcp-server',
    animated: true,
    style: { stroke: '#22c55e' },
  },

  // Backend to AI
  {
    id: 'e7',
    source: 'api-server',
    target: 'gemini-api',
    animated: true,
    label: 'google-genai SDK',
    labelStyle: { fill: '#666', fontSize: 10 },
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#a855f7' },
  },
  {
    id: 'e8',
    source: 'mcp-server',
    target: 'gemini-api',
    animated: true,
    style: { stroke: '#a855f7' },
  },
  {
    id: 'e9',
    source: 'mcp-server',
    target: 'vertex-ai',
    animated: true,
    label: 'Service Account',
    labelStyle: { fill: '#666', fontSize: 10 },
    style: { stroke: '#a855f7' },
  },
  {
    id: 'e10',
    source: 'api-server',
    target: 'openai',
    label: 'Embeddings',
    labelStyle: { fill: '#666', fontSize: 10 },
    style: { stroke: '#a855f7' },
  },

  // Backend to Database
  {
    id: 'e11',
    source: 'api-server',
    target: 'supabase',
    animated: true,
    label: 'Supabase Client',
    labelStyle: { fill: '#666', fontSize: 10 },
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#f97316' },
  },
  { id: 'e12', source: 'brain-system', target: 'supabase', style: { stroke: '#f97316' } },

  // Automation
  {
    id: 'e13',
    source: 'api-server',
    target: 'n8n',
    animated: true,
    label: 'Webhooks',
    labelStyle: { fill: '#666', fontSize: 10 },
    style: { stroke: '#06b6d4' },
  },
  { id: 'e14', source: 'n8n', target: 'supabase', style: { stroke: '#06b6d4' } },

  // External APIs
  {
    id: 'e15',
    source: 'mcp-server',
    target: 'google-apis',
    label: 'Service Account',
    labelStyle: { fill: '#666', fontSize: 10 },
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#ef4444' },
  },
  {
    id: 'e16',
    source: 'mcp-server',
    target: 'youtube-api',
    label: 'OAuth',
    labelStyle: { fill: '#666', fontSize: 10 },
    style: { stroke: '#ef4444' },
  },
  {
    id: 'e17',
    source: 'api-server',
    target: 'meta-api',
    label: 'Graph API',
    labelStyle: { fill: '#666', fontSize: 10 },
    style: { stroke: '#ef4444' },
  },
  { id: 'e18', source: 'n8n', target: 'meta-api', style: { stroke: '#ef4444' } },
];

// ============================================================
// MCP TOOLS FLOW
// ============================================================

export const mcpToolsNodes: Node[] = [
  {
    id: 'mcp-center',
    type: 'backend',
    position: { x: 400, y: 250 },
    data: { label: 'MCP Server', sublabel: '47 Tools' },
  },
  {
    id: 'file-tools',
    type: 'frontend',
    position: { x: 100, y: 100 },
    data: { label: 'File Operations', sublabel: '6 tools' },
  },
  {
    id: 'git-tools',
    type: 'frontend',
    position: { x: 300, y: 50 },
    data: { label: 'Git Tools', sublabel: '6 tools' },
  },
  {
    id: 'gemini-tools',
    type: 'ai',
    position: { x: 550, y: 50 },
    data: { label: 'Gemini AI', sublabel: '12 tools' },
  },
  {
    id: 'brain-tools',
    type: 'ai',
    position: { x: 700, y: 150 },
    data: { label: 'Brain RAG', sublabel: '4 tools' },
  },
  {
    id: 'youtube-tools',
    type: 'external',
    position: { x: 700, y: 300 },
    data: { label: 'YouTube', sublabel: '3 tools' },
  },
  {
    id: 'drive-tools',
    type: 'external',
    position: { x: 650, y: 450 },
    data: { label: 'Drive', sublabel: '2 tools' },
  },
  {
    id: 'calendar-tools',
    type: 'external',
    position: { x: 450, y: 500 },
    data: { label: 'Calendar', sublabel: '2 tools' },
  },
  {
    id: 'seo-tools',
    type: 'external',
    position: { x: 200, y: 450 },
    data: { label: 'SEO', sublabel: '2 tools' },
  },
  {
    id: 'deploy-tools',
    type: 'automation',
    position: { x: 100, y: 300 },
    data: { label: 'Deploy', sublabel: '3 tools' },
  },
];

export const mcpToolsEdges: Edge[] = [
  {
    id: 'mcp-e1',
    source: 'mcp-center',
    target: 'file-tools',
    animated: true,
    style: { stroke: '#3b82f6' },
  },
  {
    id: 'mcp-e2',
    source: 'mcp-center',
    target: 'git-tools',
    animated: true,
    style: { stroke: '#3b82f6' },
  },
  {
    id: 'mcp-e3',
    source: 'mcp-center',
    target: 'gemini-tools',
    animated: true,
    style: { stroke: '#a855f7' },
  },
  {
    id: 'mcp-e4',
    source: 'mcp-center',
    target: 'brain-tools',
    animated: true,
    style: { stroke: '#a855f7' },
  },
  {
    id: 'mcp-e5',
    source: 'mcp-center',
    target: 'youtube-tools',
    animated: true,
    style: { stroke: '#ef4444' },
  },
  {
    id: 'mcp-e6',
    source: 'mcp-center',
    target: 'drive-tools',
    animated: true,
    style: { stroke: '#ef4444' },
  },
  {
    id: 'mcp-e7',
    source: 'mcp-center',
    target: 'calendar-tools',
    animated: true,
    style: { stroke: '#ef4444' },
  },
  {
    id: 'mcp-e8',
    source: 'mcp-center',
    target: 'seo-tools',
    animated: true,
    style: { stroke: '#ef4444' },
  },
  {
    id: 'mcp-e9',
    source: 'mcp-center',
    target: 'deploy-tools',
    animated: true,
    style: { stroke: '#06b6d4' },
  },
];

// ============================================================
// DATA FLOW
// ============================================================

export const dataFlowNodes: Node[] = [
  {
    id: 'user',
    type: 'frontend',
    position: { x: 400, y: 0 },
    data: { label: 'User', sublabel: 'Browser' },
  },
  {
    id: 'vite',
    type: 'frontend',
    position: { x: 400, y: 100 },
    data: { label: 'Vite Dev', sublabel: ':8080' },
  },
  {
    id: 'react',
    type: 'frontend',
    position: { x: 400, y: 200 },
    data: { label: 'React App', sublabel: 'TanStack Query' },
  },
  {
    id: 'api',
    type: 'backend',
    position: { x: 200, y: 350 },
    data: { label: 'API Server', sublabel: 'Express :3001' },
  },
  {
    id: 'mcp',
    type: 'backend',
    position: { x: 600, y: 350 },
    data: { label: 'MCP Server', sublabel: 'FastAPI :3002' },
  },
  {
    id: 'db',
    type: 'database',
    position: { x: 200, y: 500 },
    data: { label: 'Supabase', sublabel: 'PostgreSQL' },
  },
  {
    id: 'ai',
    type: 'ai',
    position: { x: 600, y: 500 },
    data: { label: 'AI Services', sublabel: 'Gemini, OpenAI' },
  },
];

export const dataFlowEdges: Edge[] = [
  {
    id: 'df-1',
    source: 'user',
    target: 'vite',
    animated: true,
    label: 'HTTP',
    style: { stroke: '#3b82f6' },
  },
  {
    id: 'df-2',
    source: 'vite',
    target: 'react',
    animated: true,
    label: 'HMR',
    style: { stroke: '#3b82f6' },
  },
  {
    id: 'df-3',
    source: 'react',
    target: 'api',
    animated: true,
    label: 'REST',
    style: { stroke: '#22c55e' },
  },
  {
    id: 'df-4',
    source: 'react',
    target: 'mcp',
    animated: true,
    label: 'SSE Stream',
    style: { stroke: '#22c55e' },
  },
  {
    id: 'df-5',
    source: 'api',
    target: 'db',
    animated: true,
    label: 'Supabase JS',
    style: { stroke: '#f97316' },
  },
  {
    id: 'df-6',
    source: 'mcp',
    target: 'ai',
    animated: true,
    label: 'SDK',
    style: { stroke: '#a855f7' },
  },
  {
    id: 'df-7',
    source: 'api',
    target: 'mcp',
    animated: true,
    label: 'Internal API',
    style: { stroke: '#22c55e', strokeDasharray: '5,5' },
  },
];

// ============================================================
// AI MULTI-TIER ARCHITECTURE
// ============================================================

export const aiArchitectureNodes: Node[] = [
  // TIER 1: USER INTERFACE
  {
    id: 'user-tier',
    type: 'frontend',
    position: { x: 400, y: 0 },
    data: { label: '👤 User', sublabel: 'Browser/Mobile' },
  },

  // TIER 2: AI WORKSPACE - 6 Assistants
  {
    id: 'ai-workspace',
    type: 'frontend',
    position: { x: 400, y: 100 },
    data: { label: '🚀 AI Workspace', sublabel: '6 Trợ lý chuyên biệt' },
  },
  {
    id: 'research-assistant',
    type: 'ai',
    position: { x: 50, y: 200 },
    data: { label: '🔬 Nghiên cứu', sublabel: 'Research & Analysis' },
  },
  {
    id: 'course-assistant',
    type: 'ai',
    position: { x: 200, y: 200 },
    data: { label: '📚 Khóa học', sublabel: 'Course Creation' },
  },
  {
    id: 'financial-assistant',
    type: 'ai',
    position: { x: 350, y: 200 },
    data: { label: '💰 Tài chính', sublabel: 'Financial Analysis' },
  },
  {
    id: 'news-assistant',
    type: 'ai',
    position: { x: 500, y: 200 },
    data: { label: '📰 Tin tức', sublabel: 'News & Trends' },
  },
  {
    id: 'career-assistant',
    type: 'ai',
    position: { x: 650, y: 200 },
    data: { label: '🚀 Sự nghiệp', sublabel: 'Career & CV' },
  },
  {
    id: 'daily-assistant',
    type: 'ai',
    position: { x: 800, y: 200 },
    data: { label: '📅 Hàng ngày', sublabel: 'Planning & Todo' },
  },

  // TIER 3: INTELLIGENT MEMORY
  {
    id: 'memory-system',
    type: 'backend',
    position: { x: 250, y: 350 },
    data: { label: '🧠 Intelligent Memory', sublabel: 'Context Management' },
  },
  {
    id: 'conversation-history',
    type: 'database',
    position: { x: 550, y: 350 },
    data: { label: '💬 Conversation History', sublabel: 'Supabase Storage' },
  },

  // TIER 4: AI MODELS (Multi-Provider)
  {
    id: 'gpt4o',
    type: 'ai',
    position: { x: 50, y: 480 },
    data: { label: '🤖 GPT-4o', sublabel: 'OpenAI Best' },
  },
  {
    id: 'gpt4o-mini',
    type: 'ai',
    position: { x: 200, y: 480 },
    data: { label: '💨 GPT-4o Mini', sublabel: 'OpenAI Cheap' },
  },
  {
    id: 'claude-sonnet',
    type: 'ai',
    position: { x: 400, y: 480 },
    data: { label: '🟣 Claude 3.5 Sonnet', sublabel: 'Anthropic Best' },
  },
  {
    id: 'claude-haiku',
    type: 'ai',
    position: { x: 550, y: 480 },
    data: { label: '⚡ Claude 3.5 Haiku', sublabel: 'Anthropic Fast' },
  },
  {
    id: 'gemini-flash',
    type: 'ai',
    position: { x: 750, y: 480 },
    data: { label: '🔷 Gemini 2.5 Flash', sublabel: 'Google (MCP)' },
  },

  // TIER 5: BRAIN SYSTEM
  {
    id: 'brain-rag',
    type: 'backend',
    position: { x: 400, y: 600 },
    data: { label: '🧠 Brain RAG', sublabel: 'Knowledge Base' },
  },
  {
    id: 'knowledge-domains',
    type: 'database',
    position: { x: 200, y: 700 },
    data: { label: '📂 Knowledge Domains', sublabel: '12 Domains' },
  },
  {
    id: 'embeddings-store',
    type: 'database',
    position: { x: 600, y: 700 },
    data: { label: '🔍 Embeddings', sublabel: 'Vector Search' },
  },
];

export const aiArchitectureEdges: Edge[] = [
  // User to Workspace
  {
    id: 'ai-e1',
    source: 'user-tier',
    target: 'ai-workspace',
    animated: true,
    style: { stroke: '#3b82f6' },
  },

  // Workspace to 6 Assistants
  {
    id: 'ai-e2',
    source: 'ai-workspace',
    target: 'research-assistant',
    animated: true,
    style: { stroke: '#a855f7' },
  },
  {
    id: 'ai-e3',
    source: 'ai-workspace',
    target: 'course-assistant',
    animated: true,
    style: { stroke: '#22c55e' },
  },
  {
    id: 'ai-e4',
    source: 'ai-workspace',
    target: 'financial-assistant',
    animated: true,
    style: { stroke: '#eab308' },
  },
  {
    id: 'ai-e5',
    source: 'ai-workspace',
    target: 'news-assistant',
    animated: true,
    style: { stroke: '#8b5cf6' },
  },
  {
    id: 'ai-e6',
    source: 'ai-workspace',
    target: 'career-assistant',
    animated: true,
    style: { stroke: '#f97316' },
  },
  {
    id: 'ai-e7',
    source: 'ai-workspace',
    target: 'daily-assistant',
    animated: true,
    style: { stroke: '#ec4899' },
  },

  // Assistants to Memory System
  {
    id: 'ai-e8',
    source: 'research-assistant',
    target: 'memory-system',
    style: { stroke: '#22c55e' },
    label: 'Context',
  },
  {
    id: 'ai-e9',
    source: 'course-assistant',
    target: 'memory-system',
    style: { stroke: '#22c55e' },
  },
  {
    id: 'ai-e10',
    source: 'financial-assistant',
    target: 'memory-system',
    style: { stroke: '#22c55e' },
  },
  {
    id: 'ai-e11',
    source: 'news-assistant',
    target: 'conversation-history',
    style: { stroke: '#f97316' },
  },
  {
    id: 'ai-e12',
    source: 'career-assistant',
    target: 'conversation-history',
    style: { stroke: '#f97316' },
  },
  {
    id: 'ai-e13',
    source: 'daily-assistant',
    target: 'conversation-history',
    style: { stroke: '#f97316' },
  },

  // Memory to Conversation
  {
    id: 'ai-e14',
    source: 'memory-system',
    target: 'conversation-history',
    animated: true,
    label: 'Persist',
    style: { stroke: '#f97316' },
  },

  // Memory to AI Models (Multi-Provider)
  {
    id: 'ai-e15',
    source: 'memory-system',
    target: 'gpt4o',
    animated: true,
    label: 'Stream',
    style: { stroke: '#a855f7' },
  },
  {
    id: 'ai-e16',
    source: 'memory-system',
    target: 'gpt4o-mini',
    animated: true,
    style: { stroke: '#a855f7' },
  },
  {
    id: 'ai-e17',
    source: 'memory-system',
    target: 'claude-sonnet',
    animated: true,
    style: { stroke: '#a855f7' },
  },
  {
    id: 'ai-e18',
    source: 'memory-system',
    target: 'claude-haiku',
    animated: true,
    style: { stroke: '#a855f7' },
  },
  {
    id: 'ai-e18b',
    source: 'memory-system',
    target: 'gemini-flash',
    animated: true,
    style: { stroke: '#a855f7' },
  },

  // AI Models to Brain RAG
  { id: 'ai-e19', source: 'gpt4o', target: 'brain-rag', style: { stroke: '#22c55e' } },
  {
    id: 'ai-e20',
    source: 'claude-sonnet',
    target: 'brain-rag',
    style: { stroke: '#22c55e' },
    label: 'RAG Query',
  },
  { id: 'ai-e21', source: 'gemini-flash', target: 'brain-rag', style: { stroke: '#22c55e' } },

  // Brain to Knowledge
  {
    id: 'ai-e22',
    source: 'brain-rag',
    target: 'knowledge-domains',
    animated: true,
    style: { stroke: '#f97316' },
  },
  {
    id: 'ai-e23',
    source: 'brain-rag',
    target: 'embeddings-store',
    animated: true,
    label: 'Vector Search',
    style: { stroke: '#f97316' },
  },
];

// ============================================================
// SOLO FOUNDER HUB
// ============================================================

export const soloHubNodes: Node[] = [
  // User Input
  {
    id: 'user-input',
    type: 'frontend',
    position: { x: 400, y: 0 },
    data: { label: '👤 Solo Founder', sublabel: 'One-Person Business' },
  },

  // Solo Hub Center
  {
    id: 'solo-hub',
    type: 'backend',
    position: { x: 400, y: 100 },
    data: { label: '🎯 Solo Hub API', sublabel: '/api/solo-hub/chat' },
  },

  // 6 PEER Agents (Not hierarchical - all equal level)
  {
    id: 'dev-agent',
    type: 'ai',
    position: { x: 50, y: 220 },
    data: { label: '👨‍💻 Dev Agent', sublabel: 'Code Review & Debug' },
  },
  {
    id: 'content-agent',
    type: 'ai',
    position: { x: 200, y: 220 },
    data: { label: '✍️ Content Agent', sublabel: 'Blog & Social' },
  },
  {
    id: 'marketing-agent',
    type: 'ai',
    position: { x: 350, y: 220 },
    data: { label: '📢 Marketing Agent', sublabel: 'Growth & Ads' },
  },
  {
    id: 'sales-agent',
    type: 'ai',
    position: { x: 500, y: 220 },
    data: { label: '💼 Sales Agent', sublabel: 'Leads & Outreach' },
  },
  {
    id: 'admin-agent',
    type: 'ai',
    position: { x: 650, y: 220 },
    data: { label: '📋 Admin Agent', sublabel: 'Ops & Schedule' },
  },
  {
    id: 'advisor-agent',
    type: 'ai',
    position: { x: 800, y: 220 },
    data: { label: '🧠 Advisor Agent', sublabel: 'Strategy & Decisions' },
  },

  // AI Model Layer
  {
    id: 'openai-solo',
    type: 'external',
    position: { x: 250, y: 380 },
    data: { label: '🤖 OpenAI', sublabel: 'GPT-4o / GPT-4o-mini' },
  },
  {
    id: 'anthropic-solo',
    type: 'external',
    position: { x: 550, y: 380 },
    data: { label: '🟣 Anthropic', sublabel: 'Claude 3.5 Sonnet' },
  },

  // Action Executors
  {
    id: 'action-executor',
    type: 'automation',
    position: { x: 150, y: 500 },
    data: { label: '⚡ Action Executor', sublabel: 'Real Actions' },
  },
  {
    id: 'multi-agent-orch',
    type: 'automation',
    position: { x: 400, y: 500 },
    data: { label: '🎭 Multi-Agent', sublabel: 'Orchestrator' },
  },
  {
    id: 'copilot-planner',
    type: 'automation',
    position: { x: 650, y: 500 },
    data: { label: '📋 Copilot Planner', sublabel: 'Task Planning' },
  },

  // n8n Integration
  {
    id: 'n8n-solo',
    type: 'external',
    position: { x: 400, y: 620 },
    data: { label: '⚡ n8n Workflows', sublabel: 'Automation Engine' },
  },
];

export const soloHubEdges: Edge[] = [
  // User to Hub
  {
    id: 'sh-e1',
    source: 'user-input',
    target: 'solo-hub',
    animated: true,
    style: { stroke: '#3b82f6' },
  },

  // Hub to 6 Peer Agents (equal connections)
  {
    id: 'sh-e2',
    source: 'solo-hub',
    target: 'dev-agent',
    animated: true,
    style: { stroke: '#a855f7' },
  },
  {
    id: 'sh-e3',
    source: 'solo-hub',
    target: 'content-agent',
    animated: true,
    style: { stroke: '#a855f7' },
  },
  {
    id: 'sh-e4',
    source: 'solo-hub',
    target: 'marketing-agent',
    animated: true,
    style: { stroke: '#a855f7' },
  },
  {
    id: 'sh-e5',
    source: 'solo-hub',
    target: 'sales-agent',
    animated: true,
    style: { stroke: '#a855f7' },
  },
  {
    id: 'sh-e6',
    source: 'solo-hub',
    target: 'admin-agent',
    animated: true,
    style: { stroke: '#a855f7' },
  },
  {
    id: 'sh-e7',
    source: 'solo-hub',
    target: 'advisor-agent',
    animated: true,
    style: { stroke: '#a855f7' },
  },

  // Agents to AI Models
  { id: 'sh-e8', source: 'dev-agent', target: 'openai-solo', style: { stroke: '#22c55e' } },
  { id: 'sh-e9', source: 'content-agent', target: 'anthropic-solo', style: { stroke: '#22c55e' } },
  { id: 'sh-e10', source: 'marketing-agent', target: 'openai-solo', style: { stroke: '#22c55e' } },
  { id: 'sh-e11', source: 'sales-agent', target: 'anthropic-solo', style: { stroke: '#22c55e' } },
  { id: 'sh-e12', source: 'admin-agent', target: 'openai-solo', style: { stroke: '#22c55e' } },
  { id: 'sh-e13', source: 'advisor-agent', target: 'anthropic-solo', style: { stroke: '#22c55e' } },

  // AI Models to Action Layer
  {
    id: 'sh-e14',
    source: 'openai-solo',
    target: 'action-executor',
    animated: true,
    style: { stroke: '#06b6d4' },
  },
  {
    id: 'sh-e15',
    source: 'anthropic-solo',
    target: 'multi-agent-orch',
    animated: true,
    style: { stroke: '#06b6d4' },
  },
  {
    id: 'sh-e16',
    source: 'openai-solo',
    target: 'copilot-planner',
    animated: true,
    style: { stroke: '#06b6d4' },
  },

  // Action Layer to n8n
  {
    id: 'sh-e17',
    source: 'action-executor',
    target: 'n8n-solo',
    animated: true,
    style: { stroke: '#ef4444' },
  },
  {
    id: 'sh-e18',
    source: 'multi-agent-orch',
    target: 'n8n-solo',
    animated: true,
    style: { stroke: '#ef4444' },
  },
  {
    id: 'sh-e19',
    source: 'copilot-planner',
    target: 'n8n-solo',
    animated: true,
    style: { stroke: '#ef4444' },
  },
];

// ============================================================
// VISUAL WORKSPACE - 4-Layer Execution Engine
// ============================================================

export const visualWorkspaceNodes: Node[] = [
  // User Interface Layer
  {
    id: 'vw-user',
    type: 'frontend',
    position: { x: 400, y: 0 },
    data: { label: '👤 User', sublabel: 'Visual Workspace UI' },
  },

  // 3-Panel Interface
  {
    id: 'vw-chat-panel',
    type: 'frontend',
    position: { x: 100, y: 100 },
    data: { label: '💬 Chat Panel', sublabel: 'AI Commands' },
  },
  {
    id: 'vw-canvas',
    type: 'frontend',
    position: { x: 400, y: 100 },
    data: { label: '🎨 Visual Canvas', sublabel: 'ReactFlow + Steps' },
  },
  {
    id: 'vw-preview',
    type: 'frontend',
    position: { x: 700, y: 100 },
    data: { label: '👁️ Preview Panel', sublabel: 'Live Output' },
  },

  // SSE Connection
  {
    id: 'vw-sse',
    type: 'backend',
    position: { x: 400, y: 220 },
    data: { label: '📡 SSE Stream', sublabel: '/chat-smart/stream' },
  },

  // 4-LAYER EXECUTION ENGINE
  {
    id: 'layer-1-planning',
    type: 'ai',
    position: { x: 100, y: 340 },
    data: { label: '📋 Layer 1: Planning', sublabel: 'Copilot Planner' },
  },
  {
    id: 'layer-2-orchestration',
    type: 'ai',
    position: { x: 300, y: 340 },
    data: { label: '🎭 Layer 2: Orchestration', sublabel: 'Multi-Agent Router' },
  },
  {
    id: 'layer-3-execution',
    type: 'automation',
    position: { x: 500, y: 340 },
    data: { label: '⚡ Layer 3: Execution', sublabel: 'Copilot Executor' },
  },
  {
    id: 'layer-4-learning',
    type: 'database',
    position: { x: 700, y: 340 },
    data: { label: '🧠 Layer 4: Learning', sublabel: 'Feedback Loop' },
  },

  // AI Models
  {
    id: 'vw-openai',
    type: 'external',
    position: { x: 200, y: 460 },
    data: { label: '🤖 OpenAI', sublabel: 'GPT-4o' },
  },
  {
    id: 'vw-anthropic',
    type: 'external',
    position: { x: 400, y: 460 },
    data: { label: '🟣 Claude', sublabel: '3.5 Sonnet' },
  },
  {
    id: 'vw-gemini',
    type: 'external',
    position: { x: 600, y: 460 },
    data: { label: '🔷 Gemini', sublabel: '2.5 Flash (MCP)' },
  },

  // Output Layer
  {
    id: 'vw-supabase',
    type: 'database',
    position: { x: 250, y: 580 },
    data: { label: '💾 Supabase', sublabel: 'Execution History' },
  },
  {
    id: 'vw-n8n',
    type: 'automation',
    position: { x: 550, y: 580 },
    data: { label: '⚡ n8n', sublabel: 'Real Actions' },
  },
];

export const visualWorkspaceEdges: Edge[] = [
  // User to 3 Panels
  {
    id: 'vw-e1',
    source: 'vw-user',
    target: 'vw-chat-panel',
    animated: true,
    style: { stroke: '#3b82f6' },
  },
  {
    id: 'vw-e2',
    source: 'vw-user',
    target: 'vw-canvas',
    animated: true,
    style: { stroke: '#3b82f6' },
  },
  {
    id: 'vw-e3',
    source: 'vw-user',
    target: 'vw-preview',
    animated: true,
    style: { stroke: '#3b82f6' },
  },

  // Chat to SSE
  {
    id: 'vw-e4',
    source: 'vw-chat-panel',
    target: 'vw-sse',
    animated: true,
    label: 'Command',
    style: { stroke: '#22c55e' },
  },

  // SSE to 4 Layers (sequential flow)
  {
    id: 'vw-e5',
    source: 'vw-sse',
    target: 'layer-1-planning',
    animated: true,
    label: 'step_start',
    style: { stroke: '#a855f7' },
  },
  {
    id: 'vw-e6',
    source: 'layer-1-planning',
    target: 'layer-2-orchestration',
    animated: true,
    label: 'step_complete',
    style: { stroke: '#a855f7' },
  },
  {
    id: 'vw-e7',
    source: 'layer-2-orchestration',
    target: 'layer-3-execution',
    animated: true,
    style: { stroke: '#a855f7' },
  },
  {
    id: 'vw-e8',
    source: 'layer-3-execution',
    target: 'layer-4-learning',
    animated: true,
    style: { stroke: '#a855f7' },
  },

  // Layers to AI Models
  { id: 'vw-e9', source: 'layer-1-planning', target: 'vw-openai', style: { stroke: '#06b6d4' } },
  {
    id: 'vw-e10',
    source: 'layer-2-orchestration',
    target: 'vw-anthropic',
    style: { stroke: '#06b6d4' },
  },
  { id: 'vw-e11', source: 'layer-3-execution', target: 'vw-gemini', style: { stroke: '#06b6d4' } },

  // Output connections
  {
    id: 'vw-e12',
    source: 'layer-4-learning',
    target: 'vw-supabase',
    animated: true,
    label: 'Save',
    style: { stroke: '#f97316' },
  },
  {
    id: 'vw-e13',
    source: 'layer-3-execution',
    target: 'vw-n8n',
    animated: true,
    label: 'Actions',
    style: { stroke: '#ef4444' },
  },

  // Canvas receives events
  {
    id: 'vw-e14',
    source: 'vw-sse',
    target: 'vw-canvas',
    animated: true,
    label: 'SSE Events',
    style: { stroke: '#eab308', strokeDasharray: '5 5' },
  },

  // Complete back to Preview
  {
    id: 'vw-e15',
    source: 'layer-4-learning',
    target: 'vw-preview',
    animated: true,
    label: 'Result',
    style: { stroke: '#22c55e' },
  },
];
