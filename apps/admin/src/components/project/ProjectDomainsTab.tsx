import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, RefreshCw, Globe, ExternalLink, Copy, Check, Trash2 } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Domain {
  id: string;
  domain: string;
  environment: string;
  is_primary: boolean;
  ssl_enabled: boolean;
  notes: string;
  created_at: string;
}

interface ProjectDomainsTabProps {
  projectId: string;
}

export function ProjectDomainsTab({ projectId }: ProjectDomainsTabProps) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDomain, setNewDomain] = useState({
    domain: '',
    environment: 'production',
    is_primary: false,
    ssl_enabled: true,
    notes: '',
  });

  // Check if using fallback project (not in database)
  const isFallback = projectId.startsWith('fallback-');

  useEffect(() => {
    if (!isFallback) {
      fetchDomains();
    } else {
      setLoading(false);
    }
  }, [projectId, isFallback]);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseAdmin
        .from('project_domains')
        .select('*')
        .eq('project_id', projectId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setDomains(data || []);
    } catch (error: any) {
      console.error('Error fetching domains:', error);
      toast.error('Không thể tải domains');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (value: string, id: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      toast.success('Đã copy!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Không thể copy');
    }
  };

  const addDomain = async () => {
    try {
      const { error } = await supabaseAdmin.from('project_domains').insert({
        ...newDomain,
        project_id: projectId,
      });

      if (error) throw error;

      toast.success('Đã thêm domain!');
      setShowAddDialog(false);
      setNewDomain({
        domain: '',
        environment: 'production',
        is_primary: false,
        ssl_enabled: true,
        notes: '',
      });
      fetchDomains();
    } catch (error: any) {
      console.error('Error adding domain:', error);
      toast.error('Không thể thêm domain');
    }
  };

  const deleteDomain = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa domain này?')) return;

    try {
      const { error } = await supabaseAdmin.from('project_domains').delete().eq('id', id);

      if (error) throw error;
      toast.success('Đã xóa domain!');
      fetchDomains();
    } catch (error: any) {
      console.error('Error deleting domain:', error);
      toast.error('Không thể xóa domain');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Domains & URLs</h3>
          <p className="text-sm text-muted-foreground">Quản lý tất cả domains và URLs của dự án</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Domain
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Thêm Domain Mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Domain/URL</Label>
                <Input
                  placeholder="https://example.com"
                  value={newDomain.domain}
                  onChange={(e) => setNewDomain({ ...newDomain, domain: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Environment</Label>
                <Select
                  value={newDomain.environment}
                  onValueChange={(v) => setNewDomain({ ...newDomain, environment: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="preview">Preview</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_primary"
                  checked={newDomain.is_primary}
                  onChange={(e) => setNewDomain({ ...newDomain, is_primary: e.target.checked })}
                />
                <Label htmlFor="is_primary">Domain chính</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ssl_enabled"
                  checked={newDomain.ssl_enabled}
                  onChange={(e) => setNewDomain({ ...newDomain, ssl_enabled: e.target.checked })}
                />
                <Label htmlFor="ssl_enabled">SSL Enabled</Label>
              </div>
              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <Input
                  placeholder="Vercel, Cloudflare..."
                  value={newDomain.notes}
                  onChange={(e) => setNewDomain({ ...newDomain, notes: e.target.value })}
                />
              </div>
              <Button onClick={addDomain} className="w-full">
                Thêm Domain
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Domains List */}
      {domains.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có domain nào</p>
            <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Domain đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {domains.map((domain) => (
            <Card key={domain.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Globe className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{domain.domain}</span>
                        {domain.is_primary && <Badge variant="default">Primary</Badge>}
                        {domain.ssl_enabled && (
                          <Badge variant="outline" className="text-green-500">
                            🔒 SSL
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{domain.environment}</Badge>
                        {domain.notes && (
                          <span className="text-sm text-muted-foreground">{domain.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(domain.domain, domain.id)}
                    >
                      {copiedId === domain.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(domain.domain, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteDomain(domain.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
