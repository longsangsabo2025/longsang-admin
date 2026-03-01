/**
 * By Project Tab - Social channels grouped by project
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  RefreshCw,
  ExternalLink,
  Copy,
  Loader2,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ProjectWithSocial } from './types';
import { PLATFORM_ICONS } from './constants';

interface ByProjectTabProps {
  projects: ProjectWithSocial[];
  projectsLoading: boolean;
  expandedProjects: Set<string>;
  loadProjects: () => void;
  toggleProject: (id: string) => void;
  copyToClipboard: (text: string, label: string) => void;
}

export function ByProjectTab({
  projects,
  projectsLoading,
  expandedProjects,
  loadProjects,
  toggleProject,
  copyToClipboard,
}: ByProjectTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Social Channels by Project</h2>
          <p className="text-muted-foreground">
            View social media accounts grouped by their parent project
          </p>
        </div>
        <Button variant="outline" onClick={loadProjects} disabled={projectsLoading}>
          {projectsLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {projectsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Projects Found</h3>
            <p className="text-muted-foreground mb-4">
              Create projects to organize your social media channels
            </p>
            <Button asChild>
              <Link to="/admin/projects">
                <Plus className="w-4 h-4 mr-2" />
                Go to Projects
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <Collapsible
              key={project.id}
              open={expandedProjects.has(project.id)}
              onOpenChange={() => toggleProject(project.id)}
            >
              <Card
                className="overflow-hidden"
                style={{ borderLeftColor: project.color, borderLeftWidth: '4px' }}
              >
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="pb-3 hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedProjects.has(project.id) ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: project.color }}
                        >
                          {project.name.charAt(0)}
                        </div>
                        <div className="text-left">
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {project.social_accounts?.length || 0} social channel(s)
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-wrap gap-1 max-w-[300px] justify-end">
                          {(project.social_accounts || []).map((account) => (
                            <Badge
                              key={account.id}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {PLATFORM_ICONS[account.platform] || account.platform}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0 border-t">
                    {(project.social_accounts || []).length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Platform</TableHead>
                            <TableHead>Account Name</TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(project.social_accounts || []).map((account) => (
                            <TableRow key={account.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">
                                    {account.platform === 'facebook' && '👥'}
                                    {account.platform === 'instagram' && '📸'}
                                    {account.platform === 'youtube' && '▶️'}
                                    {account.platform === 'linkedin' && '💼'}
                                    {account.platform === 'threads' && '🧵'}
                                    {account.platform === 'twitter' && '𝕏'}
                                    {account.platform === 'tiktok' && '🎵'}
                                    {account.platform === 'telegram' && '✈️'}
                                    {account.platform === 'discord' && '🎮'}
                                  </span>
                                  <span className="capitalize font-medium">
                                    {account.platform}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {account.account_name}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {account.account_username
                                  ? `@${account.account_username}`
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={account.is_active ? 'bg-green-500' : 'bg-gray-500'}
                                >
                                  {account.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  {account.account_id && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyToClipboard(account.account_id, 'Account ID');
                                      }}
                                      title="Copy ID"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  )}
                                  {(account as any).profile_url && (
                                    <Button variant="ghost" size="sm" asChild>
                                      <a
                                        href={(account as any).profile_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Open profile"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="py-6 text-center">
                        <p className="text-muted-foreground mb-3">
                          No social channels linked to this project
                        </p>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/admin/projects/${project.slug}`}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Social Channels
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}

          {/* Summary Card */}
          <Card className="bg-gradient-to-br from-indigo-950 to-purple-950 border-indigo-800">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold">{projects.length}</div>
                  <p className="text-sm text-muted-foreground">Projects</p>
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {projects.reduce((sum, p) => sum + (p.social_accounts?.length || 0), 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Channels</p>
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {projects.filter((p) => (p.social_accounts?.length || 0) > 0).length}
                  </div>
                  <p className="text-sm text-muted-foreground">With Channels</p>
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {
                      new Set(
                        projects.flatMap((p) =>
                          (p.social_accounts || []).map((a) => a.platform)
                        )
                      ).size
                    }
                  </div>
                  <p className="text-sm text-muted-foreground">Platforms</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
