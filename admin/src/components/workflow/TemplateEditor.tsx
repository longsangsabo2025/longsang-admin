import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Code, FileJson, Plus, RefreshCw, Save, Settings, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// ============================================================
// TYPES
// ============================================================

interface WorkflowTemplate {
  id?: string;
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
}

interface TemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: WorkflowTemplate | null;
  mode: 'create' | 'edit';
}

// ============================================================
// CONSTANTS
// ============================================================

const CATEGORIES = [
  { id: 'content', label: 'Content', icon: '✍️' },
  { id: 'crm', label: 'CRM/Sales', icon: '💼' },
  { id: 'marketing', label: 'Marketing', icon: '📱' },
  { id: 'customer-service', label: 'Support', icon: '🎧' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'automation', label: 'Automation', icon: '⚡' },
  { id: 'integration', label: 'Integration', icon: '🔗' },
  { id: 'notification', label: 'Notification', icon: '🔔' },
];

const ICONS = [
  '⚙️',
  '✍️',
  '💼',
  '📱',
  '🎧',
  '📊',
  '⚡',
  '🔗',
  '🔔',
  '🤖',
  '📧',
  '💰',
  '🎯',
  '🚀',
  '💡',
  '🔥',
];

const CREDENTIAL_TYPES = [
  'openai',
  'anthropic',
  'google',
  'supabase',
  'postgres',
  'mysql',
  'gmail',
  'sendgrid',
  'mailchimp',
  'slack',
  'discord',
  'telegram',
  'facebook',
  'linkedin',
  'twitter',
  'stripe',
  'paypal',
  'shopify',
  'wordpress',
  'notion',
  'airtable',
  'github',
  'gitlab',
  'aws',
  'gcp',
  'azure',
];

// ============================================================
// COMPONENT
// ============================================================

