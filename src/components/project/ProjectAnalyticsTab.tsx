import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  RefreshCw,
  BarChart3,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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

interface Analytics {
  id: string;
  platform: string;
  tracking_id: string;
  property_name: string;
  is_active: boolean;
  notes: string;
  created_at: string;
}

interface ProjectAnalyticsTabProps {
  projectId: string;
}

export function ProjectAnalyticsTab({ projectId }: ProjectAnalyticsTabProps) {
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAnalytics, setNewAnalytics] = useState({
    platform: 'google_analytics',
    tracking_id: '',
    property_name: '',
    is_active: true,
    notes: '',
  });

  useEffect(() => {
    fetchAnalytics();
  }, [projectId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_analytics')
        .select('*')
        .eq('project_id', projectId)
        .order('platform', { ascending: true });

      if (error) throw error;
      setAnalytics(data || []);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast.error('Không thể tải analytics');
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

  const addAnalytics = async () => {
    try {
      const { error } = await supabase.from('project_analytics').insert({
        ...newAnalytics,
        project_id: projectId,
      });

      if (error) throw error;

      toast.success('Đã thêm analytics!');
      setShowAddDialog(false);
      setNewAnalytics({
        platform: 'google_analytics',
        tracking_id: '',
        property_name: '',
        is_active: true,
        notes: '',
      });
      fetchAnalytics();
    } catch (error: any) {
      console.error('Error adding analytics:', error);
      toast.error('Không thể thêm analytics');
    }
  };

  const deleteAnalytics = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa?')) return;

    try {
      const { error } = await supabase.from('project_analytics').delete().eq('id', id);

      if (error) throw error;
      toast.success('Đã xóa!');
      fetchAnalytics();
    } catch (error: any) {
      console.error('Error deleting analytics:', error);
      toast.error('Không thể xóa');
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
          <h3 className="text-lg font-semibold">Analytics & Tracking</h3>
          <p className="text-sm text-muted-foreground">
            Google Analytics, Search Console, và các tracking khác
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Tracking
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Thêm Analytics Tracking</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select
                  value={newAnalytics.platform}
                  onValueChange={(v) => setNewAnalytics({ ...newAnalytics, platform: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google_analytics">Google Analytics 4</SelectItem>
                    <SelectItem value="google_search_console">Google Search Console</SelectItem>
                    <SelectItem value="facebook_pixel">Facebook Pixel</SelectItem>
                    <SelectItem value="hotjar">Hotjar</SelectItem>
                    <SelectItem value="mixpanel">Mixpanel</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tracking ID</Label>
                <Input
                  placeholder="G-XXXXXXXXXX"
                  value={newAnalytics.tracking_id}
                  onChange={(e) =>
                    setNewAnalytics({ ...newAnalytics, tracking_id: e.target.value })
                  }
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Property Name</Label>
                <Input
                  placeholder="My Website"
                  value={newAnalytics.property_name}
                  onChange={(e) =>
                    setNewAnalytics({ ...newAnalytics, property_name: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={newAnalytics.is_active}
                  onChange={(e) =>
                    setNewAnalytics({ ...newAnalytics, is_active: e.target.checked })
                  }
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <Input
                  placeholder="Mô tả thêm..."
                  value={newAnalytics.notes}
                  onChange={(e) => setNewAnalytics({ ...newAnalytics, notes: e.target.value })}
                />
              </div>
              <Button onClick={addAnalytics} className="w-full">
                Thêm Analytics
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Analytics List */}
      {analytics.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có analytics tracking nào</p>
            <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Tracking đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {analytics.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <TrendingUp className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">
                          {item.platform.replace(/_/g, ' ')}
                        </span>
                        <Badge variant={item.is_active ? 'default' : 'secondary'}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.property_name || 'No property name'}
                      </p>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">
                        {item.tracking_id}
                      </code>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(item.tracking_id, item.id)}
                    >
                      {copiedId === item.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteAnalytics(item.id)}
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
