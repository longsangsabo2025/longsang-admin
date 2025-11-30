import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  LayoutDashboard, 
  Key, 
  Globe, 
  Share2, 
  BarChart3, 
  Search, 
  Workflow, 
  FileText, 
  Users, 
  FolderOpen, 
  Plug, 
  Settings,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

// Tab Components
import { ProjectOverviewTab } from "@/components/project/ProjectOverviewTab";
import { ProjectCredentialsTab } from "@/components/project/ProjectCredentialsTab";
import { ProjectDomainsTab } from "@/components/project/ProjectDomainsTab";
import { ProjectSocialTab } from "@/components/project/ProjectSocialTab";
import { ProjectAnalyticsTab } from "@/components/project/ProjectAnalyticsTab";
import { ProjectSEOTab } from "@/components/project/ProjectSEOTab";
import { ProjectWorkflowsTab } from "@/components/project/ProjectWorkflowsTab";
import { ProjectContentTab } from "@/components/project/ProjectContentTab";
import { ProjectTeamTab } from "@/components/project/ProjectTeamTab";
import { ProjectDocsTab } from "@/components/project/ProjectDocsTab";
import { ProjectIntegrationsTab } from "@/components/project/ProjectIntegrationsTab";
import { ProjectSettingsTab } from "@/components/project/ProjectSettingsTab";

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

const tabs = [
  { id: "overview", label: "Tổng Quan", icon: LayoutDashboard },
  { id: "credentials", label: "API Keys", icon: Key },
  { id: "domains", label: "Domains", icon: Globe },
  { id: "social", label: "Social Media", icon: Share2 },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "seo", label: "SEO", icon: Search },
  { id: "workflows", label: "Workflows", icon: Workflow },
  { id: "content", label: "Content", icon: FileText },
  { id: "team", label: "Team", icon: Users },
  { id: "docs", label: "Documents", icon: FolderOpen },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function ProjectCommandCenter() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  
  const activeTab = searchParams.get("tab") || "overview";

  useEffect(() => {
    if (slug) {
      fetchProject();
    }
  }, [slug]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error: any) {
      console.error("Error fetching project:", error);
      toast.error("Không thể tải thông tin dự án");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">Không tìm thấy dự án</p>
          <Button onClick={() => navigate("/admin/projects")} className="mt-4">
            Quay lại danh sách
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/admin/projects")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div 
              className="text-4xl p-3 rounded-xl"
              style={{ backgroundColor: `${project.color}20` }}
            >
              {project.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <p className="text-muted-foreground">{project.description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge 
            variant={project.status === "active" ? "default" : "secondary"}
            className="capitalize"
          >
            {project.status}
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchProject}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex h-auto p-1 bg-muted/50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-background"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Tab Contents */}
        <TabsContent value="overview">
          <ProjectOverviewTab project={project} onRefresh={fetchProject} />
        </TabsContent>

        <TabsContent value="credentials">
          <ProjectCredentialsTab projectId={project.id} projectSlug={project.slug} />
        </TabsContent>

        <TabsContent value="domains">
          <ProjectDomainsTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="social">
          <ProjectSocialTab projectId={project.id} projectName={project.name} />
        </TabsContent>

        <TabsContent value="analytics">
          <ProjectAnalyticsTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="seo">
          <ProjectSEOTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="workflows">
          <ProjectWorkflowsTab projectId={project.id} projectSlug={project.slug} />
        </TabsContent>

        <TabsContent value="content">
          <ProjectContentTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="team">
          <ProjectTeamTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="docs">
          <ProjectDocsTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="integrations">
          <ProjectIntegrationsTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="settings">
          <ProjectSettingsTab project={project} onRefresh={fetchProject} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
