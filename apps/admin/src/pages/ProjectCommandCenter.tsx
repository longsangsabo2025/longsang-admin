import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabaseAdmin } from '@/lib/supabase-admin';
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
  RefreshCw,
  Image,
  Megaphone,
} from 'lucide-react';
import { toast } from 'sonner';

// Tab Components
import { ProjectOverviewTab } from '@/components/project/ProjectOverviewTab';
import { ProjectCredentialsTab } from '@/components/project/ProjectCredentialsTab';
import { ProjectDomainsTab } from '@/components/project/ProjectDomainsTab';
import { ProjectSocialTab } from '@/components/project/ProjectSocialTab';
import { ProjectAnalyticsTab } from '@/components/project/ProjectAnalyticsTab';
import { ProjectSEOTab } from '@/components/project/ProjectSEOTab';
import { ProjectWorkflowsTab } from '@/components/project/ProjectWorkflowsTab';
import { ProjectContentTab } from '@/components/project/ProjectContentTab';
import { ProjectTeamTab } from '@/components/project/ProjectTeamTab';
import { ProjectDocsTab } from '@/components/project/ProjectDocsTab';
import { ProjectIntegrationsTab } from '@/components/project/ProjectIntegrationsTab';
import { ProjectSettingsTab } from '@/components/project/ProjectSettingsTab';
import { ProjectMarketingTab } from '@/components/project/ProjectMarketingTab';
import { MediaGallery } from '@/components/media/MediaGallery';

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

