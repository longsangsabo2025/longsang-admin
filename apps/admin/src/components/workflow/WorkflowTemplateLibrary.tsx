import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Search,
  Plus,
  Copy,
  Edit,
  Trash2,
  ExternalLink,
  Workflow,
  Zap,
  Play,
  Pause,
  RefreshCw,
  Download,
  Sparkles,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  AlertCircle,
  Settings,
  Eye,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { TemplateEditor } from './TemplateEditor';

// ============================================================
// TYPES
// ============================================================

interface WorkflowTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  icon: string;
  n8n_template_id: string | null;
  n8n_template_json: object | null;
  config_schema: object;
  default_config: object;
  required_credentials: string[];
  version: string;
  status: 'active' | 'deprecated' | 'draft';
  is_public: boolean;
  clone_count: number;
  created_at: string;
  updated_at: string;
}

interface WorkflowInstance {
  id: string;
  project_id: string;
  template_id: string;
  name: string;
  description: string | null;
  n8n_workflow_id: string | null;
  webhook_url: string | null;
  status: 'active' | 'paused' | 'error' | 'draft';
  is_enabled: boolean;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  last_execution_at: string | null;
  created_at: string;
  projects?: { name: string; slug: string };
  workflow_templates?: { name: string; icon: string };
}

interface Project {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

// ============================================================
// CATEGORY CONFIG
// ============================================================

const CATEGORIES = [
  { id: 'all', label: 'Tất cả', icon: '📋' },
  { id: 'content', label: 'Content', icon: '✍️' },
  { id: 'crm', label: 'CRM/Sales', icon: '💼' },
  { id: 'marketing', label: 'Marketing', icon: '📱' },
  { id: 'customer-service', label: 'Support', icon: '🎧' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'automation', label: 'Automation', icon: '⚡' },
];

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-green-500', icon: CheckCircle2 },
  paused: { label: 'Paused', color: 'bg-yellow-500', icon: Pause },
  error: { label: 'Error', color: 'bg-red-500', icon: AlertCircle },
  draft: { label: 'Draft', color: 'bg-gray-500', icon: Clock },
  deprecated: { label: 'Deprecated', color: 'bg-orange-500', icon: AlertCircle },
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export function WorkflowTemplateLibrary() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [activeTab, setActiveTab] = useState<'templates' | 'instances'>('templates');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [customName, setCustomName] = useState('');

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [editingTemplate, setEditingTemplate] = useState<WorkflowTemplate | null>(null);

  // ============================================================
  // QUERIES
  // ============================================================

  // Fetch templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['workflow-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_templates')
        .select('*')
        .order('category')
        .order('name');

