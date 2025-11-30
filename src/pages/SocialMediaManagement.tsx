/**
 * =================================================================
 * SOCIAL MEDIA MANAGEMENT PAGE
 * =================================================================
 * Complete social media automation platform
 */

import { AutoPublishSettings } from "@/components/automation/AutoPublishSettings";
import { PlatformConnectionCard } from "@/components/social/PlatformConnectionCard";
import { SocialPostComposer } from "@/components/social/SocialPostComposer";
import { AutoPostScheduler } from "@/components/social/AutoPostScheduler";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSocialMediaManager } from "@/lib/social";
import type { BulkPostResponse, SocialPlatform } from "@/types/social-media";
import { Activity, MessageSquare, Settings, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { usePersistedState, useScrollRestore } from "@/hooks/usePersistedState";

export const SocialMediaManagement = () => {
  // Restore scroll & persist tab state
  useScrollRestore('social-media-management');
  const [activeTab, setActiveTab] = usePersistedState('social-media-tab', 'platforms');

  const manager = getSocialMediaManager();
  const [healthStatus, setHealthStatus] = useState({
    healthy: 0,
    warning: 0,
    error: 0,
    total: 0,
  });
  const [recentPosts, setRecentPosts] = useState<BulkPostResponse[]>([]);

  const allPlatforms: SocialPlatform[] = [
    "linkedin",
    "twitter",
    "facebook",
    "instagram",
    "youtube",
    "telegram",
    "discord",
  ];

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const health = await manager.getHealthStatus();
      setHealthStatus(health);
    } catch (error) {
      console.error("Failed to check health:", error);
    }
  };

  const handlePostSuccess = (result: BulkPostResponse) => {
    setRecentPosts((prev) => [result, ...prev].slice(0, 10));
    checkHealth(); // Refresh health status
  };

  const handleConnectionChange = () => {
    checkHealth(); // Refresh health status
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Social Media Automation</h1>
        <p className="text-muted-foreground">
          Connect and manage all your social media platforms in one place
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Platforms</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthStatus.total}</div>
            <p className="text-xs text-muted-foreground">{healthStatus.healthy} healthy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts Published</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentPosts.reduce((sum, post) => sum + post.summary.successful, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across {recentPosts.length} campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentPosts.length > 0
                ? Math.round(
                    (recentPosts.reduce((sum, post) => sum + post.summary.successful, 0) /
                      recentPosts.reduce((sum, post) => sum + post.summary.total, 0)) *
                      100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Last {recentPosts.length} campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthStatus.healthy === healthStatus.total && healthStatus.total > 0
                ? "✅ All Good"
                : healthStatus.error > 0
                ? "⚠️ Issues"
                : "🔌 Setup"}
            </div>
            <p className="text-xs text-muted-foreground">
              {healthStatus.error} errors, {healthStatus.warning} warnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="compose">
            <MessageSquare className="w-4 h-4 mr-2" />
            Compose Post
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Activity className="w-4 h-4 mr-2" />
            📅 Schedule
          </TabsTrigger>
          <TabsTrigger value="platforms">
            <Settings className="w-4 h-4 mr-2" />
            Platform Connections
          </TabsTrigger>
          <TabsTrigger value="auto-publish">
            <Activity className="w-4 h-4 mr-2" />
            Auto-Publish
          </TabsTrigger>
          <TabsTrigger value="history">
            <Activity className="w-4 h-4 mr-2" />
            Post History
          </TabsTrigger>
        </TabsList>

        {/* Compose Tab */}
        <TabsContent value="compose" className="space-y-4">
          <SocialPostComposer onPostSuccess={handlePostSuccess} />
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <AutoPostScheduler projectId="general" projectName="General" />
        </TabsContent>

        {/* Auto-Publish Tab */}
        <TabsContent value="auto-publish" className="space-y-4">
          <AutoPublishSettings />
        </TabsContent>

        {/* Connections Tab */}
        <TabsContent value="platforms" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Platform Connections</h2>
              <p className="text-muted-foreground">
                Connect your social media accounts to start posting
              </p>
            </div>
            <Button onClick={checkHealth} variant="outline">
              Refresh Status
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allPlatforms.map((platform) => (
              <PlatformConnectionCard
                key={platform}
                platform={platform}
                onConnect={handleConnectionChange}
                onDisconnect={handleConnectionChange}
              />
            ))}
          </div>

          {/* Setup Guide */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Need Help Getting Started?</CardTitle>
              <CardDescription>Follow these steps to connect your platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">📝 LinkedIn</h4>
                <p className="text-sm text-muted-foreground">
                  1. Go to LinkedIn Developers → Create App
                  <br />
                  2. Request permissions: r_liteprofile, w_member_social
                  <br />
                  3. Get OAuth 2.0 Access Token
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">𝕏 Twitter/X</h4>
                <p className="text-sm text-muted-foreground">
                  1. Go to Twitter Developer Portal → Create Project
                  <br />
                  2. Enable OAuth 2.0
                  <br />
                  3. Get Bearer Token or OAuth tokens
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">👥 Facebook</h4>
                <p className="text-sm text-muted-foreground">
                  1. Go to Facebook Developers → Create App
                  <br />
                  2. Get Page Access Token (for your Page)
                  <br />
                  3. Request pages_manage_posts permission
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">✈️ Telegram</h4>
                <p className="text-sm text-muted-foreground">
                  1. Talk to @BotFather on Telegram
                  <br />
                  2. Create bot with /newbot
                  <br />
                  3. Add bot as admin to your channel
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">🎮 Discord</h4>
                <p className="text-sm text-muted-foreground">
                  1. Go to Discord Server Settings → Integrations
                  <br />
                  2. Create Webhook
                  <br />
                  3. Copy Webhook URL
                </p>
              </div>

              <Button variant="link" className="p-0 h-auto" asChild>
                <a href="/docs/social-media-setup" target="_blank">
                  View Complete Setup Guide →
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Post History</h2>
            <p className="text-muted-foreground mb-6">Recent posts across all platforms</p>
          </div>

          {recentPosts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  Create your first post in the Compose tab to see your post history here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentPosts.map((post, index) => (
                <Card key={post.requestId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Post #{recentPosts.length - index}</CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {new Date(post.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <CardDescription>
                      Posted to {post.summary.total} platform(s) -{" "}
                      <span className="text-green-500">{post.summary.successful} successful</span>
                      {post.summary.failed > 0 && (
                        <span className="text-destructive">, {post.summary.failed} failed</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {post.results.map((result) => (
                        <div
                          key={result.platform}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">
                              {result.platform === "linkedin" && "💼"}
                              {result.platform === "twitter" && "𝕏"}
                              {result.platform === "facebook" && "👥"}
                              {result.platform === "instagram" && "📸"}
                              {result.platform === "youtube" && "▶️"}
                              {result.platform === "telegram" && "✈️"}
                              {result.platform === "discord" && "🎮"}
                            </span>
                            <div>
                              <p className="font-medium capitalize">{result.platform}</p>
                              <p className="text-sm text-muted-foreground">
                                {result.success ? "Published" : result.error?.message}
                              </p>
                            </div>
                          </div>
                          {result.success && result.postUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={result.postUrl} target="_blank" rel="noopener noreferrer">
                                View Post
                              </a>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialMediaManagement;