// Fallback projects when not in database
const FALLBACK_PROJECTS: Record<string, Project> = {
  'sabo-arena': {
    id: 'fallback-sabo-arena',
    name: 'SABO Arena',
    slug: 'sabo-arena',
    description: 'Billiards Gaming & Training Platform',
    status: 'active',
    icon: '🎱',
    color: '#22c55e',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'vungtau-dream-homes': {
    id: 'fallback-vt-homes',
    name: 'Vũng Tàu Dream Homes',
    slug: 'vungtau-dream-homes',
    description: 'Bất Động Sản Vũng Tàu',
    status: 'active',
    icon: '🏡',
    color: '#f97316',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'music-video-app': {
    id: 'fallback-music',
    name: 'Music Video App',
    slug: 'music-video-app',
    description: 'AI Music Generation Platform',
    status: 'active',
    icon: '🎵',
    color: '#a855f7',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'ai-secretary': {
    id: 'fallback-ai-sec',
    name: 'AI Secretary',
    slug: 'ai-secretary',
    description: 'Personal AI Assistant',
    status: 'active',
    icon: '🤖',
    color: '#ec4899',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'ainewbie-web': {
    id: 'fallback-ainewbie',
    name: 'AINewbie Web',
    slug: 'ainewbie-web',
    description: 'AI Learning Platform',
    status: 'active',
    icon: '🎓',
    color: '#06b6d4',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'longsang-admin': {
    id: 'fallback-admin',
    name: 'LongSang Admin',
    slug: 'longsang-admin',
    description: 'Master Control Panel',
    status: 'active',
    icon: '🚀',
    color: '#3b82f6',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

// Google Drive folder IDs mapping for each project
const PROJECT_DRIVE_FOLDERS: Record<string, string> = {
  'longsang-admin': '18lVYunyFRGyImQDueC4eep-YLMQQG2cF',
  'ainewbie-web': '1_W717py4DrkqEnGJtN6m9wBJqfAz2CMT',
  'vungtau-dream-homes': '1sxfRRyty6r0x1SpcXXyRR7OFevkwKuYH',
  'sabo-hub': '10GotnxoqURPNFmbDoksQTkXX-WKwKT9N',
  'sabo-arena': '1hw0FjtBfBoh1i963NVYJ10nuNrjT6v__',
  'music-video-app': '1U1aE_6pYse-_I4hCy12iK743C3v1kuau',
  'ai-secretary': '1knlWL11y5JNO7Gf6BBvQGUrC0Tr27yeC',
  'long-sang-forge': '1koFjXhltsuLZNh15pG8CR6R5heXCwuGx',
};

// Main PROJECTS folder ID on Google Drive
const PROJECTS_ROOT_FOLDER_ID = '18P5ks7WdlUWjPRuJ2b4BVSBAAe0l9SjL';

const tabs = [
  { id: 'overview', label: 'Tổng Quan', icon: LayoutDashboard },
  { id: 'credentials', label: 'Keys & Config', icon: Key },
  { id: 'social', label: 'Social Media', icon: Share2 },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'media', label: 'Thư Viện', icon: Image },
  { id: 'content', label: 'Content & SEO', icon: FileText },
  { id: 'settings', label: 'Cài Đặt', icon: Settings },
];

export default function ProjectCommandCenter() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const activeTab = searchParams.get('tab') || 'overview';

  useEffect(() => {
    if (slug) {
      fetchProject();
    }
  }, [slug]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProject(data);
      } else if (slug && FALLBACK_PROJECTS[slug]) {
        setProject(FALLBACK_PROJECTS[slug]);
      } else {
        toast.error('Không tìm thấy dự án');
      }
    } catch (error: any) {
      console.error('Supabase error:', error);
      if (slug && FALLBACK_PROJECTS[slug]) {
        setProject(FALLBACK_PROJECTS[slug]);
      } else {
        toast.error('Không thể tải thông tin dự án');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Check if using fallback
  const isFallback = project?.id.startsWith('fallback-');

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
          <Button onClick={() => navigate('/admin/projects')} className="mt-4">
            Quay lại danh sách
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fallback Mode Banner */}
      {isFallback && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="font-medium text-amber-600 dark:text-amber-400">Chế độ Demo</p>
            <p className="text-sm text-muted-foreground">
              Dự án chưa được setup trong database. Một số tính năng sẽ không hoạt động đầy đủ.
            </p>
          </div>
          <Button variant="outline" size="sm" className="border-amber-500/30">
            Setup Project
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/projects')}>
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
          {isFallback && (
            <Badge variant="outline" className="border-amber-500/50 text-amber-600">
              Demo Mode
            </Badge>
          )}
          <Badge
            variant={project.status === 'active' ? 'default' : 'secondary'}
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
          <ProjectOverviewTab project={project} projectId={project.id} onRefresh={fetchProject} />
        </TabsContent>

        <TabsContent value="credentials">
          <div className="space-y-8">
            <ProjectCredentialsTab projectId={project.id} projectSlug={project.slug} />
            <ProjectDomainsTab projectId={project.id} />
            <ProjectIntegrationsTab projectId={project.id} />
          </div>
        </TabsContent>

        <TabsContent value="social">
          <div className="space-y-8">
            <ProjectSocialTab projectId={project.id} projectName={project.name} />
            <ProjectAnalyticsTab projectId={project.id} />
          </div>
        </TabsContent>

        <TabsContent value="marketing">
          <ProjectMarketingTab 
            projectId={project.id} 
            projectName={project.name}
            projectSlug={project.slug}
          />
        </TabsContent>

        <TabsContent value="media" className="h-[calc(100vh-280px)] min-h-[500px]">
          <Card className="h-full">
            <CardContent className="p-6 h-full">
              <MediaGallery
                projectSlug={project.slug}
                projectFolderId={PROJECT_DRIVE_FOLDERS[project.slug]}
                onSelectMedia={(files) => {
                  console.log('Selected media:', files);
                  toast.success(`Đã chọn ${files.length} files - Sẵn sàng để sử dụng!`);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <div className="space-y-8">
            <ProjectContentTab projectId={project.id} />
            <ProjectSEOTab projectId={project.id} />
            <ProjectDocsTab projectId={project.id} />
            <ProjectWorkflowsTab projectId={project.id} projectSlug={project.slug} />
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-8">
            <ProjectSettingsTab project={project} onRefresh={fetchProject} />
            <ProjectTeamTab projectId={project.id} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