      if (error) throw error;
      return data as WorkflowTemplate[];
    },
  });

  // Fetch instances with project info
  const { data: instances, isLoading: instancesLoading } = useQuery({
    queryKey: ['workflow-instances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_workflow_instances')
        .select(
          `
          *,
          projects:project_id (name, slug),
          workflow_templates:template_id (name, icon)
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WorkflowInstance[];
    },
  });

  // Fetch projects for clone dialog
  const { data: projects } = useQuery({
    queryKey: ['projects-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, slug, icon')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return data as Project[];
    },
  });

  // ============================================================
  // MUTATIONS
  // ============================================================

  // Clone template to project
  const cloneMutation = useMutation({
    mutationFn: async ({
      templateId,
      projectId,
      name,
    }: {
      templateId: string;
      projectId: string;
      name: string;
    }) => {
      const template = templates?.find((t) => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const { data, error } = await supabase
        .from('project_workflow_instances')
        .insert({
          project_id: projectId,
          template_id: templateId,
          name: name,
          description: template.description,
          config: template.default_config,
          status: 'draft',
          is_enabled: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Update clone count
      await supabase
        .from('workflow_templates')
        .update({ clone_count: (template.clone_count || 0) + 1 })
        .eq('id', templateId);

      return data;
    },
    onSuccess: () => {
      toast({
        title: '✅ Clone thành công!',
        description: 'Workflow đã được clone vào project. Vào n8n để configure và activate.',
      });
      queryClient.invalidateQueries({ queryKey: ['workflow-instances'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] });
      setCloneDialogOpen(false);
      setSelectedTemplate(null);
      setSelectedProjectId('');
      setCustomName('');
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Lỗi clone',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Toggle instance status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: string; isEnabled: boolean }) => {
      const { error } = await supabase
        .from('project_workflow_instances')
        .update({ is_enabled: isEnabled, status: isEnabled ? 'active' : 'paused' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-instances'] });
      toast({ title: '✅ Đã cập nhật trạng thái' });
    },
  });

  // Delete instance
  const deleteInstanceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('project_workflow_instances').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-instances'] });
      toast({ title: '✅ Đã xóa workflow instance' });
    },
  });

  // ============================================================
  // FILTER LOGIC
  // ============================================================

  const filteredTemplates = templates?.filter((t) => {
    const matchCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchSearch =
      !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch && t.status !== 'deprecated';
  });

  const filteredInstances = instances?.filter((i) => {
    const matchSearch =
      !searchQuery ||
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.projects?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleClone = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setCustomName(`${template.name}`);
    setCloneDialogOpen(true);
  };

  const handleConfirmClone = () => {
    if (!selectedTemplate || !selectedProjectId) return;

    const project = projects?.find((p) => p.id === selectedProjectId);
    const finalName = customName || `${project?.name} - ${selectedTemplate.name}`;

    cloneMutation.mutate({
      templateId: selectedTemplate.id,
      projectId: selectedProjectId,
      name: finalName,
    });
  };

  const openN8n = (workflowId?: string) => {
    const url = workflowId
      ? `http://localhost:5678/workflow/${workflowId}`
      : 'http://localhost:5678';
    window.open(url, '_blank');
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setEditorMode('create');
    setEditorOpen(true);
  };

  const handleEditTemplate = (template: WorkflowTemplate) => {
    setEditingTemplate(template);
    setEditorMode('edit');
    setEditorOpen(true);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Workflow className="h-6 w-6 text-purple-500" />
            Workflow Library
          </h2>
          <p className="text-muted-foreground">
            Quản lý templates và workflow instances của các projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => openN8n()}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open n8n
          </Button>
          <Button onClick={handleCreateTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo Template
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'templates' | 'instances')}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="templates" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Templates
              <Badge variant="secondary" className="ml-1">
                {templates?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="instances" className="gap-2">
              <Zap className="h-4 w-4" />
              Project Instances
              <Badge variant="secondary" className="ml-1">
                {instances?.length || 0}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Search & View Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-r-none"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-l-none"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6">
          {/* Category Filter */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Templates Grid */}
          {templatesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-3'
              }
            >
              {filteredTemplates?.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  viewMode={viewMode}
                  onClone={() => handleClone(template)}
                  onEdit={() => handleEditTemplate(template)}
                />
              ))}

              {filteredTemplates?.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <Workflow className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Không tìm thấy template nào</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Instances Tab */}
        <TabsContent value="instances" className="mt-6">
          {instancesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInstances?.map((instance) => (
                <InstanceCard
                  key={instance.id}
                  instance={instance}
                  onToggle={(enabled) =>
                    toggleStatusMutation.mutate({ id: instance.id, isEnabled: enabled })
                  }
                  onDelete={() => deleteInstanceMutation.mutate(instance.id)}
                  onOpenN8n={() => openN8n(instance.n8n_workflow_id || undefined)}
                />
              ))}

              {filteredInstances?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Chưa có workflow instance nào</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setActiveTab('templates')}
                  >
                    Clone từ Templates
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Clone Dialog */}
      <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Clone Template: {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              Clone template này vào một project. Workflow sẽ được tạo với trạng thái Draft.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Chọn Project</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="mr-2">{p.icon}</span>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tên Workflow Instance</Label>
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={`${selectedTemplate?.name}`}
              />
              <p className="text-xs text-muted-foreground">
                Để trống sẽ tự động đặt tên: [Project] - [Template]
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCloneDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleConfirmClone}
              disabled={!selectedProjectId || cloneMutation.isPending}
            >
              {cloneMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Clone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Editor Dialog */}
      <TemplateEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editingTemplate}
        mode={editorMode}
      />
    </div>
  );
}

