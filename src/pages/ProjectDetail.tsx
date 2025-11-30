import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ImagePicker } from "@/components/media";
import {
  ArrowLeft,
  Key,
  Bot,
  Workflow,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Globe,
  GitBranch,
  Server,
  Play,
  Pause,
  RefreshCw,
  Save,
  Database,
  Share2,
  Sparkles
} from "lucide-react";
import { ProjectSocialTab } from "@/components/project/ProjectSocialTab";
import { ProjectPostComposer } from "@/components/project/ProjectPostComposer";
import { AISmartComposer } from "@/components/project/AISmartComposer";
import {
  projectsFullApi,
  type ProjectFullData,
} from "@/lib/api/projects-service";

// Mock data for fallback
const mockProjectData: Record<string, ProjectFullData> = {
  "longsang-portfolio": {
    id: "1",
    slug: "longsang-portfolio",
    name: "Long Sang Portfolio",
    description: "Website portfolio cá nhân với AI integration",
    icon: "🏠",
    color: "from-blue-500 to-indigo-600",
    status: "active",
    local_url: "http://localhost:8081",
    production_url: "https://longsang.com",
    github_url: "https://github.com/longsangsabo2025/longsang-portfolio",
    created_at: "2025-11-01",
    updated_at: "2025-11-25",
    metadata: {},
    credentials: [
      { id: "1", project_id: "1", name: "OpenAI API", type: "api", key_value: "sk-proj-xxxxxxxxxxxx", key_preview: "sk-proj-...xxx", status: "active", environment: "production", expires_at: null, last_used_at: "2025-11-25", last_rotated_at: null, created_at: "2025-11-01", updated_at: "2025-11-25", tags: [] },
      { id: "2", project_id: "1", name: "Supabase", type: "database", key_value: "eyJhbGciOixxxxxx", key_preview: "eyJhbGci...xxx", status: "active", environment: "production", expires_at: null, last_used_at: "2025-11-25", last_rotated_at: null, created_at: "2025-11-01", updated_at: "2025-11-25", tags: [] },
      { id: "3", project_id: "1", name: "Google Service Account", type: "cloud", key_value: "long-sang-automation@xxx", key_preview: "long-sang...xxx", status: "active", environment: "production", expires_at: null, last_used_at: "2025-11-24", last_rotated_at: null, created_at: "2025-11-01", updated_at: "2025-11-24", tags: [] },
    ],
    agents: [
      { id: "1", project_id: "1", name: "Content Writer", description: "Viết nội dung SEO", model: "gpt-4o-mini", provider: "openai", status: "active", system_prompt: null, temperature: 0.7, max_tokens: 4096, total_runs: 156, total_tokens_used: 125000, total_cost_usd: 1.25, last_run_at: "2025-11-25T10:00:00Z", config: {}, created_at: "2025-11-01", updated_at: "2025-11-25" },
      { id: "2", project_id: "1", name: "SEO Optimizer", description: "Tối ưu SEO", model: "gpt-4o-mini", provider: "openai", status: "active", system_prompt: null, temperature: 0.5, max_tokens: 2048, total_runs: 89, total_tokens_used: 45000, total_cost_usd: 0.45, last_run_at: "2025-11-24T15:00:00Z", config: {}, created_at: "2025-11-01", updated_at: "2025-11-24" },
    ],
    workflows: [
      { id: "1", project_id: "1", n8n_workflow_id: "abc123", name: "Contact Form Handler", description: "Xử lý form liên hệ", status: "active", trigger_type: "webhook", webhook_url: "http://localhost:5678/webhook/contact", total_executions: 234, successful_executions: 230, failed_executions: 4, last_execution_at: "2025-11-25T10:30:00Z", last_execution_status: "success", average_execution_time_ms: 1500, config: {}, created_at: "2025-11-01", updated_at: "2025-11-25" },
      { id: "2", project_id: "1", n8n_workflow_id: "def456", name: "Auto Social Post", description: "Tự động đăng bài", status: "active", trigger_type: "schedule", webhook_url: null, total_executions: 156, successful_executions: 150, failed_executions: 6, last_execution_at: "2025-11-25T09:00:00Z", last_execution_status: "success", average_execution_time_ms: 3500, config: {}, created_at: "2025-11-01", updated_at: "2025-11-25" },
    ]
  }
};

