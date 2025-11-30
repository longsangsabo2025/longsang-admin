import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Workflow,
  Copy,
  Search,
  Play,
  Pause,
  Settings,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  ExternalLink,
  LayoutTemplate,
  FolderOpen,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  icon: string;
  required_credentials: string[];
  default_config: Record<string, unknown>;
  config_schema: Record<string, unknown>;
  version: string;
  status: string;
  clone_count: number;
  created_at: string;
}

interface WorkflowInstance {
  id: string;
  project_id: string;
  template_id: string;
  name: string;
  description: string;
  n8n_workflow_id: string | null;
  webhook_url: string | null;
  config: Record<string, unknown>;
  credential_mappings: Record<string, string>;
  is_enabled: boolean;
  schedule_cron: string | null;
  auto_trigger_events: string[] | null;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  last_execution_at: string | null;
  last_execution_status: string | null;
  status: string;
  created_at: string;
  projects?: Project;
  workflow_templates?: WorkflowTemplate;
}

const WorkflowManager = () => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(false);
  const [activeTab, setActiveTab] = useState("instances");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProject, setFilterProject] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  
  // Clone dialog
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [cloneProjectId, setCloneProjectId] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);

      // Fetch templates
      const { data: tData } = await supabase
        .from("workflow_templates")
        .select("*")
        .order("category", { ascending: true });
      setTemplates(tData || []);

      // Fetch instances with joins
      const { data: iData } = await supabase
        .from("project_workflow_instances")
        .select("*, projects(id, name, slug, icon), workflow_templates(id, name, slug, icon, category)")
        .order("created_at", { ascending: false });
      setInstances(iData || []);

      // Fetch projects
      const { data: pData } = await supabase
        .from("projects")
        .select("id, name, slug, icon")
        .order("name");
      setProjects(pData || []);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const cloneTemplateToProject = async () => {
    if (!selectedTemplate || !cloneProjectId) {
      toast.error("Vui lòng chọn project");
      return;
    }

    const project = projects.find(p => p.id === cloneProjectId);
    if (!project) return;

    try {
      // Check if already exists
      const existing = instances.find(
        i => i.project_id === cloneProjectId && i.template_id === selectedTemplate.id
      );
      if (existing) {
        toast.error("Project này đã có workflow này rồi");
        return;
      }

      setCloning(true);
      toast.info("🔄 Đang clone workflow tới n8n...");

      // Call API to clone workflow to n8n
      const response = await fetch("/api/n8n/workflows/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: cloneProjectId,
          template_slug: selectedTemplate.slug,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Clone failed");
      }

      // Update clone count
      await supabase
        .from("workflow_templates")
        .update({ clone_count: selectedTemplate.clone_count + 1 })
        .eq("id", selectedTemplate.id);

      if (result.n8nWorkflowId) {
        toast.success(`✅ Đã clone và sync tới n8n! ID: ${result.n8nWorkflowId}`);
      } else {
        toast.success(`✅ Đã clone "${selectedTemplate.name}" cho ${project.name} (DB only)`);
      }
      
      setIsCloneDialogOpen(false);
      setSelectedTemplate(null);
      setCloneProjectId("");
      fetchAll();
    } catch (error) {
      console.error("Error cloning template:", error);
      toast.error(`Không thể clone: ${error instanceof Error ? error.message : "Unknown"}`);
    } finally {
      setCloning(false);
    }
  };

  const toggleInstance = async (id: string, currentEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from("project_workflow_instances")
        .update({ is_enabled: !currentEnabled })
        .eq("id", id);

      if (error) throw error;
      toast.success(currentEnabled ? "Đã tắt workflow" : "Đã bật workflow");
      fetchAll();
    } catch (error) {
      console.error("Error toggling instance:", error);
    }
  };

  const deleteInstance = async (id: string, name: string) => {
    if (!confirm(`Xóa workflow "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from("project_workflow_instances")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Đã xóa workflow");
      fetchAll();
    } catch (error) {
      console.error("Error deleting instance:", error);
    }
  };

  const executeWorkflow = async (instance: WorkflowInstance) => {
    toast.info(`🚀 Đang chạy ${instance.name}...`);

    try {
      if (instance.n8n_workflow_id) {
        // Call real n8n workflow
        const response = await fetch(`/api/n8n/workflows/${instance.n8n_workflow_id}/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: instance.project_id,
            instance_id: instance.id,
            instance_name: instance.name,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Execution failed");
        }

        const result = await response.json();
        
        await supabase
          .from("project_workflow_instances")
          .update({
            total_executions: instance.total_executions + 1,
            successful_executions: instance.successful_executions + 1,
            last_execution_at: new Date().toISOString(),
            last_execution_status: "success",
          })
          .eq("id", instance.id);

        toast.success(`✅ ${instance.name} hoàn thành! Execution: ${result.executionId}`);
      } else {
        // Mock execution
        await new Promise(resolve => setTimeout(resolve, 2000));

        await supabase
          .from("project_workflow_instances")
          .update({
            total_executions: instance.total_executions + 1,
            successful_executions: instance.successful_executions + 1,
            last_execution_at: new Date().toISOString(),
            last_execution_status: "success",
          })
          .eq("id", instance.id);

        toast.success(`✅ ${instance.name} hoàn thành! (Mock run - no n8n workflow)`);
      }

      fetchAll();
    } catch (error) {
      console.error("Error executing workflow:", error);
      
      await supabase
        .from("project_workflow_instances")
        .update({
          total_executions: instance.total_executions + 1,
          failed_executions: instance.failed_executions + 1,
          last_execution_at: new Date().toISOString(),
          last_execution_status: "failed",
        })
        .eq("id", instance.id);

      toast.error(`Workflow failed: ${error instanceof Error ? error.message : "Unknown"}`);
      fetchAll();
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      content: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      crm: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      marketing: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      analytics: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "customer-service": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  // Filter instances
  const filteredInstances = instances.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = filterProject === "all" || i.project_id === filterProject;
    return matchesSearch && matchesProject;
  });

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Group instances by project
  const groupedByProject = filteredInstances.reduce((acc, inst) => {
    const projectName = inst.projects?.name || "Unknown";
    if (!acc[projectName]) {
      acc[projectName] = { project: inst.projects, instances: [] };
    }
    acc[projectName].instances.push(inst);
    return acc;
  }, {} as Record<string, { project: Project | undefined; instances: WorkflowInstance[] }>);

  const uniqueCategories = [...new Set(templates.map(t => t.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Workflow className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Workflow Manager</h1>
            <p className="text-muted-foreground">
              {templates.length} templates • {instances.length} instances
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="instances" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Project Workflows ({instances.length})
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <LayoutTemplate className="h-4 w-4" />
            Templates ({templates.length})
          </TabsTrigger>
        </TabsList>

        {/* ============ INSTANCES TAB ============ */}
        <TabsContent value="instances" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search workflows..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.icon} {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={fetchAll}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instances by Project */}
          {Object.entries(groupedByProject).map(([projectName, { project, instances: insts }]) => (
            <Card key={projectName}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{project?.icon || "📁"}</span>
                  {projectName}
                  <Badge variant="secondary">{insts.length} workflows</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insts.map((inst) => (
                    <div
                      key={inst.id}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                        inst.is_enabled
                          ? "bg-muted/50 border-border"
                          : "bg-muted/20 border-muted opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-2xl">{inst.workflow_templates?.icon || "⚙️"}</span>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{inst.name}</span>
                            <Badge className={getCategoryColor(inst.workflow_templates?.category || "")}>
                              {inst.workflow_templates?.category}
                            </Badge>
                            {inst.n8n_workflow_id && (
                              <Badge variant="outline" className="gap-1">
                                <ExternalLink className="h-3 w-3" />
                                n8n
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {inst.description?.slice(0, 60)}...
                          </p>
                          {inst.auto_trigger_events && inst.auto_trigger_events.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              <Zap className="h-3 w-3 text-yellow-500" />
                              {inst.auto_trigger_events.map((e) => (
                                <Badge key={e} variant="secondary" className="text-xs">
                                  {e}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="text-right text-sm hidden md:block">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              {inst.successful_executions}
                            </span>
                            <span className="flex items-center gap-1">
                              <XCircle className="h-4 w-4 text-red-500" />
                              {inst.failed_executions}
                            </span>
                          </div>
                          {inst.last_execution_at && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-1">
                              <Clock className="h-3 w-3" />
                              {new Date(inst.last_execution_at).toLocaleString("vi-VN")}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant={inst.is_enabled ? "default" : "secondary"}
                          size="sm"
                          onClick={() => executeWorkflow(inst)}
                          disabled={!inst.is_enabled}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Run
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleInstance(inst.id, inst.is_enabled)}
                        >
                          {inst.is_enabled ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteInstance(inst.id, inst.name)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredInstances.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No workflows found</h3>
                <p className="text-muted-foreground">
                  Clone a template to get started
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ============ TEMPLATES TAB ============ */}
        <TabsContent value="templates" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {uniqueCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{template.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge className={getCategoryColor(template.category)}>
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant="outline">v{template.version}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {template.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    <span className="text-xs text-muted-foreground">Requires:</span>
                    {template.required_credentials?.map((cred) => (
                      <Badge key={cred} variant="secondary" className="text-xs">
                        {cred}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {template.clone_count} clones
                    </span>
                    <Dialog 
                      open={isCloneDialogOpen && selectedTemplate?.id === template.id}
                      onOpenChange={(open) => {
                        setIsCloneDialogOpen(open);
                        if (!open) setSelectedTemplate(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button 
                          size="sm"
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Clone to Project
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Clone "{template.name}"</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Select Project</Label>
                            <Select value={cloneProjectId} onValueChange={setCloneProjectId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn project..." />
                              </SelectTrigger>
                              <SelectContent>
                                {projects.map((p) => {
                                  const hasInstance = instances.some(
                                    i => i.project_id === p.id && i.template_id === template.id
                                  );
                                  return (
                                    <SelectItem 
                                      key={p.id} 
                                      value={p.id}
                                      disabled={hasInstance}
                                    >
                                      {p.icon} {p.name}
                                      {hasInstance && " (đã có)"}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="bg-muted p-3 rounded-lg text-sm">
                            <p className="font-medium mb-2">Required credentials:</p>
                            <div className="flex flex-wrap gap-1">
                              {template.required_credentials?.map((cred) => (
                                <Badge key={cred} variant="outline">
                                  {cred}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <Button 
                            onClick={cloneTemplateToProject}
                            disabled={!cloneProjectId || cloning}
                            className="w-full"
                          >
                            {cloning ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Copy className="h-4 w-4 mr-2" />
                            )}
                            {cloning ? "Đang clone..." : "Clone Template"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkflowManager;