// ============================================================
// TEMPLATE CARD COMPONENT
// ============================================================

function TemplateCard({
  template,
  viewMode,
  onClone,
  onEdit,
}: {
  template: WorkflowTemplate;
  viewMode: 'grid' | 'list';
  onClone: () => void;
  onEdit: () => void;
}) {
  const statusConfig = STATUS_CONFIG[template.status];
  const _StatusIcon = statusConfig.icon;

  if (viewMode === 'list') {
    return (
      <Card className="hover:border-primary/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-3xl">{template.icon}</div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{template.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    v{template.version}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">{template.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Copy className="h-3 w-3" />
                {template.clone_count}
              </Badge>
              <Button variant="outline" size="sm" onClick={onClone}>
                <Copy className="h-4 w-4 mr-1" />
                Clone
              </Button>
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:border-primary/50 transition-colors group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{template.icon}</div>
            <div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {template.category}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  v{template.version}
                </Badge>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Eye className="h-4 w-4 mr-2" />
                Xem JSON
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Export
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {template.description || 'Không có mô tả'}
        </p>

        {/* Required Credentials */}
        {template.required_credentials?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {template.required_credentials.map((cred) => (
              <Badge key={cred} variant="secondary" className="text-xs">
                🔑 {cred}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Copy className="h-4 w-4" />
            {template.clone_count} clones
          </div>
          <Button size="sm" onClick={onClone}>
            <Copy className="h-4 w-4 mr-1" />
            Clone to Project
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// ============================================================
// INSTANCE CARD COMPONENT
// ============================================================

function InstanceCard({
  instance,
  onToggle,
  onDelete,
  onOpenN8n,
}: {
  instance: WorkflowInstance;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
  onOpenN8n: () => void;
}) {
  const statusConfig = STATUS_CONFIG[instance.status];
  const _StatusIcon = statusConfig.icon;
  const successRate =
    instance.total_executions > 0
      ? Math.round((instance.successful_executions / instance.total_executions) * 100)
      : 0;

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div
              className={`p-2 rounded-lg ${
                instance.is_enabled ? 'bg-green-500/10' : 'bg-gray-500/10'
              }`}
            >
              <Workflow
                className={`h-6 w-6 ${instance.is_enabled ? 'text-green-500' : 'text-gray-500'}`}
              />
            </div>

            {/* Info */}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{instance.name}</h3>
                <Badge className={`${statusConfig.color} text-white text-xs`}>
                  {statusConfig.label}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  📁 {instance.projects?.name || 'Unknown'}
                </span>
                <span>•</span>
                <span>{instance.total_executions} runs</span>
                {instance.total_executions > 0 && (
                  <>
                    <span>•</span>
                    <span
                      className={
                        successRate >= 90
                          ? 'text-green-500'
                          : successRate >= 70
                            ? 'text-yellow-500'
                            : 'text-red-500'
                      }
                    >
                      {successRate}% success
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Webhook URL */}
            {instance.webhook_url && (
              <Badge variant="outline" className="font-mono text-xs max-w-[200px] truncate">
                {instance.webhook_url}
              </Badge>
            )}

            {/* Toggle */}
            <Button variant="ghost" size="icon" onClick={() => onToggle(!instance.is_enabled)}>
              {instance.is_enabled ? (
                <Pause className="h-4 w-4 text-yellow-500" />
              ) : (
                <Play className="h-4 w-4 text-green-500" />
              )}
            </Button>

            {/* Open n8n */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenN8n}
              disabled={!instance.n8n_workflow_id}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>

            {/* More Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onOpenN8n}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in n8n
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync with n8n
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default WorkflowTemplateLibrary;
