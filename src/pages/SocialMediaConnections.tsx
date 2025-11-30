/**
 * =================================================================
 * SOCIAL MEDIA CONNECTIONS DASHBOARD
 * =================================================================
 * Hiển thị tất cả platforms đã kết nối với thông tin chi tiết
 * Data được load từ Supabase database
 * 
 * Platforms đã kết nối:
 * - Facebook (7 Pages)
 * - Instagram (5 Business Accounts) 
 * - Threads (@baddie.4296)
 * - LinkedIn (Long Sang)
 * - YouTube (Long Sang - 12 subs)
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RefreshCw,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Settings,
  Zap,
  Loader2,
  Database,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Plus
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";
import { type Project, type ProjectSocialAccount } from "@/lib/projects";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface StoredCredential {
  id: string;
  platform: string;
  credentials: Record<string, any>;
  settings: Record<string, any>;
  account_info: {
    name?: string;
    username?: string;
    id?: string;
    followers?: number;
    subscribers?: number;
    videos?: number;
    views?: number;
    pages?: number;
    accounts?: number;
    profileUrl?: string;
    channelId?: string;
    mainPageId?: string;
    fans?: number;
    primaryId?: string;
  };
  is_active: boolean;
  last_tested_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════
// CONNECTED PLATFORMS DATA
// ═══════════════════════════════════════════════════════════════

interface SocialAccount {
  id: string;
  name: string;
  username?: string;
  type: 'page' | 'profile' | 'channel' | 'account';
  followers?: number;
  tokenStatus: 'permanent' | 'active' | 'expiring' | 'expired';
  tokenExpiry?: string;
  lastPost?: string;
}

interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  connected: boolean;
  accounts: SocialAccount[];
  capabilities: string[];
  notes?: string;
}

const PLATFORMS: Platform[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '👥',
    color: 'text-blue-400',
    bgColor: 'bg-blue-950 dark:bg-blue-950 border-blue-800',
    connected: true,
    capabilities: ['Post text', 'Post images', 'Post videos', 'Schedule posts', 'Page insights'],
    accounts: [
      { id: '118356497898536', name: 'SABO Billiards - TP. Vũng Tàu', type: 'page', followers: 18850, tokenStatus: 'permanent' },
      { id: '719273174600166', name: 'SABO ARENA', type: 'page', tokenStatus: 'permanent' },
      { id: '569671719553461', name: 'AI Newbie VN', type: 'page', tokenStatus: 'permanent' },
      { id: '332950393234346', name: 'SABO Media', type: 'page', tokenStatus: 'permanent' },
      { id: '618738001318577', name: 'AI Art Newbie', type: 'page', tokenStatus: 'permanent' },
      { id: '569652129566651', name: 'SABO Billiard Shop', type: 'page', tokenStatus: 'permanent' },
      { id: '519070237965883', name: 'Thợ Săn Hoàng Hôn', type: 'page', tokenStatus: 'permanent' },
    ],
    notes: 'Tất cả Page tokens đều PERMANENT - không bao giờ hết hạn!'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    color: 'text-pink-400',
    bgColor: 'bg-gradient-to-br from-purple-950 to-pink-950 border-pink-800',
    connected: true,
    capabilities: ['Post images', 'Post videos', 'Post carousels', 'Reels', 'Stories (coming)'],
    accounts: [
      { id: '17841474279844606', name: 'SABO Billiards | TP. Vũng Tàu', username: 'sabobilliard', type: 'account', followers: 17, tokenStatus: 'permanent' },
      { id: '17841472718907470', name: 'SABO Bida', username: 'sabomediavt', type: 'account', followers: 4, tokenStatus: 'permanent' },
      { id: '17841474205608601', name: 'Long Sang AI Automation', username: 'newbiehocmake', type: 'account', tokenStatus: 'permanent' },
      { id: '17841472893889754', name: 'SABO Bida Shop', username: 'sabobidashop', type: 'account', followers: 3, tokenStatus: 'permanent' },
      { id: '17841472996653110', name: 'LS Fusion Lab', username: 'lsfusionlab', type: 'account', followers: 5, tokenStatus: 'permanent' },
    ],
    notes: 'Dùng Page Token tương ứng để post. Token PERMANENT!'
  },
  {
    id: 'threads',
    name: 'Threads',
    icon: '🧵',
    color: 'text-white',
    bgColor: 'bg-gray-900 border-gray-700',
    connected: true,
    capabilities: ['Post text', 'Post images', 'Post videos', 'Carousels', 'Reply to threads'],
    accounts: [
      { id: '25295715200066837', name: 'Vũng Tàu', username: 'baddie.4296', type: 'profile', tokenStatus: 'active', tokenExpiry: '~60 days' },
    ],
    notes: 'Token cần refresh sau 60 ngày'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: 'text-blue-400',
    bgColor: 'bg-blue-950 border-blue-800',
    connected: true,
    capabilities: ['Post text', 'Post images', 'Post articles', 'Post documents'],
    accounts: [
      { id: 'HhV8LImTty', name: 'Long Sang', username: 'longsangautomation@gmail.com', type: 'profile', tokenStatus: 'active', tokenExpiry: '~60 days (Jan 25, 2026)' },
    ],
    notes: 'Token cần refresh sau 60 ngày. Có thể post lên Company Page nếu có quyền.'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '▶️',
    color: 'text-red-400',
    bgColor: 'bg-red-950 border-red-800',
    connected: true,
    capabilities: ['Upload videos', 'Create playlists', 'Update metadata', 'Read analytics'],
    accounts: [
      { id: 'UCh08dvkDfJVJ8f1C-TbXbew', name: 'Long Sang', type: 'channel', followers: 12, tokenStatus: 'active', tokenExpiry: 'Auto-refresh với Refresh Token' },
    ],
    notes: '🔄 Có Refresh Token - tự động renew khi hết hạn!'
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: '𝕏',
    color: 'text-white',
    bgColor: 'bg-gray-900 border-gray-700',
    connected: false,
    capabilities: ['Post tweets', 'Post images', 'Post videos', 'Threads'],
    accounts: [],
    notes: '⚠️ Yêu cầu Basic tier ($100/tháng) để có write access'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    color: 'text-white',
    bgColor: 'bg-gray-900 border-gray-700',
    connected: false,
    capabilities: ['Upload videos (3-60s)', 'Read analytics'],
    accounts: [],
    notes: '⚠️ Cần TikTok Developer approval (miễn phí nhưng mất 1-2 tuần duyệt)'
  },
];

// ═══════════════════════════════════════════════════════════════
// CREDENTIAL INFO (để hiển thị, không phải real tokens)
// ═══════════════════════════════════════════════════════════════

const CREDENTIAL_SUMMARY = {
  facebook: {
    appId: '1340824257525630',
    appName: 'Long Sang Automation',
    tokenType: 'Page Access Tokens (Permanent)',
    lastUpdated: 'Nov 26, 2025'
  },
  instagram: {
    note: 'Sử dụng Facebook Page Tokens',
    tokenType: 'Page Access Tokens (Permanent)',
    lastUpdated: 'Nov 26, 2025'
  },
  threads: {
    appId: '858444256689767',
    tokenType: 'User Access Token (60 days)',
    lastUpdated: 'Nov 26, 2025'
  },
  linkedin: {
    clientId: '78488c9vfxxdc6',
    tokenType: 'OAuth 2.0 Access Token (60 days)',
    lastUpdated: 'Nov 26, 2025'
  },
  youtube: {
    clientId: '108558893612-fn9pl4tik8ebjeujlbnudma8re5a99gk.apps.googleusercontent.com',
    tokenType: 'OAuth 2.0 + Refresh Token',
    lastUpdated: 'Nov 26, 2025'
  }
};

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

interface ProjectWithSocial extends Project {
  social_accounts?: ProjectSocialAccount[];
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export const SocialMediaConnections = () => {
  const { toast } = useToast();
  const [showTokens, setShowTokens] = useState(false);
  const [dbCredentials, setDbCredentials] = useState<StoredCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectWithSocial[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // Load credentials from Supabase
  useEffect(() => {
    loadCredentials();
    loadProjects();
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      setProjectsLoading(true);
      
      // Get projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects' as unknown as 'profiles')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (projectsError) throw projectsError;

      // Get all social accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('project_social_accounts' as unknown as 'profiles')
        .select('*')
        .eq('is_active', true);

      if (accountsError) throw accountsError;

      // Merge social accounts into projects  
      const projectsList = (projectsData || []) as unknown as Project[];
      const accountsList = (accountsData || []) as unknown as ProjectSocialAccount[];
      
      const projectsWithSocial: ProjectWithSocial[] = projectsList.map(project => ({
        ...project,
        social_accounts: accountsList.filter(a => a.project_id === project.id),
      }));

      setProjects(projectsWithSocial);
      // Expand all projects by default
      setExpandedProjects(new Set(projectsWithSocial.map(p => p.id)));
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const loadCredentials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('social_media_credentials')
        .select('*')
        .eq('is_active', true)
        .order('platform');

      if (error) throw error;
      
      setDbCredentials(data || []);
      setLastSync(new Date().toLocaleString('vi-VN'));
    } catch (err) {
      console.error('Failed to load credentials:', err);
      toast({
        title: "Error",
        description: "Failed to load credentials from database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const connectedPlatforms = PLATFORMS.filter(p => p.connected);
  const pendingPlatforms = PLATFORMS.filter(p => !p.connected);
  const totalAccounts = connectedPlatforms.reduce((sum, p) => sum + p.accounts.length, 0);
  
  // Check if platform is in database
  const isPlatformInDb = (platformId: string) => {
    return dbCredentials.some(c => c.platform === platformId);
  };

  const getDbCredential = (platformId: string) => {
    return dbCredentials.find(c => c.platform === platformId);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const getTokenStatusBadge = (status: SocialAccount['tokenStatus']) => {
    switch (status) {
      case 'permanent':
        return <Badge className="bg-green-500">♾️ Permanent</Badge>;
      case 'active':
        return <Badge className="bg-blue-500">✅ Active</Badge>;
      case 'expiring':
        return <Badge className="bg-yellow-500">⚠️ Expiring Soon</Badge>;
      case 'expired':
        return <Badge className="bg-red-500">❌ Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Social Media Connections</h1>
          <p className="text-muted-foreground">
            Quản lý tất cả các kết nối social media trong một nơi
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTokens(!showTokens)}>
            {showTokens ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showTokens ? 'Hide Tokens' : 'Show Tokens'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadCredentials}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh All
          </Button>
        </div>
      </div>

      {/* Database Status Banner */}
      <Card className={`${dbCredentials.length > 0 ? 'bg-green-950 border-green-800' : 'bg-yellow-950 border-yellow-800'}`}>
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span className="font-medium">
                {loading ? 'Loading from Supabase...' : `${dbCredentials.length} platforms stored in database`}
              </span>
              {lastSync && (
                <span className="text-xs text-muted-foreground">
                  • Last sync: {lastSync}
                </span>
              )}
            </div>
            <div className="flex gap-1">
              {dbCredentials.map(cred => (
                <Badge 
                  key={cred.platform} 
                  variant="outline" 
                  className={isPlatformInDb(cred.platform) ? 'bg-green-900 text-green-300' : ''}
                >
                  {cred.platform}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600">{dbCredentials.length || connectedPlatforms.length}</div>
            <p className="text-sm text-muted-foreground">Platforms in DB</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-600">{totalAccounts}</div>
            <p className="text-sm text-muted-foreground">Total Accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-purple-600">
              {getDbCredential('facebook')?.settings?.totalPages || 7}
            </div>
            <p className="text-sm text-muted-foreground">Facebook Pages</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-pink-600">
              {getDbCredential('instagram')?.settings?.totalAccounts || 5}
            </div>
            <p className="text-sm text-muted-foreground">Instagram Accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-yellow-600">{pendingPlatforms.length}</div>
            <p className="text-sm text-muted-foreground">Pending Setup</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="by-project" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="by-project">📁 By Project</TabsTrigger>
          <TabsTrigger value="overview">📊 Overview</TabsTrigger>
          <TabsTrigger value="facebook">👥 Facebook</TabsTrigger>
          <TabsTrigger value="instagram">📸 Instagram</TabsTrigger>
          <TabsTrigger value="threads">🧵 Threads</TabsTrigger>
          <TabsTrigger value="linkedin">💼 LinkedIn</TabsTrigger>
          <TabsTrigger value="youtube">▶️ YouTube</TabsTrigger>
          <TabsTrigger value="pending">⏳ Pending</TabsTrigger>
        </TabsList>

        {/* By Project Tab - Social Channels grouped by Project */}
        <TabsContent value="by-project" className="space-y-4">
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
                                      <span className="capitalize font-medium">{account.platform}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {account.account_name}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {account.account_username ? `@${account.account_username}` : '-'}
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={account.is_active ? 'bg-green-500' : 'bg-gray-500'}>
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
                                      {account.profile_url && (
                                        <Button variant="ghost" size="sm" asChild>
                                          <a
                                            href={account.profile_url}
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
                        {projects.filter(p => (p.social_accounts?.length || 0) > 0).length}
                      </div>
                      <p className="text-sm text-muted-foreground">With Channels</p>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">
                        {new Set(
                          projects.flatMap(p => (p.social_accounts || []).map(a => a.platform))
                        ).size}
                      </div>
                      <p className="text-sm text-muted-foreground">Platforms</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedPlatforms.map((platform) => (
              <Card key={platform.id} className={platform.bgColor}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{platform.icon}</span>
                      <CardTitle className={platform.color}>{platform.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-green-900 text-green-300 border-green-700">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">{platform.accounts.length} Account(s)</p>
                      <div className="text-xs text-muted-foreground mt-1">
                        {platform.accounts.slice(0, 2).map(acc => (
                          <div key={acc.id}>{acc.username ? `@${acc.username}` : acc.name}</div>
                        ))}
                        {platform.accounts.length > 2 && (
                          <div>+{platform.accounts.length - 2} more...</div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {platform.capabilities.slice(0, 3).map(cap => (
                        <Badge key={cap} variant="secondary" className="text-xs">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                    {platform.notes && (
                      <p className="text-xs text-muted-foreground border-t pt-2">
                        {platform.notes}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Token Expiry Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Token Expiry Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platform</TableHead>
                    <TableHead>Token Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">👥 Facebook Pages</TableCell>
                    <TableCell>Page Access Token</TableCell>
                    <TableCell><Badge className="bg-green-500">♾️ Permanent</Badge></TableCell>
                    <TableCell>Never</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">📸 Instagram</TableCell>
                    <TableCell>Page Access Token</TableCell>
                    <TableCell><Badge className="bg-green-500">♾️ Permanent</Badge></TableCell>
                    <TableCell>Never</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">🧵 Threads</TableCell>
                    <TableCell>User Access Token</TableCell>
                    <TableCell><Badge className="bg-blue-500">✅ Active</Badge></TableCell>
                    <TableCell>~Jan 25, 2026</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">Refresh</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">💼 LinkedIn</TableCell>
                    <TableCell>OAuth 2.0 Token</TableCell>
                    <TableCell><Badge className="bg-blue-500">✅ Active</Badge></TableCell>
                    <TableCell>~Jan 25, 2026</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">Refresh</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">▶️ YouTube</TableCell>
                    <TableCell>OAuth 2.0 + Refresh</TableCell>
                    <TableCell><Badge className="bg-green-500">🔄 Auto-Refresh</Badge></TableCell>
                    <TableCell>Auto-renew</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Facebook Tab */}
        <TabsContent value="facebook" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">👥</span>
                  <div>
                    <CardTitle>Facebook Pages</CardTitle>
                    <CardDescription>7 Pages connected with permanent tokens</CardDescription>
                  </div>
                </div>
                <Badge className="bg-green-500">All Tokens Permanent</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page Name</TableHead>
                    <TableHead>Page ID</TableHead>
                    <TableHead>Followers</TableHead>
                    <TableHead>Token Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PLATFORMS.find(p => p.id === 'facebook')?.accounts.map(acc => (
                    <TableRow key={acc.id}>
                      <TableCell className="font-medium">{acc.name}</TableCell>
                      <TableCell className="font-mono text-xs">{acc.id}</TableCell>
                      <TableCell>{acc.followers?.toLocaleString() || '-'}</TableCell>
                      <TableCell>{getTokenStatusBadge(acc.tokenStatus)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(acc.id, 'Page ID')}>
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`https://facebook.com/${acc.id}`} target="_blank" rel="noopener noreferrer" title="Open Facebook page">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {showTokens && (
            <Card className="border-yellow-500">
              <CardHeader>
                <CardTitle className="text-yellow-600">🔐 Credentials Info</CardTitle>
              </CardHeader>
              <CardContent className="font-mono text-sm space-y-2">
                <p><strong>App ID:</strong> {CREDENTIAL_SUMMARY.facebook.appId}</p>
                <p><strong>App Name:</strong> {CREDENTIAL_SUMMARY.facebook.appName}</p>
                <p><strong>Token Type:</strong> {CREDENTIAL_SUMMARY.facebook.tokenType}</p>
                <p className="text-muted-foreground text-xs">Full tokens stored in .env file</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Instagram Tab */}
        <TabsContent value="instagram" className="space-y-4">
          <Card className="bg-gradient-to-br from-purple-950 to-pink-950 border-pink-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📸</span>
                  <div>
                    <CardTitle>Instagram Business Accounts</CardTitle>
                    <CardDescription>5 accounts connected via Facebook Pages</CardDescription>
                  </div>
                </div>
                <Badge className="bg-green-500">Using Page Tokens</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>IG ID</TableHead>
                    <TableHead>Followers</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PLATFORMS.find(p => p.id === 'instagram')?.accounts.map(acc => (
                    <TableRow key={acc.id}>
                      <TableCell className="font-medium">{acc.name}</TableCell>
                      <TableCell className="text-pink-600">@{acc.username}</TableCell>
                      <TableCell className="font-mono text-xs">{acc.id}</TableCell>
                      <TableCell>{acc.followers || '-'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`https://instagram.com/${acc.username}`} target="_blank" rel="noopener noreferrer" title="Open Instagram profile">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Threads Tab */}
        <TabsContent value="threads" className="space-y-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🧵</span>
                  <div>
                    <CardTitle>Threads</CardTitle>
                    <CardDescription>Meta's text-based conversation app</CardDescription>
                  </div>
                </div>
                <Badge className="bg-blue-500">Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-gray-900">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl">
                    🧵
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">@baddie.4296</h3>
                    <p className="text-muted-foreground">Vũng Tàu</p>
                    <p className="text-sm font-mono text-muted-foreground">ID: 25295715200066837</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Token Status</p>
                  <p className="font-medium">✅ Active (60 days)</p>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Expires</p>
                  <p className="font-medium">~Jan 25, 2026</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Capabilities</h4>
                <div className="flex flex-wrap gap-2">
                  {['Post text', 'Post images', 'Post videos', 'Carousels', 'Reply to threads'].map(cap => (
                    <Badge key={cap} variant="secondary">{cap}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LinkedIn Tab */}
        <TabsContent value="linkedin" className="space-y-4">
          <Card className="bg-blue-950 border-blue-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">💼</span>
                  <div>
                    <CardTitle>LinkedIn</CardTitle>
                    <CardDescription>Professional networking platform</CardDescription>
                  </div>
                </div>
                <Badge className="bg-blue-500">Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-gray-900">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl">
                    LS
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Long Sang</h3>
                    <p className="text-muted-foreground">longsangautomation@gmail.com</p>
                    <p className="text-sm font-mono text-muted-foreground">ID: HhV8LImTty</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Token Status</p>
                  <p className="font-medium">✅ Active (60 days)</p>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Expires</p>
                  <p className="font-medium">~Jan 25, 2026</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Capabilities</h4>
                <div className="flex flex-wrap gap-2">
                  {['Post text', 'Post images', 'Post articles', 'Post documents'].map(cap => (
                    <Badge key={cap} variant="secondary">{cap}</Badge>
                  ))}
                </div>
              </div>

              {showTokens && (
                <div className="p-3 rounded-lg border border-yellow-700 bg-yellow-950">
                  <p className="text-sm"><strong>Client ID:</strong> {CREDENTIAL_SUMMARY.linkedin.clientId}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* YouTube Tab */}
        <TabsContent value="youtube" className="space-y-4">
          <Card className="bg-red-950 border-red-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">▶️</span>
                  <div>
                    <CardTitle>YouTube</CardTitle>
                    <CardDescription>Video sharing platform</CardDescription>
                  </div>
                </div>
                <Badge className="bg-green-500">🔄 Auto-Refresh</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-gray-900">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl">
                    ▶️
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Long Sang</h3>
                    <p className="text-muted-foreground">YouTube Channel</p>
                    <p className="text-sm font-mono text-muted-foreground">ID: UCh08dvkDfJVJ8f1C-TbXbew</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg border text-center">
                  <p className="text-2xl font-bold text-red-600">12</p>
                  <p className="text-sm text-muted-foreground">Subscribers</p>
                </div>
                <div className="p-3 rounded-lg border text-center">
                  <p className="text-2xl font-bold text-red-600">20</p>
                  <p className="text-sm text-muted-foreground">Videos</p>
                </div>
                <div className="p-3 rounded-lg border text-center">
                  <p className="text-2xl font-bold text-red-600">4,820</p>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-green-700 bg-green-950">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-green-400" />
                  <p className="text-sm font-medium text-green-400">
                    Có Refresh Token - Token sẽ tự động renew khi hết hạn!
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Capabilities</h4>
                <div className="flex flex-wrap gap-2">
                  {['Upload videos', 'Create playlists', 'Update metadata', 'Read analytics'].map(cap => (
                    <Badge key={cap} variant="secondary">{cap}</Badge>
                  ))}
                </div>
              </div>

              <Button variant="outline" className="w-full" asChild>
                <a href="https://youtube.com/channel/UCh08dvkDfJVJ8f1C-TbXbew" target="_blank" rel="noopener">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Channel on YouTube
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent value="pending" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingPlatforms.map((platform) => (
              <Card key={platform.id} className="border-dashed">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl opacity-50">{platform.icon}</span>
                      <CardTitle className="text-muted-foreground">{platform.name}</CardTitle>
                    </div>
                    <Badge variant="outline">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Not Connected
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{platform.notes}</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {platform.capabilities.map(cap => (
                      <Badge key={cap} variant="outline" className="text-xs opacity-50">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full" disabled>
                    <Settings className="w-4 h-4 mr-2" />
                    Setup Required
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <a href="/admin/social-media">
                <span className="text-2xl mb-2">✍️</span>
                <span>Compose Post</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <a href="/admin/workflows">
                <span className="text-2xl mb-2">⚡</span>
                <span>n8n Workflows</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <a href="/admin/credentials">
                <span className="text-2xl mb-2">🔐</span>
                <span>Manage Credentials</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col">
              <span className="text-2xl mb-2">📊</span>
              <span>View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialMediaConnections;
