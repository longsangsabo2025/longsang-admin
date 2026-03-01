import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';
import { usePersistedState, useScrollRestore } from '@/hooks/usePersistedState';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FolderKanban,
  Search,
  Plus,
  Key,
  Bot,
  Workflow,
  Globe,
  Server,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Database,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Shield,
  Play,
  Settings,
  Command,
  ExternalLink,
} from 'lucide-react';
import { projectsApi, type ProjectWithStats } from '@/lib/api/projects-service';

// =============================================
// TYPES & INTERFACES
// =============================================

interface Project {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
  color?: string;
  status?: string;
  local_url?: string | null;
  production_url?: string | null;
  github_url?: string | null;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, unknown>;
}

interface Credential {
  id: string;
  name: string;
  type: string;
  key_value: string;
  key_preview: string;
  environment: string;
  status: string;
  created_at: string;
  project_id: string;
  expires_at?: string;
  last_used_at?: string;
  last_rotated_at?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  projects?: Project;
}

// Agent Categories for filtering
const AGENT_CATEGORIES = {
  all: { label: 'Tất cả', icon: '🤖', color: 'bg-slate-500' },
  marketing: { label: 'Marketing', icon: '📣', color: 'bg-pink-500' },
  content: { label: 'Content', icon: '✍️', color: 'bg-blue-500' },
  analytics: { label: 'Analytics', icon: '📊', color: 'bg-green-500' },
  automation: { label: 'Automation', icon: '⚡', color: 'bg-yellow-500' },
  support: { label: 'Support', icon: '💬', color: 'bg-cyan-500' },
  research: { label: 'Research', icon: '🔍', color: 'bg-purple-500' },
  other: { label: 'Khác', icon: '📦', color: 'bg-gray-500' },
} as const;

type AgentCategory = keyof typeof AGENT_CATEGORIES;

// Get agent category - prioritize database category, fallback to type mapping
const getAgentCategory = (category: string | null | undefined, type: string): AgentCategory => {
  // First check if category is directly set in database
  if (category && category in AGENT_CATEGORIES && category !== 'all') {
    return category as AgentCategory;
  }

  // Fallback: map from type
  const typeMap: Record<string, AgentCategory> = {
    content_creator: 'content',
    content: 'content',
    content_writer: 'content',
    marketing: 'marketing',
    seo: 'marketing',
    social_media: 'marketing',
    lead_nurture: 'marketing',
    data_analyst: 'analytics',
    analytics: 'analytics',
    work_agent: 'automation',
    automation: 'automation',
    workflow: 'automation',
    research_agent: 'research',
    research: 'research',
    support: 'support',
    customer_service: 'support',
    customer_support: 'support',
  };
  return typeMap[type.toLowerCase()] || 'other';
};

interface Agent {
  id: string;
  name: string;
  type: string;
  description: string;
  status: string;
  category?: string | null;
}

interface ProjectAgent {
  id: string;
  project_id: string;
  agent_id: string;
  is_enabled: boolean;
  priority: number;
  config_override: Record<string, unknown>;
  schedule_cron: string | null;
  auto_trigger_events: string[];
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  last_run_at: string | null;
  total_cost_usd: number;
  notes: string | null;
  created_at: string;
  projects?: Project;
  ai_agents?: Agent;
}

