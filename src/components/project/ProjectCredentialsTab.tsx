import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Copy, 
  Eye, 
  EyeOff, 
  Plus, 
  RefreshCw, 
  Key,
  Check,
  Trash2,
  Edit,
  Download
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Credential {
  id: string;
  name: string;
  service: string;
  key_type: string;
  value: string;
  environment: string;
  notes: string;
  created_at: string;
  project_id: string;
}

interface ProjectCredentialsTabProps {
  projectId: string;
  projectSlug: string;
}

export function ProjectCredentialsTab({ projectId, projectSlug }: ProjectCredentialsTabProps) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCredential, setNewCredential] = useState({
    name: "",
    service: "",
    key_type: "api_key",
    value: "",
    environment: "production",
    notes: ""
  });

  useEffect(() => {
    fetchCredentials();
  }, [projectId]);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("credentials_vault")
        .select("*")
        .eq("project_id", projectId)
        .order("service", { ascending: true });

      if (error) throw error;
      setCredentials(data || []);
    } catch (error: any) {
      console.error("Error fetching credentials:", error);
      toast.error("Không thể tải credentials");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (value: string, id: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      toast.success("Đã copy vào clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error("Không thể copy");
    }
  };

  const copyAllAsEnv = async () => {
    const envContent = credentials
      .map(c => `# ${c.name} (${c.service})\n${c.name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}=${c.value}`)
      .join('\n\n');
    
    try {
      await navigator.clipboard.writeText(envContent);
      toast.success("Đã copy tất cả credentials dạng .env!");
    } catch (error) {
      toast.error("Không thể copy");
    }
  };

  const addCredential = async () => {
    try {
      const { error } = await supabase
        .from("credentials_vault")
        .insert({
          ...newCredential,
          project_id: projectId
        });

      if (error) throw error;
      
      toast.success("Đã thêm credential mới!");
      setShowAddDialog(false);
      setNewCredential({
        name: "",
        service: "",
        key_type: "api_key",
        value: "",
        environment: "production",
        notes: ""
      });
      fetchCredentials();
    } catch (error: any) {
      console.error("Error adding credential:", error);
      toast.error("Không thể thêm credential");
    }
  };

  const deleteCredential = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa credential này?")) return;
    
    try {
      const { error } = await supabase
        .from("credentials_vault")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Đã xóa credential!");
      fetchCredentials();
    } catch (error: any) {
      console.error("Error deleting credential:", error);
      toast.error("Không thể xóa credential");
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
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">API Keys & Credentials</h3>
          <p className="text-sm text-muted-foreground">
            Tất cả keys hiển thị FULL, dễ dàng copy - chỉ dùng cho local development
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyAllAsEnv}>
            <Download className="h-4 w-4 mr-2" />
            Copy .env
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Thêm Key
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Thêm Credential Mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tên</Label>
                  <Input 
                    placeholder="SUPABASE_URL"
                    value={newCredential.name}
                    onChange={(e) => setNewCredential({...newCredential, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Service</Label>
                  <Input 
                    placeholder="Supabase, Google, Vercel..."
                    value={newCredential.service}
                    onChange={(e) => setNewCredential({...newCredential, service: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Loại</Label>
                  <Select 
                    value={newCredential.key_type}
                    onValueChange={(v) => setNewCredential({...newCredential, key_type: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="api_key">API Key</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                      <SelectItem value="secret">Secret</SelectItem>
                      <SelectItem value="token">Token</SelectItem>
                      <SelectItem value="password">Password</SelectItem>
                      <SelectItem value="service_account">Service Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Environment</Label>
                  <Select 
                    value={newCredential.environment}
                    onValueChange={(v) => setNewCredential({...newCredential, environment: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value (FULL KEY)</Label>
                  <Textarea 
                    placeholder="Paste full key here..."
                    value={newCredential.value}
                    onChange={(e) => setNewCredential({...newCredential, value: e.target.value})}
                    className="font-mono text-sm"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ghi chú</Label>
                  <Input 
                    placeholder="Mô tả thêm..."
                    value={newCredential.notes}
                    onChange={(e) => setNewCredential({...newCredential, notes: e.target.value})}
                  />
                </div>
                <Button onClick={addCredential} className="w-full">
                  Thêm Credential
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Credentials List */}
      {credentials.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có credentials nào cho dự án này</p>
            <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Credential đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {credentials.map((cred) => (
            <Card key={cred.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Key className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{cred.name}</CardTitle>
                      <CardDescription>{cred.service}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{cred.key_type}</Badge>
                    <Badge 
                      variant={cred.environment === "production" ? "default" : "secondary"}
                    >
                      {cred.environment}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteCredential(cred.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* FULL KEY DISPLAY - Không che */}
                <div className="relative">
                  <div className="font-mono text-sm bg-muted p-3 rounded-lg pr-24 overflow-x-auto">
                    <code className="break-all whitespace-pre-wrap">
                      {cred.value}
                    </code>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(cred.value, cred.id)}
                  >
                    {copiedId === cred.id ? (
                      <>
                        <Check className="h-4 w-4 mr-1 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                {cred.notes && (
                  <p className="text-sm text-muted-foreground mt-2">{cred.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
