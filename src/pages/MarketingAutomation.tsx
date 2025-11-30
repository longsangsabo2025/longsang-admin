import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { n8nMarketing as n8nService } from "@/services/n8n";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  Rocket,
  Settings,
  TrendingUp,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  platforms: string[];
  created_at: string;
  scheduled_at?: string;
}

export function MarketingAutomation() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Form state for social media campaign
  const [socialContent, setSocialContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledTime, setScheduledTime] = useState("");

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    try {
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error("Error loading campaigns:", error);
    }
  }

  async function handleSocialMediaCampaign() {
    if (!socialContent || selectedPlatforms.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please provide content and select at least one platform",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create campaign in database
      const { data: campaign, error: dbError } = await supabase
        .from("marketing_campaigns")
        .insert({
          name: `Social Campaign - ${new Date().toLocaleDateString()}`,
          type: "social_media",
          status: scheduledTime ? "scheduled" : "running",
          content: socialContent,
          platforms: selectedPlatforms,
          scheduled_at: scheduledTime || null,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Trigger n8n workflow
      const result = await n8nService.createSocialMediaCampaign({
        content: socialContent,
        platforms: selectedPlatforms as any,
        scheduledTime: scheduledTime || undefined,
      });

      if (result.success) {
        toast({
          title: "🚀 Campaign Launched!",
          description: `Your content is being posted to ${selectedPlatforms.join(", ")}`,
        });

        // Update campaign with n8n execution ID
        await supabase
          .from("marketing_campaigns")
          .update({
            n8n_execution_id: result.data?.executionId,
            status: "running",
          })
          .eq("id", campaign.id);

        // Reload campaigns
        loadCampaigns();

        // Reset form
        setSocialContent("");
        setSelectedPlatforms([]);
        setScheduledTime("");
      } else {
        throw new Error(result.error || "Failed to launch campaign");
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast({
        title: "Campaign Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function togglePlatform(platform: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "running":
        return <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "running":
        return "bg-yellow-100 text-yellow-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Rocket className="h-8 w-8 text-primary" />
            Marketing Automation
          </h1>
          <p className="text-muted-foreground mt-1">
            Multi-platform marketing powered by n8n and AI
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={loadCampaigns}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Active Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.filter((c) => c.status === "running").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Total Reach
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Engagement Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.filter((c) => c.status === "scheduled").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="create" className="space-y-4">
        <TabsList>
          <TabsTrigger value="create">Create Campaign</TabsTrigger>
          <TabsTrigger value="campaigns">My Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
        </TabsList>

        {/* Create Campaign Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Social Media Campaign
              </CardTitle>
              <CardDescription>
                Post to multiple platforms simultaneously with AI optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your post content here... AI will optimize it for each platform!"
                  rows={6}
                  value={socialContent}
                  onChange={(e) => setSocialContent(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  💡 Tip: AI will automatically adjust tone, length, and hashtags for each platform
                </p>
              </div>

              <div className="space-y-2">
                <Label>Platforms</Label>
                <div className="flex gap-2 flex-wrap">
                  {["linkedin", "facebook", "twitter", "instagram"].map((platform) => (
                    <Button
                      key={platform}
                      variant={selectedPlatforms.includes(platform) ? "default" : "outline"}
                      size="sm"
                      onClick={() => togglePlatform(platform)}
                    >
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule">Schedule (Optional)</Label>
                <Input
                  id="schedule"
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>

              <Button onClick={handleSocialMediaCampaign} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Zap className="h-4 w-4 mr-2 animate-spin" />
                    Launching Campaign...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Launch Campaign
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Campaign
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Send targeted emails with Mautic integration
                </p>
                <Button variant="outline" size="sm" className="mt-3 w-full">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Content Repurposing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Turn one post into multiple formats</p>
                <Button variant="outline" size="sm" className="mt-3 w-full">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Lead Nurturing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Automated drip campaigns for leads</p>
                <Button variant="outline" size="sm" className="mt-3 w-full">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Campaigns</CardTitle>
              <CardDescription>View and manage your marketing campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <div className="text-center py-12">
                  <Rocket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No campaigns yet. Create your first one!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(campaign.status)}
                          <h3 className="font-semibold">{campaign.name}</h3>
                          <Badge variant="secondary" className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Platforms: {campaign.platforms.join(", ")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created: {new Date(campaign.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Campaign Analytics
              </CardTitle>
              <CardDescription>Track your marketing performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Analytics dashboard coming soon. Will include:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Reach and impressions across all platforms</li>
                  <li>• Engagement rates and trends</li>
                  <li>• Best performing content</li>
                  <li>• Optimal posting times</li>
                  <li>• ROI tracking</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Automated Workflows
              </CardTitle>
              <CardDescription>Manage your n8n automation workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Multi-Platform Social Posting</h3>
                    <p className="text-sm text-muted-foreground">
                      Automatically post to LinkedIn, Facebook, Twitter
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg opacity-50">
                  <div>
                    <h3 className="font-semibold">Email Welcome Series</h3>
                    <p className="text-sm text-muted-foreground">
                      5-email drip campaign for new leads
                    </p>
                  </div>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg opacity-50">
                  <div>
                    <h3 className="font-semibold">Content Repurposing</h3>
                    <p className="text-sm text-muted-foreground">
                      Turn blog posts into social content
                    </p>
                  </div>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-4" asChild>
                <a href="http://localhost:5678" target="_blank" rel="noopener noreferrer">
                  <Settings className="h-4 w-4 mr-2" />
                  Open n8n Dashboard
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
