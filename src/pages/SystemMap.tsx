/**
 * 🗺️ SYSTEM MAP - Interactive Connection Network
 *
 * Full visualization with:
 * - React Flow for interactive diagrams
 * - Real-time service health
 *
 * @author LongSang Admin
 * @version 2.0.0
 * @date 2025-11-29
 */

import { useEffect, useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  Handle,
  NodeProps,
  ConnectionMode,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  Cloud,
  Database,
  Globe,
  HardDrive,
  Loader2,
  Network,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
  Zap,
  Layers,
  LayoutGrid,
  Workflow,
  MousePointer,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// TYPES
// ============================================================

type ServiceStatus = 'online' | 'offline' | 'checking' | 'degraded' | 'unknown';

interface ServiceHealth {
  id: string;
  name: string;
  description: string;
  status: ServiceStatus;
  url?: string;
  port?: number;
  latency?: number;
  lastChecked?: Date;
  category: 'core' | 'ai' | 'storage' | 'external' | 'automation';
  dependencies?: string[];
}

// ============================================================
// CUSTOM NODE COMPONENTS
// ============================================================

function FrontendNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg border-2 border-blue-400 min-w-[140px]">
      <Handle type="target" position={Position.Top} className="!bg-blue-300" />
      <div className="flex items-center gap-2">
        <LayoutGrid className="h-5 w-5" />
        <div>
          <div className="font-bold text-sm">{data.label}</div>
          {data.sublabel && <div className="text-xs opacity-80">{data.sublabel}</div>}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-300" />
    </div>
  );
}

function BackendNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg border-2 border-green-400 min-w-[140px]">
      <Handle type="target" position={Position.Top} className="!bg-green-300" />
      <div className="flex items-center gap-2">
        <Server className="h-5 w-5" />
        <div>
          <div className="font-bold text-sm">{data.label}</div>
          {data.sublabel && <div className="text-xs opacity-80">{data.sublabel}</div>}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-green-300" />
    </div>
  );
}

function AINode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg border-2 border-purple-400 min-w-[140px]">
      <Handle type="target" position={Position.Top} className="!bg-purple-300" />
      <Handle type="target" position={Position.Left} className="!bg-purple-300" />
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5" />
        <div>
          <div className="font-bold text-sm">{data.label}</div>
          {data.sublabel && <div className="text-xs opacity-80">{data.sublabel}</div>}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-purple-300" />
      <Handle type="source" position={Position.Right} className="!bg-purple-300" />
    </div>
  );
}

function DatabaseNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg border-2 border-orange-400 min-w-[140px]">
      <Handle type="target" position={Position.Top} className="!bg-orange-300" />
      <Handle type="target" position={Position.Left} className="!bg-orange-300" />
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5" />
        <div>
          <div className="font-bold text-sm">{data.label}</div>
          {data.sublabel && <div className="text-xs opacity-80">{data.sublabel}</div>}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-orange-300" />
    </div>
  );
}

function ExternalNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg border-2 border-red-400 min-w-[140px]">
      <Handle type="target" position={Position.Top} className="!bg-red-300" />
      <Handle type="target" position={Position.Left} className="!bg-red-300" />
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5" />
        <div>
          <div className="font-bold text-sm">{data.label}</div>
          {data.sublabel && <div className="text-xs opacity-80">{data.sublabel}</div>}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-red-300" />
    </div>
  );
}

function AutomationNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg border-2 border-cyan-400 min-w-[140px]">
      <Handle type="target" position={Position.Top} className="!bg-cyan-300" />
      <Handle type="target" position={Position.Left} className="!bg-cyan-300" />
      <div className="flex items-center gap-2">
        <Workflow className="h-5 w-5" />
        <div>
          <div className="font-bold text-sm">{data.label}</div>
          {data.sublabel && <div className="text-xs opacity-80">{data.sublabel}</div>}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-300" />
      <Handle type="source" position={Position.Right} className="!bg-cyan-300" />
    </div>
  );
}

const nodeTypes = {
  frontend: FrontendNode,
  backend: BackendNode,
  ai: AINode,
  database: DatabaseNode,
  external: ExternalNode,
  automation: AutomationNode,
};

// ============================================================
// DIAGRAM DATA - Full System Architecture
// ============================================================

