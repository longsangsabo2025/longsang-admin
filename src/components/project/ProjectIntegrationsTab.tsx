import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  RefreshCw, 
  Plug,
  ExternalLink,
  Trash2,
  Check,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Integration {
  id: string;
  platform: string;
  integration_type: string;
  config: any;
  is_active: boolean;
  notes: string;
  created_at: string;
}

interface ProjectIntegrationsTabProps {
  projectId: string;
}

export function ProjectIntegrationsTab({ projectId }: ProjectIntegrationsTabProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newIntegration, setNewIntegration] = useState({
    platform: "vercel",
    integration_type: "hosting",
    is_active: true,
    notes: ""
  });

  useEffect(() => {
    fetchIntegrations();
  }, [projectId]);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("project_integrations")
        .select("*")
        .eq("project_id", projectId)
        .order("platform", { ascending: true });

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error: any) {
      console.error("Error fetching integrations:", error);
      toast.error("Không thể tải integrations");
    } finally {
      setLoading(false);
    }
  };

  const addIntegration = async () => {
    try {
      const { error } = await supabase
        .from("project_integrations")
        .insert({
          ...newIntegration,
          project_id: projectId,
          config: {}
        });

      if (error) throw error;
      
      toast.success("Đã thêm integration!");
      setShowAddDialog(false);
      setNewIntegration({
        platform: "vercel",
        integration_type: "hosting",
        is_active: true,
        notes: ""
      });
      fetchIntegrations();
    } catch (error: any) {
      console.error("Error adding integration:", error);
      toast.error("Không thể thêm integration");
    }
  };

  const deleteIntegration = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa?")) return;
    
    try {
      const { error } = await supabase
        .from("project_integrations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Đã xóa!");
      fetchIntegrations();
    } catch (error: any) {
      console.error("Error deleting integration:", error);
      toast.error("Không thể xóa");
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("project_integrations")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success(currentStatus ? "Đã tắt" : "Đã bật");
      fetchIntegrations();
    } catch (error: any) {
      console.error("Error toggling integration:", error);
      toast.error("Không thể cập nhật");
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
          <h3 className="text-lg font-semibold">Integrations</h3>
          <p className="text-sm text-muted-foreground">
            Kết nối với các platform bên ngoài
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Thêm Integration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select 
                  value={newIntegration.platform}
                  onValueChange={(v) => setNewIntegration({...newIntegration, platform: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vercel">Vercel</SelectItem>
                    <SelectItem value="supabase">Supabase</SelectItem>
                    <SelectItem value="cloudflare">Cloudflare</SelectItem>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="n8n">n8n</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  value={newIntegration.integration_type}
                  onValueChange={(v) => setNewIntegration({...newIntegration, integration_type: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hosting">Hosting</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="cdn">CDN</SelectItem>
                    <SelectItem value="ci_cd">CI/CD</SelectItem>
                    <SelectItem value="automation">Automation</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="is_active"
                  checked={newIntegration.is_active}
                  onChange={(e) => setNewIntegration({...newIntegration, is_active: e.target.checked})}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <Input 
                  placeholder="Mô tả thêm..."
                  value={newIntegration.notes}
                  onChange={(e) => setNewIntegration({...newIntegration, notes: e.target.value})}
                />
              </div>
              <Button onClick={addIntegration} className="w-full">
                Thêm Integration
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Integrations List */}
      {integrations.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Plug className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có integration nào</p>
            <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Integration đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {integrations.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      item.is_active ? "bg-green-500/10" : "bg-gray-500/10"
                    }`}>
                      <Plug className={`h-5 w-5 ${
                        item.is_active ? "text-green-500" : "text-gray-500"
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{item.platform}</span>
                        <Badge variant={item.is_active ? "default" : "secondary"}>
                          {item.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {item.integration_type.replace(/_/g, " ")}
                      </Badge>
                      {item.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => toggleActive(item.id, item.is_active)}
                    >
                      {item.is_active ? (
                        <X className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteIntegration(item.id)}
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
