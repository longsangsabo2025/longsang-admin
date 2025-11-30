import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Key,
  Copy,
  Plus,
  Search,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Shield,
  AlertTriangle,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  slug: string;
  icon: string;
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

const CredentialsVault = () => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCredential, setNewCredential] = useState({
    name: "",
    type: "api_key",
    key_value: "",
    environment: "production",
    project_id: "",
  });

  useEffect(() => {
    fetchCredentials();
    fetchProjects();
  }, []);

  const fetchCredentials = async () => {
    try {
      const { data, error } = await supabase
        .from("project_credentials")
        .select("*, projects(id, name, slug, icon)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCredentials(data || []);
    } catch (error) {
      console.error("Error fetching credentials:", error);
      toast.error("Không thể tải danh sách credentials");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, slug, icon")
        .order("name");

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const copyToClipboard = (value: string, name: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`Đã copy ${name}`);
  };

  const toggleShowValue = (id: string) => {
    setShowValues((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const addCredential = async () => {
    if (!newCredential.name || !newCredential.key_value || !newCredential.project_id) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      const keyPreview = newCredential.key_value.length > 8
        ? `${newCredential.key_value.slice(0, 4)}...${newCredential.key_value.slice(-4)}`
        : "****";

      const { error } = await supabase.from("project_credentials").insert({
        name: newCredential.name,
        type: newCredential.type,
        key_value: newCredential.key_value,
        key_preview: keyPreview,
        environment: newCredential.environment,
        project_id: newCredential.project_id,
        status: "active",
      });

      if (error) throw error;

      toast.success("Đã thêm credential mới");
      setIsAddDialogOpen(false);
      setNewCredential({
        name: "",
        type: "api_key",
        key_value: "",
        environment: "production",
        project_id: "",
      });
      fetchCredentials();
    } catch (error) {
      console.error("Error adding credential:", error);
      toast.error("Không thể thêm credential");
    }
  };

  const deleteCredential = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from("project_credentials")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success(`Đã xóa ${name}`);
      fetchCredentials();
    } catch (error) {
      console.error("Error deleting credential:", error);
      toast.error("Không thể xóa credential");
    }
  };

  const getTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      api_key: "bg-blue-500",
      secret: "bg-purple-500",
      oauth: "bg-green-500",
      database: "bg-orange-500",
      webhook: "bg-pink-500",
      service_account: "bg-cyan-500",
    };
    return colors[type] || "bg-gray-500";
  };

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return <Badge className="bg-green-500">Active</Badge>;
    } else if (status === "expired") {
      return <Badge className="bg-red-500">Expired</Badge>;
    } else if (status === "rotating") {
      return <Badge className="bg-yellow-500">Rotating</Badge>;
    }
    return <Badge className="bg-gray-500">{status}</Badge>;
  };

  const filteredCredentials = credentials.filter((cred) => {
    const matchesSearch =
      cred.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cred.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject =
      filterProject === "all" || cred.project_id === filterProject;
    const matchesType = filterType === "all" || cred.type === filterType;
    return matchesSearch && matchesProject && matchesType;
  });

  // Group by project
  const groupedByProject = filteredCredentials.reduce((acc, cred) => {
    const projectName = cred.projects?.name || "Unknown Project";
    if (!acc[projectName]) {
      acc[projectName] = [];
    }
    acc[projectName].push(cred);
    return acc;
  }, {} as Record<string, Credential[]>);

  const uniqueTypes = [...new Set(credentials.map((c) => c.type))];

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
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Credentials Vault</h1>
            <p className="text-muted-foreground">
              {credentials.length} credentials across {projects.length} projects
            </p>
          </div>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Credential
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Credential</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Project</Label>
                <Select
                  value={newCredential.project_id}
                  onValueChange={(v) =>
                    setNewCredential({ ...newCredential, project_id: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
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

              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="OPENAI_API_KEY"
                  value={newCredential.name}
                  onChange={(e) =>
                    setNewCredential({ ...newCredential, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newCredential.type}
                  onValueChange={(v) =>
                    setNewCredential({ ...newCredential, type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="api_key">API Key</SelectItem>
                    <SelectItem value="secret">Secret</SelectItem>
                    <SelectItem value="oauth">OAuth</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="service_account">Service Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={newCredential.key_value}
                  onChange={(e) =>
                    setNewCredential({ ...newCredential, key_value: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Environment</Label>
                <Select
                  value={newCredential.environment}
                  onValueChange={(v) =>
                    setNewCredential({ ...newCredential, environment: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={addCredential} className="w-full">
                Add Credential
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search credentials..."
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

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchCredentials}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Credentials by Project */}
      {Object.entries(groupedByProject).map(([projectName, creds]) => (
        <Card key={projectName}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Key className="h-5 w-5" />
              {projectName}
              <Badge variant="secondary">{creds.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {creds.map((cred) => (
                <div
                  key={cred.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Badge className={getTypeBadgeColor(cred.type)}>
                      {cred.type}
                    </Badge>
                    <div className="flex-1">
                      <div className="font-medium">{cred.name}</div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {showValues[cred.id]
                          ? cred.key_value
                          : cred.key_preview || "••••••••"}
                      </div>
                    </div>
                    <Badge variant="outline">{cred.environment}</Badge>
                    {getStatusBadge(cred.status)}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
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
                      size="sm"
                      onClick={() => copyToClipboard(cred.key_value, cred.name)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCredential(cred.id, cred.name)}
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

      {filteredCredentials.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No credentials found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterProject !== "all" || filterType !== "all"
                ? "Try adjusting your search or filters"
                : "Add your first credential to get started"}
            </p>
            {!searchTerm && filterProject === "all" && filterType === "all" && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Credential
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CredentialsVault;