// Mock data for projects
const mockProjects: ProjectWithStats[] = [
  {
    id: '1',
    slug: 'longsang-portfolio',
    name: 'Long Sang Portfolio',
    description: 'Website portfolio cá nhân với AI integration',
    icon: '🏠',
    color: 'from-blue-500 to-indigo-600',
    status: 'active',
    local_url: 'http://localhost:8081',
    production_url: 'https://longsang.com',
    github_url: 'https://github.com/longsangsabo2025/longsang-portfolio',
    created_at: '2025-11-01',
    updated_at: '2025-11-25',
    metadata: {},
    credentials_count: 5,
    agents_count: 3,
    workflows_count: 4,
  },
  {
    id: '2',
    slug: 'ainewbie-web',
    name: 'AI Newbie Web',
    description: 'Platform học AI cho người mới bắt đầu',
    icon: '🤖',
    color: 'from-purple-500 to-pink-600',
    status: 'active',
    local_url: 'http://localhost:5173',
    production_url: 'https://ainewbie.vn',
    github_url: 'https://github.com/longsangsabo2025/ainewbie-web',
    created_at: '2025-11-01',
    updated_at: '2025-11-24',
    metadata: {},
    credentials_count: 8,
    agents_count: 5,
    workflows_count: 6,
  },
  {
    id: '3',
    slug: 'sabo-hub',
    name: 'Sabo Hub',
    description: 'Hệ sinh thái quản lý doanh nghiệp',
    icon: '🏢',
    color: 'from-green-500 to-emerald-600',
    status: 'development',
    local_url: 'http://localhost:3000',
    production_url: null,
    github_url: 'https://github.com/longsangsabo2025/sabo-hub',
    created_at: '2025-11-01',
    updated_at: '2025-11-23',
    metadata: {},
    credentials_count: 4,
    agents_count: 2,
    workflows_count: 3,
  },
];

const statusConfig = {
  active: { label: 'Active', color: 'bg-green-500', icon: CheckCircle },
  development: { label: 'Development', color: 'bg-yellow-500', icon: Clock },
  paused: { label: 'Paused', color: 'bg-gray-500', icon: AlertCircle },
  archived: { label: 'Archived', color: 'bg-red-500', icon: AlertCircle },
};

// =============================================
// MAIN COMPONENT
// =============================================