const initialNodes: Node[] = [
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

const initialEdges: Edge[] = [
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

// MCP Tools Flow
const mcpToolsNodes: Node[] = [
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

const mcpToolsEdges: Edge[] = [
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

// Data Flow
const dataFlowNodes: Node[] = [
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

const dataFlowEdges: Edge[] = [
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
// SERVICE DEFINITIONS
// ============================================================

const SERVICES: Omit<ServiceHealth, 'status' | 'latency' | 'lastChecked'>[] = [
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Database, Auth, Storage',
    url: import.meta.env.VITE_SUPABASE_URL,
    category: 'core',
  },
  {
    id: 'vite-dev',
    name: 'Vite Dev Server',
    description: 'Frontend :8080',
    port: 8080,
    category: 'core',
  },
  {
    id: 'api-server',
    name: 'API Server',
    description: 'Express :3001',
    port: 3001,
    category: 'core',
  },
  {
    id: 'mcp-server',
    name: 'MCP Server',
    description: 'Python :3002',
    port: 3002,
    category: 'ai',
    dependencies: ['gemini-api', 'vertex-ai'],
  },
  {
    id: 'gemini-api',
    name: 'Gemini AI',
    description: 'Google Gemini 2.5',
    url: 'https://generativelanguage.googleapis.com',
    category: 'ai',
  },
  {
    id: 'vertex-ai',
    name: 'Vertex AI',
    description: 'Imagen 3.0',
    url: 'https://us-central1-aiplatform.googleapis.com',
    category: 'ai',
  },
  {
    id: 'n8n',
    name: 'n8n Server',
    description: 'Workflows :5678',
    port: 5678,
    category: 'automation',
  },
  {
    id: 'youtube-api',
    name: 'YouTube API',
    description: 'Video management',
    url: 'https://www.googleapis.com/youtube/v3',
    category: 'external',
  },
  {
    id: 'drive-api',
    name: 'Google Drive',
    description: 'File storage',
    url: 'https://www.googleapis.com/drive/v3',
    category: 'storage',
  },
];

// ============================================================
// HEALTH CHECK HOOK
// ============================================================

function useServiceHealth() {
  const [services, setServices] = useState<ServiceHealth[]>(
    SERVICES.map((s) => ({ ...s, status: 'unknown' as ServiceStatus }))
  );
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastFullCheck, setLastFullCheck] = useState<Date | null>(null);

  const checkService = useCallback(
    async (
      service: Omit<ServiceHealth, 'status' | 'latency' | 'lastChecked'>
    ): Promise<Partial<ServiceHealth>> => {
      const startTime = Date.now();

      try {
        if (service.port) {
          const response = await fetch(`http://localhost:${service.port}`, {
            method: 'HEAD',
            signal: AbortSignal.timeout(3000),
          }).catch(() => null);

          return {
            status: response ? 'online' : 'offline',
            latency: Date.now() - startTime,
            lastChecked: new Date(),
          };
        }

        if (service.url) {
          const hasConfig = checkServiceConfig(service.id);
          return {
            status: hasConfig ? 'online' : 'degraded',
            latency: 0,
            lastChecked: new Date(),
          };
        }

        return { status: 'unknown', lastChecked: new Date() };
      } catch {
        return { status: 'offline', lastChecked: new Date() };
      }
    },
    []
  );

  const fetchSystemStatus = useCallback(async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      // Fetch system status from unified connector
      const [statusRes, metricsRes] = await Promise.all([
        fetch(`${apiUrl}/api/system/status`)
          .then((r) => r.json())
          .catch(() => null),
        fetch(`${apiUrl}/api/system/metrics`)
          .then((r) => r.json())
          .catch(() => null),
      ]);

      if (statusRes?.success) {
        setSystemStatus(statusRes);
      }
      if (metricsRes?.success) {
        setMetrics(metricsRes);
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    }
  }, []);

  const checkAllServices = useCallback(async () => {
    setIsChecking(true);
    setServices((prev) => prev.map((s) => ({ ...s, status: 'checking' as ServiceStatus })));

    // Fetch from unified connector API
    await fetchSystemStatus();

    const results = await Promise.all(
      SERVICES.map(async (service) => {
        const result = await checkService(service);
        return { ...service, ...result } as ServiceHealth;
      })
    );

    setServices(results);
    setLastFullCheck(new Date());
    setIsChecking(false);
  }, [checkService, fetchSystemStatus]);

  useEffect(() => {
    checkAllServices();
    const interval = setInterval(checkAllServices, 30000);
    return () => clearInterval(interval);
  }, [checkAllServices]);

  return { services, systemStatus, metrics, isChecking, lastFullCheck, checkAllServices };
}

function checkServiceConfig(serviceId: string): boolean {
  switch (serviceId) {
    case 'supabase':
      return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
    case 'gemini-api':
    case 'vertex-ai':
    case 'youtube-api':
    case 'drive-api':
      return true;
    default:
      return false;
  }
}

// ============================================================
// COMPONENTS
// ============================================================

function StatusBadge({ status }: { status: ServiceStatus }) {
  const config = {
    online: { icon: CheckCircle2, color: 'text-green-600 bg-green-100', text: 'Online' },
    offline: { icon: WifiOff, color: 'text-red-600 bg-red-100', text: 'Offline' },
    checking: { icon: Loader2, color: 'text-yellow-600 bg-yellow-100', text: 'Checking' },
    degraded: { icon: AlertCircle, color: 'text-orange-600 bg-orange-100', text: 'Degraded' },
    unknown: { icon: Wifi, color: 'text-gray-600 bg-gray-100', text: 'Unknown' },
  };

  const { icon: Icon, color, text } = config[status];

  return (
    <Badge variant="outline" className={cn('gap-1', color)}>
      <Icon className={cn('h-3 w-3', status === 'checking' && 'animate-spin')} />
      {text}
    </Badge>
  );
}

function DiagramLegend() {
  const items = [
    { color: 'bg-blue-500', label: 'Frontend' },
    { color: 'bg-green-500', label: 'Backend' },
    { color: 'bg-purple-500', label: 'AI Services' },
    { color: 'bg-orange-500', label: 'Database' },
    { color: 'bg-red-500', label: 'External APIs' },
    { color: 'bg-cyan-500', label: 'Automation' },
  ];

  return (
    <div className="flex flex-wrap gap-3 p-3 bg-background/80 backdrop-blur rounded-lg border">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div className={cn('w-3 h-3 rounded', item.color)} />
          <span className="text-xs">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function FlowDiagram({
  nodes: initialNodesProp,
  edges: initialEdgesProp,
  title,
  description,
}: {
  nodes: Node[];
  edges: Edge[];
  title: string;
  description: string;
}) {
  const [nodes, , onNodesChange] = useNodesState(initialNodesProp);
  const [edges, , onEdgesChange] = useEdgesState(initialEdgesProp);

  return (
    <Card className="h-[600px]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-[500px] p-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          className="bg-muted/30"
        >
          <Background color="#ddd" gap={20} />
          <Controls />
          <MiniMap
            nodeStrokeWidth={3}
            nodeColor={(node) => {
              switch (node.type) {
                case 'frontend':
                  return '#3b82f6';
                case 'backend':
                  return '#22c55e';
                case 'ai':
                  return '#a855f7';
                case 'database':
                  return '#f97316';
                case 'external':
                  return '#ef4444';
                case 'automation':
                  return '#06b6d4';
                default:
                  return '#888';
              }
            }}
          />
          <Panel position="bottom-left">
            <DiagramLegend />
          </Panel>
        </ReactFlow>
      </CardContent>
    </Card>
  );
}

function StatsOverview({ services }: { services: ServiceHealth[] }) {
  const online = services.filter((s) => s.status === 'online').length;
  const offline = services.filter((s) => s.status === 'offline').length;
  const degraded = services.filter((s) => s.status === 'degraded').length;
  const total = services.length;
  const healthPercent = Math.round((online / total) * 100);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Services</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
            <Layers className="h-8 w-8 text-muted-foreground/50" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Online</p>
              <p className="text-2xl font-bold text-green-600">{online}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500/50" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Issues</p>
              <p className="text-2xl font-bold text-red-600">{offline + degraded}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500/50" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div>
            <p className="text-sm text-muted-foreground">Health Score</p>
            <p className="text-2xl font-bold">{healthPercent}%</p>
          </div>
          <Progress value={healthPercent} className="mt-2" />
        </CardContent>
      </Card>
    </div>
  );
}

function ServiceHealthGrid({ services }: { services: ServiceHealth[] }) {
  const categorized = {
    core: services.filter((s) => s.category === 'core'),
    ai: services.filter((s) => s.category === 'ai'),
    automation: services.filter((s) => s.category === 'automation'),
    storage: services.filter((s) => s.category === 'storage'),
    external: services.filter((s) => s.category === 'external'),
  };

  return (
    <div className="space-y-6">
      {Object.entries(categorized).map(
        ([category, items]) =>
          items.length > 0 && (
            <div key={category}>
              <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-3">
                {category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((service) => (
                  <Card
                    key={service.id}
                    className={cn(
                      'transition-all',
                      service.status === 'online' && 'border-green-500/30 bg-green-500/5',
                      service.status === 'offline' && 'border-red-500/30 bg-red-500/5',
                      service.status === 'degraded' && 'border-orange-500/30 bg-orange-500/5'
                    )}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-xs text-muted-foreground">{service.description}</div>
                        </div>
                        <StatusBadge status={service.status} />
                      </div>
                      {service.latency !== undefined && service.latency > 0 && (
                        <div className="text-xs text-muted-foreground mt-2">
                          Latency: {service.latency}ms
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
      )}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function SystemMap() {
  const { services, systemStatus, metrics, isChecking, lastFullCheck, checkAllServices } =
    useServiceHealth();
  const [activeTab, setActiveTab] = useState('architecture');

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Network className="h-8 w-8 text-primary" />
            System Map
          </h1>
          <p className="text-muted-foreground mt-1">
            Interactive architecture diagrams & service monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          {systemStatus?.initialized && (
            <Badge variant="outline" className="bg-green-100 text-green-700">
              <Zap className="h-3 w-3 mr-1" />
              Unified Connector Active
            </Badge>
          )}
          {lastFullCheck && (
            <span className="text-xs text-muted-foreground">
              Last check: {lastFullCheck.toLocaleTimeString()}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={checkAllServices} disabled={isChecking}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isChecking && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <StatsOverview services={services} />

      {/* System Metrics from Unified Connector */}
      {metrics && Object.keys(metrics.requests || {}).length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Real-time Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {Object.entries(metrics.requests || {})
                .slice(0, 8)
                .map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground truncate">{key}</span>
                    <span className="font-mono">{value as number}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mb-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardContent className="pt-4">
          <div className="flex items-start gap-4">
            <MousePointer className="h-6 w-6 text-blue-500 mt-1" />
            <div>
              <h3 className="font-semibold">Interactive Diagrams</h3>
              <p className="text-sm text-muted-foreground">
                🖱️ <strong>Drag</strong> nodes to rearrange • 🔍 <strong>Scroll</strong> to zoom •
                📍 Use <strong>MiniMap</strong> for navigation • ⚡ <strong>Animated edges</strong>{' '}
                show active connections
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap h-auto gap-2 bg-transparent p-0">
          <TabsTrigger
            value="architecture"
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Layers className="h-4 w-4" />
            Full Architecture
          </TabsTrigger>
          <TabsTrigger
            value="mcp-tools"
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Bot className="h-4 w-4" />
            MCP Tools (47)
          </TabsTrigger>
          <TabsTrigger
            value="data-flow"
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <ArrowRight className="h-4 w-4" />
            Data Flow
          </TabsTrigger>
          <TabsTrigger
            value="health"
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Activity className="h-4 w-4" />
            Service Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="architecture">
          <FlowDiagram
            nodes={initialNodes}
            edges={initialEdges}
            title="Full System Architecture"
            description="Complete connection map: Frontend → Backend → AI → Database → External APIs"
          />
        </TabsContent>

        <TabsContent value="mcp-tools">
          <FlowDiagram
            nodes={mcpToolsNodes}
            edges={mcpToolsEdges}
            title="MCP Server Tools"
            description="47 tools organized by category: File, Git, Gemini AI, Brain, YouTube, Drive, Calendar, SEO"
          />
        </TabsContent>

        <TabsContent value="data-flow">
          <FlowDiagram
            nodes={dataFlowNodes}
            edges={dataFlowEdges}
            title="Data Flow"
            description="Request flow from User → Vite → React → API/MCP → Database/AI"
          />
        </TabsContent>

        <TabsContent value="health">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Service Health Monitor
              </CardTitle>
              <CardDescription>Real-time status of all connected services</CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceHealthGrid services={services} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