const credentialTypeConfig: Record<string, { icon: string; color: string }> = {
  api: { icon: "🔑", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" },
  database: { icon: "🗄️", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" },
  cloud: { icon: "☁️", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100" },
  email: { icon: "📧", color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100" },
  payment: { icon: "💳", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100" },
  deployment: { icon: "🚀", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100" },
  analytics: { icon: "📊", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" },
  cdn: { icon: "🌐", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100" },
  social: { icon: "👥", color: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100" },
  other: { icon: "📦", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100" },
};

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("credentials");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [project, setProject] = useState<ProjectFullData | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);

  // Load project data
  const loadProject = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const data = await projectsFullApi.getFullBySlug(projectId);
      if (data) {
        setProject(data);
        setUsingMockData(false);
      } else {
        // Try mock data
        const mockData = mockProjectData[projectId];
        if (mockData) {
          setProject(mockData);
          setUsingMockData(true);
          toast({
            title: "Sử dụng dữ liệu mẫu",
            description: "Project không tìm thấy trong database. Đang hiển thị dữ liệu mẫu.",
          });
        } else {
          setProject(null);
        }
      }
    } catch (error) {
      console.error("Error loading project:", error);
      // Fallback to mock data
      const mockData = mockProjectData[projectId];
      if (mockData) {
        setProject(mockData);
        setUsingMockData(true);
        toast({
          title: "Không thể kết nối database",
          description: "Đang sử dụng dữ liệu mẫu.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const toggleShowKey = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, name: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Đã copy!", description: `${name} đã được copy vào clipboard` });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-16 w-16 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-xl text-muted-foreground">Project không tồn tại</p>
            <Button className="mt-4" onClick={() => navigate("/admin/projects")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/projects")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className={`text-4xl p-3 rounded-xl bg-gradient-to-br ${project.color} shadow-lg`}>
          {project.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <Badge variant={project.status === "active" ? "default" : "secondary"}>
              {project.status}
            </Badge>
            {usingMockData && (
              <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
                <Database className="h-3 w-3" />
                Mock Data
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadProject}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          {project.local_url && (
            <Button variant="outline" size="sm" onClick={() => window.open(project.local_url!, '_blank')}>
              <Server className="h-4 w-4 mr-1" /> Local
            </Button>
          )}
          {project.production_url && (
            <Button variant="outline" size="sm" onClick={() => window.open(project.production_url!, '_blank')}>
              <Globe className="h-4 w-4 mr-1" /> Live
            </Button>
          )}
          {project.github_url && (
            <Button variant="outline" size="sm" onClick={() => window.open(project.github_url!, '_blank')}>
              <GitBranch className="h-4 w-4 mr-1" /> GitHub
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Key className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-3xl font-bold">{project.credentials.length}</p>
              <p className="text-sm text-muted-foreground">Credentials</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Bot className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-3xl font-bold">{project.agents.length}</p>
              <p className="text-sm text-muted-foreground">AI Agents</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Workflow className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-3xl font-bold">{project.workflows.length}</p>
              <p className="text-sm text-muted-foreground">Workflows</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="credentials" className="gap-2">
            <Key className="h-4 w-4" /> Credentials
          </TabsTrigger>
          <TabsTrigger value="agents" className="gap-2">
            <Bot className="h-4 w-4" /> AI Agents
          </TabsTrigger>
          <TabsTrigger value="workflows" className="gap-2">
            <Workflow className="h-4 w-4" /> Workflows
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <Share2 className="h-4 w-4" /> Social
          </TabsTrigger>
          <TabsTrigger value="ai-compose" className="gap-2">
            <Sparkles className="h-4 w-4" /> AI Compose
          </TabsTrigger>
          <TabsTrigger value="compose" className="gap-2">
            <Play className="h-4 w-4" /> Manual
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" /> Settings
          </TabsTrigger>
        </TabsList>

        {/* Credentials Tab */}
        <TabsContent value="credentials" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">API Keys & Credentials</h3>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Thêm Credential</Button>
          </div>
          <div className="grid gap-3">
            {project.credentials.map((cred) => (
              <Card key={cred.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-sm ${credentialTypeConfig[cred.type]?.color || credentialTypeConfig.other.color}`}>
                        {credentialTypeConfig[cred.type]?.icon || credentialTypeConfig.other.icon} {cred.type}
                      </span>
                      <div>
                        <p className="font-medium">{cred.name}</p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {showKeys[cred.id] ? cred.key_value : (cred.key_preview || "••••••••••••")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={cred.status === "active" ? "default" : "secondary"}>
                        {cred.status}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => toggleShowKey(cred.id)}>
                        {showKeys[cred.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(cred.key_value, cred.name)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Last used: {cred.last_used_at ? new Date(cred.last_used_at).toLocaleDateString('vi-VN') : 'Never'}
                  </p>
                </CardContent>
              </Card>
            ))}
            {project.credentials.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Key className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa có credential nào</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">AI Agents</h3>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Thêm Agent</Button>
          </div>
          <div className="grid gap-3">
            {project.agents.map((agent) => (
              <Card key={agent.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bot className="h-8 w-8 text-purple-500" />
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-muted-foreground">Model: {agent.model} ({agent.provider})</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-semibold">{agent.total_runs}</p>
                        <p className="text-xs text-muted-foreground">runs</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">${agent.total_cost_usd.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">cost</p>
                      </div>
                      <Badge variant={agent.status === "active" ? "default" : "secondary"}>
                        {agent.status}
                      </Badge>
                      <Button variant="ghost" size="icon"><Play className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {project.agents.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa có AI agent nào</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">n8n Workflows</h3>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Thêm Workflow</Button>
          </div>
          <div className="grid gap-3">
            {project.workflows.map((wf) => (
              <Card key={wf.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Workflow className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="font-medium">{wf.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Trigger: {wf.trigger_type} | Last run: {wf.last_execution_at ? new Date(wf.last_execution_at).toLocaleString('vi-VN') : 'Never'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-semibold">{wf.total_executions}</p>
                        <p className="text-xs text-muted-foreground">executions</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-green-600">{wf.successful_executions}</p>
                        <p className="text-xs text-muted-foreground">success</p>
                      </div>
                      <Badge variant={wf.status === "active" ? "default" : "secondary"}>
                        {wf.status}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        {wf.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => window.open('http://localhost:5678', '_blank')}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {project.workflows.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Workflow className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa có workflow nào</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Social Media Tab */}
        <TabsContent value="social" className="space-y-4">
          <ProjectSocialTab projectId={project.id} projectName={project.name} />
        </TabsContent>

        {/* AI Smart Compose Tab - AI adapts content for each platform */}
        <TabsContent value="ai-compose" className="space-y-4">
          <AISmartComposer 
            projectId={project.id} 
            projectName={project.name}
            onPostSuccess={(results) => {
              console.log("AI Compose posted:", results);
            }}
          />
        </TabsContent>

        {/* Manual Compose & Post Tab */}
        <TabsContent value="compose" className="space-y-4">
          <ProjectPostComposer projectId={project.id} projectName={project.name} />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Settings</CardTitle>
              <CardDescription>Cấu hình cho {project.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {/* Project Icon/Thumbnail */}
                <div className="space-y-2">
                  <Label>Project Thumbnail</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Chọn ảnh đại diện cho project (sẽ hiển thị trong danh sách projects)
                  </p>
                  <ImagePicker
                    value={project.metadata?.thumbnail_url}
                    onChange={(url) => {
                      // TODO: Update project metadata
                      console.log('New thumbnail:', url);
                    }}
                    placeholder="Chọn ảnh thumbnail cho project"
                    aspect="video"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Project Name</Label>
                  <Input defaultValue={project.name} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea defaultValue={project.description || ""} />
                </div>
                <div className="space-y-2">
                  <Label>Local URL</Label>
                  <Input defaultValue={project.local_url || ""} />
                </div>
                <div className="space-y-2">
                  <Label>Production URL</Label>
                  <Input defaultValue={project.production_url || ""} />
                </div>
                <div className="space-y-2">
                  <Label>GitHub Repository</Label>
                  <Input defaultValue={project.github_url || ""} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Project Status</Label>
                    <p className="text-sm text-muted-foreground">Enable/disable project</p>
                  </div>
                  <Switch defaultChecked={project.status === "active"} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline">Cancel</Button>
                <Button><Save className="h-4 w-4 mr-1" /> Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetail;