export function TemplateEditor({ open, onOpenChange, template, mode }: TemplateEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState<Partial<WorkflowTemplate>>({
    name: '',
    slug: '',
    description: '',
    category: 'automation',
    icon: '⚙️',
    n8n_template_json: null,
    config_schema: {},
    default_config: {},
    required_credentials: [],
    version: '1.0.0',
    status: 'draft',
    is_public: true,
  });

  const [jsonInput, setJsonInput] = useState('');
  const [configSchemaInput, setConfigSchemaInput] = useState('{}');
  const [defaultConfigInput, setDefaultConfigInput] = useState('{}');
  const [selectedCredentials, setSelectedCredentials] = useState<string[]>([]);

  // Initialize form when template changes
  useEffect(() => {
    if (template && mode === 'edit') {
      setFormData(template);
      setJsonInput(
        template.n8n_template_json ? JSON.stringify(template.n8n_template_json, null, 2) : ''
      );
      setConfigSchemaInput(JSON.stringify(template.config_schema || {}, null, 2));
      setDefaultConfigInput(JSON.stringify(template.default_config || {}, null, 2));
      setSelectedCredentials(template.required_credentials || []);
    } else {
      // Reset for create mode
      setFormData({
        name: '',
        slug: '',
        description: '',
        category: 'automation',
        icon: '⚙️',
        n8n_template_json: null,
        config_schema: {},
        default_config: {},
        required_credentials: [],
        version: '1.0.0',
        status: 'draft',
        is_public: true,
      });
      setJsonInput('');
      setConfigSchemaInput('{}');
      setDefaultConfigInput('{}');
      setSelectedCredentials([]);
    }
  }, [template, mode, open]);

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    setFormData({ ...formData, name, slug });
  };

  // Toggle credential selection
  const toggleCredential = (cred: string) => {
    setSelectedCredentials((prev) =>
      prev.includes(cred) ? prev.filter((c) => c !== cred) : [...prev, cred]
    );
  };

  // Validate JSON
  const validateJson = (input: string): object | null => {
    if (!input.trim()) return null;
    try {
      return JSON.parse(input);
    } catch {
      return null;
    }
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<WorkflowTemplate>) => {
      // Parse JSON fields
      const n8n_template_json = validateJson(jsonInput);
      const config_schema = validateJson(configSchemaInput) || {};
      const default_config = validateJson(defaultConfigInput) || {};

      const templateData = {
        ...data,
        n8n_template_json,
        config_schema,
        default_config,
        required_credentials: selectedCredentials,
      };

      if (mode === 'edit' && template?.id) {
        const { data: result, error } = await supabase
          .from('workflow_templates')
          .update(templateData)
          .eq('id', template.id)
          .select()
          .single();

        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('workflow_templates')
          .insert(templateData)
          .select()
          .single();

        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      toast({
        title: mode === 'create' ? '✅ Template đã tạo!' : '✅ Template đã cập nhật!',
        description: 'Workflow template đã được lưu thành công.',
      });
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Lỗi',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.name?.trim()) {
      toast({
        title: '❌ Thiếu thông tin',
        description: 'Vui lòng nhập tên template',
        variant: 'destructive',
      });
      return;
    }

    // Validate JSON if provided
    if (jsonInput.trim() && !validateJson(jsonInput)) {
      toast({
        title: '❌ JSON không hợp lệ',
        description: 'Workflow JSON không đúng định dạng',
        variant: 'destructive',
      });
      return;
    }

    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'create' ? (
              <>
                <Plus className="h-5 w-5" />
                Tạo Template Mới
              </>
            ) : (
              <>
                <Settings className="h-5 w-5" />
                Chỉnh sửa: {template?.name}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Tạo workflow template mới để sử dụng cho các projects'
              : 'Chỉnh sửa thông tin và cấu hình của template'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">
              <Settings className="h-4 w-4 mr-2" />
              Thông tin
            </TabsTrigger>
            <TabsTrigger value="workflow">
              <FileJson className="h-4 w-4 mr-2" />
              Workflow JSON
            </TabsTrigger>
            <TabsTrigger value="config">
              <Code className="h-4 w-4 mr-2" />
              Config Schema
            </TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tên Template *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Content Writer Agent"
                />
              </div>

              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="content-writer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả chức năng của workflow template..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="mr-2">{cat.icon}</span>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Icon</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(v) => setFormData({ ...formData, icon: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="grid grid-cols-4 gap-1 p-1">
                      {ICONS.map((icon) => (
                        <SelectItem key={icon} value={icon} className="cursor-pointer">
                          <span className="text-xl">{icon}</span>
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Version</Label>
                <Input
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="1.0.0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Required Credentials</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-md">
                {CREDENTIAL_TYPES.map((cred) => (
                  <Badge
                    key={cred}
                    variant={selectedCredentials.includes(cred) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleCredential(cred)}
                  >
                    🔑 {cred}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Click để chọn/bỏ chọn credentials cần thiết cho workflow
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v: 'active' | 'deprecated' | 'draft') =>
                    setFormData({ ...formData, status: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="deprecated">Deprecated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Workflow JSON Tab */}
          <TabsContent value="workflow" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>n8n Workflow JSON</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Sparkles className="h-4 w-4 mr-1" />
                    Generate với AI
                  </Button>
                </div>
              </div>
              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{"nodes": [...], "connections": {...}}'
                rows={15}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Paste workflow JSON từ n8n export hoặc để AI generate
              </p>
            </div>
          </TabsContent>

          {/* Config Schema Tab */}
          <TabsContent value="config" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Config Schema (JSON Schema)</Label>
              <Textarea
                value={configSchemaInput}
                onChange={(e) => setConfigSchemaInput(e.target.value)}
                placeholder='{"type": "object", "properties": {...}}'
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Định nghĩa schema cho các config options của template
              </p>
            </div>

            <div className="space-y-2">
              <Label>Default Config</Label>
              <Textarea
                value={defaultConfigInput}
                onChange={(e) => setDefaultConfigInput(e.target.value)}
                placeholder='{"key": "value"}'
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Giá trị mặc định cho các config options
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {mode === 'create' ? 'Tạo Template' : 'Lưu thay đổi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TemplateEditor;