const UnifiedProjectCenter = () => {
  // Restore scroll position when navigating back
  useScrollRestore('unified-project-center');

  const navigate = useNavigate();

  // Persisted states - survive navigation
  const [activeTab, setActiveTab] = usePersistedState('project-center-tab', 'projects');
  const [projectSearchTerm, setProjectSearchTerm] = usePersistedState('project-center-search', '');
  const [statusFilter, setStatusFilter] = usePersistedState('project-center-status-filter', 'all');
  const [credentialSearchTerm, setCredentialSearchTerm] = usePersistedState(
    'project-center-cred-search',
    ''
  );

  // Projects state
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);

  // Credentials state
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [credentialsLoading, setCredentialsLoading] = useState(true);
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [isAddCredentialOpen, setIsAddCredentialOpen] = useState(false);
  const [newCredential, setNewCredential] = useState({
    name: '',
    type: 'api_key',
    key_value: '',
    environment: 'production',
    project_id: '',
  });

  // Agents state
  const [projectAgents, setProjectAgents] = useState<ProjectAgent[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<AgentCategory>('all');
  const [isAssignAgentOpen, setIsAssignAgentOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    project_id: '',
    agent_id: '',
    priority: 1,
    schedule_cron: '',
    auto_trigger_events: [] as string[],
    notes: '',
  });

  // =============================================
  // DATA FETCHING
  // =============================================

  // Load Projects
  const loadProjects = async () => {
    setProjectsLoading(true);
    try {
      const data = await projectsApi.getAllWithStats();
      if (data && data.length > 0) {
        setProjects(data);
        setUsingMockData(false);
      } else {
        setProjects(mockProjects);
        setUsingMockData(true);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects(mockProjects);
      setUsingMockData(true);
    } finally {
      setProjectsLoading(false);
    }
  };

  // Load Credentials
  const fetchCredentials = async () => {
    setCredentialsLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_credentials')
        .select('*, projects(id, name, slug, icon)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCredentials(data || []);
    } catch (error) {
      console.error('Error fetching credentials:', error);
      sonnerToast.error('Không thể tải danh sách credentials');
    } finally {
      setCredentialsLoading(false);
    }
  };

  // Load Project Agents
  const fetchProjectAgents = async () => {
    setAgentsLoading(true);
    try {
      const { data: paData, error: paError } = await supabase
        .from('project_agents')
        .select(
          '*, projects(id, name, slug, icon), ai_agents(id, name, type, category, description, status)'
        )
        .order('priority', { ascending: true });

      if (paError) throw paError;
      setProjectAgents(paData || []);

      const { data: agentsData, error: agentsError } = await supabase
        .from('ai_agents')
        .select('id, name, type, category, description, status')
        .order('name');

      if (agentsError) throw agentsError;
      setAgents(agentsData || []);
    } catch (error) {
      console.error('Error fetching project agents:', error);
      sonnerToast.error('Không thể tải danh sách agents');
    } finally {
      setAgentsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    fetchCredentials();
    fetchProjectAgents();
  }, []);

  // =============================================
  // FILTERED DATA
  // =============================================

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
      (project.description?.toLowerCase().includes(projectSearchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredCredentials = credentials.filter((cred) => {
    const matchesSearch = cred.name.toLowerCase().includes(credentialSearchTerm.toLowerCase());
    const matchesProject = filterProject === 'all' || cred.project_id === filterProject;
    const matchesType = filterType === 'all' || cred.type === filterType;
    return matchesSearch && matchesProject && matchesType;
  });

  const filteredAgents = projectAgents.filter((pa) => {
    const matchesProject =
      selectedProjectFilter === 'all' || pa.project_id === selectedProjectFilter;
    const agentCategory = getAgentCategory(pa.ai_agents?.category, pa.ai_agents?.type || '');
    const matchesCategory =
      selectedCategoryFilter === 'all' || agentCategory === selectedCategoryFilter;
    return matchesProject && matchesCategory;
  });

  // Count agents by category
  const categoryStats = projectAgents.reduce(
    (acc, pa) => {
      const category = getAgentCategory(pa.ai_agents?.category, pa.ai_agents?.type || '');
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    },
    {} as Record<AgentCategory, number>
  );

  // =============================================
  // STATS
  // =============================================

  const totalStats = {
    projects: projects.length,
    credentials: credentials.length,
    agents: projectAgents.filter((pa) => pa.is_enabled).length,
    totalAgents: projectAgents.length,
  };

  // =============================================
  // ACTIONS
  // =============================================

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    sonnerToast.success('Đã copy vào clipboard');
  };

  const toggleShowValue = (id: string) => {
    setShowValues((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAgentEnabled = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('project_agents')
        .update({ is_enabled: enabled } as never)
        .eq('id', id);

      if (error) throw error;
      setProjectAgents((prev) =>
        prev.map((pa) => (pa.id === id ? { ...pa, is_enabled: enabled } : pa))
      );
      sonnerToast.success(enabled ? 'Agent đã được bật' : 'Agent đã được tắt');
    } catch (error) {
      console.error('Error toggling agent:', error);
      sonnerToast.error('Không thể cập nhật trạng thái agent');
    }
  };

  const addCredential = async () => {
    try {
      const credentialData = {
        ...newCredential,
        key_preview:
          newCredential.key_value.slice(0, 8) + '...' + newCredential.key_value.slice(-4),
        status: 'active',
      };
      const { error } = await supabase
        .from('project_credentials')
        .insert([credentialData] as never);

      if (error) throw error;
      sonnerToast.success('Thêm credential thành công');
      setIsAddCredentialOpen(false);
      setNewCredential({
        name: '',
        type: 'api_key',
        key_value: '',
        environment: 'production',
        project_id: '',
      });
      fetchCredentials();
    } catch (error) {
      console.error('Error adding credential:', error);
      sonnerToast.error('Không thể thêm credential');
    }
  };

  const deleteCredential = async (id: string) => {
    try {
      const { error } = await supabase.from('project_credentials').delete().eq('id', id);

      if (error) throw error;
      sonnerToast.success('Đã xóa credential');
      fetchCredentials();
    } catch (error) {
      console.error('Error deleting credential:', error);
      sonnerToast.error('Không thể xóa credential');
    }
  };

  // =============================================
  // RENDER
  // =============================================

  const renderLoading = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Command className="h-8 w-8 text-indigo-500" />
            Trung Tâm Dự Án
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý tập trung: Dự án, Credentials, và AI Agents
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-3">
          <Badge variant="outline" className="py-2 px-4 text-lg">
            <FolderKanban className="h-4 w-4 mr-2 text-indigo-500" />
            {totalStats.projects} Dự án
          </Badge>
          <Badge variant="outline" className="py-2 px-4 text-lg">
            <Key className="h-4 w-4 mr-2 text-amber-500" />
            {totalStats.credentials} Keys
          </Badge>
          <Badge variant="outline" className="py-2 px-4 text-lg">
            <Bot className="h-4 w-4 mr-2 text-purple-500" />
            {totalStats.agents}/{totalStats.totalAgents} Agents
          </Badge>
        </div>
      </div>

      {/* Unified Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-14">
          <TabsTrigger
            value="projects"
            className="flex items-center gap-2 text-lg data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
          >
            <FolderKanban className="h-5 w-5" />
            <span className="hidden sm:inline">Quản Lý Dự Án</span>
            <span className="sm:hidden">Dự Án</span>
            <Badge variant="secondary" className="ml-1">
              {totalStats.projects}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="credentials"
            className="flex items-center gap-2 text-lg data-[state=active]:bg-amber-500 data-[state=active]:text-white"
          >
            <Key className="h-5 w-5" />
            <span className="hidden sm:inline">Credentials Vault</span>
            <span className="sm:hidden">Keys</span>
            <Badge variant="secondary" className="ml-1">
              {totalStats.credentials}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="agents"
            className="flex items-center gap-2 text-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white"
          >
            <Bot className="h-5 w-5" />
            <span className="hidden sm:inline">Project Agents</span>
            <span className="sm:hidden">Agents</span>
            <Badge variant="secondary" className="ml-1">
              {totalStats.agents}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ===== PROJECTS TAB ===== */}
        <TabsContent value="projects" className="space-y-6">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm project..."
                value={projectSearchTerm}
                onChange={(e) => setProjectSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'active', 'development', 'paused'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all'
                    ? 'Tất cả'
                    : statusConfig[status as keyof typeof statusConfig]?.label}
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={loadProjects}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              {usingMockData && (
                <Badge variant="outline" className="text-amber-600">
                  <Database className="h-3 w-3 mr-1" />
                  Mock
                </Badge>
              )}
            </div>
          </div>

          {/* Projects Grid */}
          {projectsLoading ? (
            renderLoading()
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => {
                const StatusIcon = statusConfig[project.status]?.icon || CheckCircle;
                const statusStyle = statusConfig[project.status] || statusConfig.active;
                return (
                  <Card
                    key={project.id}
                    className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-indigo-500/50"
                    onClick={() => navigate(`/admin/projects/${project.slug}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div
                          className={`text-4xl p-3 rounded-xl bg-gradient-to-br ${project.color} shadow-lg`}
                        >
                          {project.icon}
                        </div>
                        <Badge
                          variant="outline"
                          className={`${statusStyle.color} text-white border-0`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusStyle.label}
                        </Badge>
                      </div>
                      <CardTitle className="mt-4 group-hover:text-indigo-500 transition-colors">
                        {project.name}
                      </CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-muted rounded-lg">
                          <Key className="h-4 w-4 mx-auto mb-1 text-amber-500" />
                          <p className="text-lg font-semibold">{project.credentials_count}</p>
                          <p className="text-xs text-muted-foreground">Keys</p>
                        </div>
                        <div className="p-2 bg-muted rounded-lg">
                          <Bot className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                          <p className="text-lg font-semibold">{project.agents_count}</p>
                          <p className="text-xs text-muted-foreground">Agents</p>
                        </div>
                        <div className="p-2 bg-muted rounded-lg">
                          <Workflow className="h-4 w-4 mx-auto mb-1 text-green-500" />
                          <p className="text-lg font-semibold">{project.workflows_count}</p>
                          <p className="text-xs text-muted-foreground">Flows</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t">
                        {project.local_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(project.local_url!, '_blank');
                            }}
                          >
                            <Server className="h-4 w-4 mr-1" />
                            Local
                          </Button>
                        )}
                        {project.production_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(project.production_url!, '_blank');
                            }}
                          >
                            <Globe className="h-4 w-4 mr-1" />
                            Live
                          </Button>
                        )}
                        {project.github_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(project.github_url!, '_blank');
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Code
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ===== CREDENTIALS TAB ===== */}
        <TabsContent value="credentials" className="space-y-6">
          {/* Search & Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm credential..."
                value={credentialSearchTerm}
                onChange={(e) => setCredentialSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Lọc theo project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.icon} {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="api_key">API Key</SelectItem>
                <SelectItem value="secret">Secret</SelectItem>
                <SelectItem value="token">Token</SelectItem>
                <SelectItem value="password">Password</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isAddCredentialOpen} onOpenChange={setIsAddCredentialOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Thêm Credential
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm Credential Mới</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Tên</Label>
                    <Input
                      value={newCredential.name}
                      onChange={(e) =>
                        setNewCredential((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="VD: OpenAI API Key"
                    />
                  </div>
                  <div>
                    <Label>Loại</Label>
                    <Select
                      value={newCredential.type}
                      onValueChange={(v) => setNewCredential((prev) => ({ ...prev, type: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="api_key">API Key</SelectItem>
                        <SelectItem value="secret">Secret</SelectItem>
                        <SelectItem value="token">Token</SelectItem>
                        <SelectItem value="password">Password</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Giá trị</Label>
                    <Input
                      type="password"
                      value={newCredential.key_value}
                      onChange={(e) =>
                        setNewCredential((prev) => ({ ...prev, key_value: e.target.value }))
                      }
                      placeholder="sk-..."
                    />
                  </div>
                  <div>
                    <Label>Project</Label>
                    <Select
                      value={newCredential.project_id}
                      onValueChange={(v) =>
                        setNewCredential((prev) => ({ ...prev, project_id: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.icon} {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={addCredential} className="w-full">
                    Thêm Credential
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Credentials List */}
          {credentialsLoading ? (
            renderLoading()
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {filteredCredentials.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">Chưa có credential nào</p>
                      <p className="text-muted-foreground">Thêm credential đầu tiên của bạn</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredCredentials.map((cred) => (
                    <Card key={cred.id} className="hover:border-amber-500/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                              <Key className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{cred.name}</span>
                                <Badge variant="outline">{cred.type}</Badge>
                                <Badge variant={cred.status === 'active' ? 'default' : 'secondary'}>
                                  {cred.status}
                                </Badge>
                                {cred.projects && (
                                  <Badge variant="outline" className="gap-1">
                                    {cred.projects.icon} {cred.projects.name}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <code className="text-sm bg-muted px-2 py-1 rounded">
                                  {showValues[cred.id] ? cred.key_value : cred.key_preview}
                                </code>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleShowValue(cred.id)}
                            >
                              {showValues[cred.id] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(cred.key_value)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500"
                              onClick={() => deleteCredential(cred.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* ===== AGENTS TAB ===== */}
        <TabsContent value="agents" className="space-y-6">
          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {(
              Object.entries(AGENT_CATEGORIES) as [
                AgentCategory,
                (typeof AGENT_CATEGORIES)[AgentCategory],
              ][]
            ).map(([key, cat]) => {
              const count = key === 'all' ? projectAgents.length : categoryStats[key] || 0;
              const isActive = selectedCategoryFilter === key;
              return (
                <Button
                  key={key}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategoryFilter(key)}
                  className={`gap-2 ${isActive ? cat.color + ' text-white border-0' : ''}`}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                  <Badge
                    variant="secondary"
                    className={`ml-1 ${isActive ? 'bg-white/20 text-white' : ''}`}
                  >
                    {count}
                  </Badge>
                </Button>
              );
            })}
          </div>

          {/* Filter Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Select value={selectedProjectFilter} onValueChange={setSelectedProjectFilter}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Lọc theo project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.icon} {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchProjectAgents}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={isAssignAgentOpen} onOpenChange={setIsAssignAgentOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 ml-auto">
                  <Plus className="h-4 w-4" />
                  Gán Agent
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Gán Agent cho Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Project</Label>
                    <Select
                      value={newAssignment.project_id}
                      onValueChange={(v) =>
                        setNewAssignment((prev) => ({ ...prev, project_id: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.icon} {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Agent</Label>
                    <Select
                      value={newAssignment.agent_id}
                      onValueChange={(v) => setNewAssignment((prev) => ({ ...prev, agent_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            🤖 {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Ghi chú</Label>
                    <Textarea
                      value={newAssignment.notes}
                      onChange={(e) =>
                        setNewAssignment((prev) => ({ ...prev, notes: e.target.value }))
                      }
                      placeholder="Ghi chú tùy chọn..."
                    />
                  </div>
                  <Button className="w-full">Gán Agent</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Agents List */}
          {agentsLoading ? (
            renderLoading()
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAgents.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="p-12 text-center">
                    <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">Chưa có agent nào được gán</p>
                    <p className="text-muted-foreground">Gán agent cho project để bắt đầu</p>
                  </CardContent>
                </Card>
              ) : (
                filteredAgents.map((pa) => {
                  const agentCategory = getAgentCategory(
                    pa.ai_agents?.category,
                    pa.ai_agents?.type || ''
                  );
                  const categoryInfo = AGENT_CATEGORIES[agentCategory];
                  return (
                    <Card
                      key={pa.id}
                      className={`transition-all ${pa.is_enabled ? 'border-purple-500/50' : 'opacity-60'}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${pa.is_enabled ? 'bg-purple-100 dark:bg-purple-900' : 'bg-muted'}`}
                            >
                              <Bot
                                className={`h-5 w-5 ${pa.is_enabled ? 'text-purple-600' : 'text-muted-foreground'}`}
                              />
                            </div>
                            <div>
                              <CardTitle className="text-lg">
                                {pa.ai_agents?.name || 'Unknown Agent'}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={`${categoryInfo.color} text-white text-xs`}>
                                  {categoryInfo.icon} {categoryInfo.label}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {pa.ai_agents?.type}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Switch
                            checked={pa.is_enabled}
                            onCheckedChange={(checked) => toggleAgentEnabled(pa.id, checked)}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {pa.projects && (
                          <Badge variant="outline" className="gap-1">
                            {pa.projects.icon} {pa.projects.name}
                          </Badge>
                        )}

                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                          <div className="p-2 bg-muted rounded">
                            <p className="font-semibold text-green-600">{pa.successful_runs}</p>
                            <p className="text-xs text-muted-foreground">Thành công</p>
                          </div>
                          <div className="p-2 bg-muted rounded">
                            <p className="font-semibold text-red-600">{pa.failed_runs}</p>
                            <p className="text-xs text-muted-foreground">Thất bại</p>
                          </div>
                          <div className="p-2 bg-muted rounded">
                            <p className="font-semibold">{pa.total_runs}</p>
                            <p className="text-xs text-muted-foreground">Tổng</p>
                          </div>
                        </div>

                        {pa.schedule_cron && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Lịch: {pa.schedule_cron}</span>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            disabled={!pa.is_enabled}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Chạy
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedProjectCenter;
