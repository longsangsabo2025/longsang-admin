/**
 * =================================================================
 * ADMIN PROJECTS PAGE - List all projects with grouping
 * =================================================================
 * /admin/projects
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { type Project, type ProjectSocialAccount } from '@/lib/projects';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { ChevronDown, ChevronRight, ExternalLink, FolderOpen, Loader2, Plus, Search, Settings } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Platform icons mapping
const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  facebook: <span className="text-blue-500 font-bold text-sm">f</span>,
  instagram: <span className="text-pink-500 font-bold text-sm">📸</span>,
  youtube: <span className="text-red-500 font-bold text-sm">▶</span>,
  linkedin: <span className="text-blue-600 font-bold text-sm">in</span>,
  threads: <span className="text-sm">🧵</span>,
  twitter: <span className="text-sm">𝕏</span>,
  tiktok: <span className="text-sm">🎵</span>,
  telegram: <span className="text-sm">✈️</span>,
  discord: <span className="text-sm">🎮</span>,
};

// Group icons
const GROUP_ICONS: Record<string, string> = {
  'SABO': '🎱',
  'AI': '🤖',
};

interface ProjectWithSocial extends Project {
  social_accounts?: ProjectSocialAccount[];
  metadata?: {
    parent_id?: string;
    group?: string;
    is_group?: boolean;
  };
}

interface ProjectGroup {
  parent: ProjectWithSocial;
  children: ProjectWithSocial[];
}

export default function AdminProjects() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectWithSocial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    SABO: true,
    AI: true,
  });

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);

      // Get projects - cast to unknown first to avoid type errors
      const { data: projectsData, error: projectsError } = await supabaseAdmin
        .from('projects' as unknown as 'profiles')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (projectsError) throw projectsError;

      // Get all social accounts
      const { data: accountsData, error: accountsError } = await supabaseAdmin
        .from('project_social_accounts' as unknown as 'profiles')
        .select('*')
        .eq('is_active', true);

      if (accountsError) throw accountsError;

      // Merge social accounts into projects
      const projectsList = (projectsData || []) as unknown as Project[];
      const accountsList = (accountsData || []) as unknown as ProjectSocialAccount[];

      const projectsWithSocial: ProjectWithSocial[] = projectsList.map((project) => ({
        ...project,
        social_accounts: accountsList.filter((a) => a.project_id === project.id),
      }));

      setProjects(projectsWithSocial);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Filter projects based on search
  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Organize projects into groups and standalone
  const { groups, standalone } = filteredProjects.reduce(
    (acc, project) => {
      const metadata = project.metadata as ProjectWithSocial['metadata'];
      const group = metadata?.group;
      const isGroup = metadata?.is_group;

      if (isGroup && group) {
        // This is a parent/group project
        if (!acc.groups[group]) {
          acc.groups[group] = { parent: project, children: [] };
        } else {
          acc.groups[group].parent = project;
        }
      } else if (group) {
        // This is a child project
        if (!acc.groups[group]) {
          acc.groups[group] = { parent: null as unknown as ProjectWithSocial, children: [] };
        }
        acc.groups[group].children.push(project);
      } else {
        // Standalone project
        acc.standalone.push(project);
      }

      return acc;
    },
    { groups: {} as Record<string, ProjectGroup>, standalone: [] as ProjectWithSocial[] }
  );

  // Stats
  const totalProjects = projects.length;
  const totalSocialAccounts = projects.reduce(
    (sum, p) => sum + (p.social_accounts?.length || 0),
    0
  );
  const platformCounts = projects.reduce(
    (acc, p) => {
      for (const a of p.social_accounts || []) {
        acc[a.platform] = (acc[a.platform] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage your projects and their social media accounts
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-950 to-blue-900 border-blue-800">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{totalProjects}</div>
            <p className="text-sm text-muted-foreground">Total Projects</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-950 to-purple-900 border-purple-800">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{totalSocialAccounts}</div>
            <p className="text-sm text-muted-foreground">Social Accounts</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-950 to-green-900 border-green-800">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{platformCounts['facebook'] || 0}</div>
            <p className="text-sm text-muted-foreground">Facebook Pages</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-pink-950 to-pink-900 border-pink-800">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{platformCounts['instagram'] || 0}</div>
            <p className="text-sm text-muted-foreground">Instagram Accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Projects Grid - Grouped */}
      <div className="space-y-8">
        {/* Project Groups */}
        {Object.entries(groups).map(([groupName, group]) => (
          <Collapsible
            key={groupName}
            open={expandedGroups[groupName]}
            onOpenChange={() => toggleGroup(groupName)}
          >
            <Card className="overflow-hidden">
              <CollapsibleTrigger asChild>
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  style={{ 
                    borderLeftColor: group.parent?.color || '#888',
                    borderLeftWidth: '4px'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{GROUP_ICONS[groupName] || '📁'}</span>
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          {group.parent?.name || groupName}
                          <Badge variant="outline" className="ml-2">
                            {group.children.length} projects
                          </Badge>
                        </CardTitle>
                        <CardDescription>{group.parent?.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {expandedGroups[groupName] ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.children.map((project) => (
                      <ProjectCard key={project.id} project={project} navigate={navigate} />
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}

        {/* Standalone Projects */}
        {standalone.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📄 Standalone Projects
              <Badge variant="outline">{standalone.length} projects</Badge>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {standalone.map((project) => (
                <ProjectCard key={project.id} project={project} navigate={navigate} isStandalone />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <Card className="p-12 text-center">
          <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No projects found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? 'Try a different search term'
              : 'Get started by creating your first project'}
          </p>
          {!searchQuery && (
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}

// Project Card Component
interface ProjectCardProps {
  project: ProjectWithSocial;
  navigate: (path: string) => void;
  isStandalone?: boolean;
}

function ProjectCard({ project, navigate, isStandalone }: ProjectCardProps) {
  return (
    <Card
      className={`hover:border-primary/50 transition-colors cursor-pointer group ${
        isStandalone ? '' : 'border-l-0'
      }`}
      style={isStandalone ? { borderLeftColor: project.color, borderLeftWidth: '4px' } : {}}
      onClick={() => navigate(`/admin/p/${project.slug}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: project.color }}
            >
              {project.icon || project.name.charAt(0)}
            </div>
            <div>
              <CardTitle className="text-base group-hover:text-primary transition-colors">
                {project.name}
              </CardTitle>
              <CardDescription className="text-xs">/{project.slug}</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" asChild onClick={(e) => e.stopPropagation()}>
            <Link to={`/admin/projects/${project.slug}/settings`}>
              <Settings className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Description */}
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        )}

        {/* Social Accounts */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {(project.social_accounts || []).length > 0 ? (
              (project.social_accounts || []).slice(0, 4).map((account) => (
                <Badge
                  key={account.id}
                  variant="secondary"
                  className="flex items-center gap-1 text-xs"
                >
                  {PLATFORM_ICONS[account.platform] || account.platform}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">No accounts</span>
            )}
            {(project.social_accounts || []).length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{(project.social_accounts || []).length - 4}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/p/${project.slug}`);
            }}
          >
            <FolderOpen className="w-3 h-3 mr-1" />
            Hub
          </Button>
          {project.website_url && (
            <Button variant="ghost" size="sm" asChild onClick={(e) => e.stopPropagation()}>
              <a
                href={project.website_url}
                target="_blank"
                rel="noopener noreferrer"
                title={`Visit ${project.name}`}
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
