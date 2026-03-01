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

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RefreshCw,
  Eye,
  EyeOff,
  Loader2,
  Database,
} from 'lucide-react';

import { PLATFORMS } from './social-media/constants';
import { useSocialMedia } from './social-media/useSocialMedia';
import { ByProjectTab } from './social-media/ByProjectTab';
import { OverviewTab } from './social-media/OverviewTab';
import {
  FacebookTab,
  InstagramTab,
  ThreadsTab,
  LinkedInTab,
  YouTubeTab,
  PendingTab,
} from './social-media/PlatformTabs';
import { QuickActions } from './social-media/QuickActions';

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export const SocialMediaConnections = () => {
  const {
    showTokens,
    setShowTokens,
    dbCredentials,
    loading,
    lastSync,
    projects,
    projectsLoading,
    expandedProjects,
    loadProjects,
    loadCredentials,
    toggleProject,
    isPlatformInDb,
    getDbCredential,
    copyToClipboard,
  } = useSocialMedia();

  const connectedPlatforms = PLATFORMS.filter((p) => p.connected);
  const pendingPlatforms = PLATFORMS.filter((p) => !p.connected);
  const totalAccounts = connectedPlatforms.reduce((sum, p) => sum + p.accounts.length, 0);

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
          <Button variant="outline" size="sm" onClick={loadCredentials} disabled={loading}>
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
      <Card
        className={`${dbCredentials.length > 0 ? 'bg-green-950 border-green-800' : 'bg-yellow-950 border-yellow-800'}`}
      >
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span className="font-medium">
                {loading
                  ? 'Loading from Supabase...'
                  : `${dbCredentials.length} platforms stored in database`}
              </span>
              {lastSync && (
                <span className="text-xs text-muted-foreground">• Last sync: {lastSync}</span>
              )}
            </div>
            <div className="flex gap-1">
              {dbCredentials.map((cred) => (
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
            <div className="text-3xl font-bold text-green-600">
              {dbCredentials.length || connectedPlatforms.length}
            </div>
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

        <TabsContent value="by-project" className="space-y-4">
          <ByProjectTab
            projects={projects}
            projectsLoading={projectsLoading}
            expandedProjects={expandedProjects}
            loadProjects={loadProjects}
            toggleProject={toggleProject}
            copyToClipboard={copyToClipboard}
          />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab connectedPlatforms={connectedPlatforms} />
        </TabsContent>

        <TabsContent value="facebook" className="space-y-4">
          <FacebookTab showTokens={showTokens} copyToClipboard={copyToClipboard} />
        </TabsContent>

        <TabsContent value="instagram" className="space-y-4">
          <InstagramTab />
        </TabsContent>

        <TabsContent value="threads" className="space-y-4">
          <ThreadsTab />
        </TabsContent>

        <TabsContent value="linkedin" className="space-y-4">
          <LinkedInTab showTokens={showTokens} />
        </TabsContent>

        <TabsContent value="youtube" className="space-y-4">
          <YouTubeTab />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <PendingTab pendingPlatforms={pendingPlatforms} />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
};

export default SocialMediaConnections;
