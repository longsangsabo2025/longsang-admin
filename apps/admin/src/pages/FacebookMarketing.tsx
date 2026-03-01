/**
 * Facebook Marketing Dashboard
 * Quản lý quảng cáo, pages, insights và automation
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Facebook,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  MousePointer,
  Calendar,
  Send,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  PlusCircle,
  Image,
  Video,
  Clock,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Page {
  id: string;
  name: string;
  category: string;
  fan_count?: number;
  followers_count?: number;
  access_token?: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
  created_time: string;
}

interface InsightMetric {
  name: string;
  period: string;
  values: Array<{ value: number; end_time: string }>;
}

interface AdsInsight {
  impressions: string;
  clicks: string;
  ctr: string;
  cpc: string;
  cpm: string;
  spend: string;
  reach: string;
}

const FacebookMarketingDashboard: React.FC = () => {
  // State
  const [connectionStatus, setConnectionStatus] = useState<
    'checking' | 'connected' | 'not_configured' | 'error'
  >('checking');
  const [statusMessage, setStatusMessage] = useState('');
  const [pages, setPages] = useState<Page[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pageInsights, setPageInsights] = useState<InsightMetric[]>([]);
  const [adsInsights, setAdsInsights] = useState<AdsInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPage, setSelectedPage] = useState<string>('');

  // Post Form
  const [postMessage, setPostMessage] = useState('');
  const [postLink, setPostLink] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);

  // Campaign Form
  const [campaignName, setCampaignName] = useState('');
  const [campaignObjective, setCampaignObjective] = useState('OUTCOME_AWARENESS');
  const [campaignBudget, setCampaignBudget] = useState('');

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setConnectionStatus('checking');
      const response = await fetch(`${API_BASE}/api/facebook/health`);
      const data = await response.json();

      if (data.status === 'connected') {
        setConnectionStatus('connected');
        setStatusMessage(`Connected as: ${data.account?.name || 'Unknown'}`);
        loadPages();
        loadCampaigns();
        loadAdsInsights();
      } else if (data.status === 'not_configured') {
        setConnectionStatus('not_configured');
        setStatusMessage('Facebook credentials not configured');
      } else {
        setConnectionStatus('error');
        setStatusMessage(data.message || 'Connection failed');
      }
    } catch (error) {
      setConnectionStatus('error');
      setStatusMessage('Failed to connect to API');
    }
  };

  const loadPages = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/facebook/pages`);
      const data = await response.json();
      if (data.success) {
        setPages(data.pages);
        if (data.pages.length > 0 && !selectedPage) {
          setSelectedPage(data.pages[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load pages:', error);
    }
  };

  const loadCampaigns = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/facebook/ads/campaigns`);
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  };

  const loadPageInsights = async (pageId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/facebook/pages/${pageId}/insights`);
      const data = await response.json();
      if (data.success) {
        setPageInsights(data.insights);
      }
    } catch (error) {
      console.error('Failed to load insights:', error);
    }
  };

  const loadAdsInsights = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/facebook/ads/insights?date_preset=last_7d`);
      const data = await response.json();
      if (data.success && data.summary) {
        setAdsInsights(data.summary);
      }
    } catch (error) {
      console.error('Failed to load ads insights:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!postMessage || !selectedPage) return;

    setLoading(true);
    try {
      const endpoint = isScheduled
        ? `${API_BASE}/api/facebook/schedule`
        : `${API_BASE}/api/facebook/pages/${selectedPage}/post`;

      const body: any = {
        message: postMessage,
        pageId: selectedPage,
      };

      if (postLink) body.link = postLink;

      if (isScheduled && scheduleTime) {
        body.scheduled_publish_time = Math.floor(new Date(scheduleTime).getTime() / 1000);
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        alert(isScheduled ? 'Post scheduled successfully!' : 'Post published successfully!');
        setPostMessage('');
        setPostLink('');
        setScheduleTime('');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to create post');
    }
    setLoading(false);
  };

  const handleCreateCampaign = async () => {
    if (!campaignName) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/facebook/ads/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          objective: campaignObjective,
          daily_budget: campaignBudget ? parseInt(campaignBudget) * 100 : undefined, // Convert to cents
          status: 'PAUSED',
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Campaign created successfully!');
        setCampaignName('');
        setCampaignBudget('');
        loadCampaigns();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to create campaign');
    }
    setLoading(false);
  };

  const formatNumber = (num: string | number) => {
    return new Intl.NumberFormat('vi-VN').format(Number(num) || 0);
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Number(amount) || 0);
  };

  // Render connection status
  const renderConnectionStatus = () => {
    const statusConfig = {
      checking: { icon: RefreshCw, color: 'text-yellow-500', bg: 'bg-yellow-50' },
      connected: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
      not_configured: { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50' },
      error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
    };

    const config = statusConfig[connectionStatus];
    const Icon = config.icon;

    return (
      <Alert className={config.bg}>
        <Icon
          className={`h-4 w-4 ${config.color} ${connectionStatus === 'checking' ? 'animate-spin' : ''}`}
        />
        <AlertDescription className="flex items-center justify-between">
          <span>{statusMessage || 'Checking connection...'}</span>
          <Button variant="outline" size="sm" onClick={checkConnection}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Facebook className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Facebook Marketing</h1>
            <p className="text-gray-500">Quản lý quảng cáo, pages và automation</p>
          </div>
        </div>
        <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
          {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
        </Badge>
      </div>

      {/* Connection Status */}
      {renderConnectionStatus()}

      {connectionStatus === 'not_configured' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-700">⚙️ Cấu hình Facebook API</CardTitle>
            <CardDescription>
              Thêm các biến sau vào file <code>.env.local</code>:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
              {`# Facebook Marketing API
VITE_FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_PAGE_ACCESS_TOKEN=your_page_token
FACEBOOK_PAGE_ID=your_page_id

# Để chạy Ads (tùy chọn)
FACEBOOK_AD_ACCOUNT_ID=your_ad_account_id
FACEBOOK_BUSINESS_ID=your_business_id
FACEBOOK_PIXEL_ID=your_pixel_id`}
            </pre>
          </CardContent>
        </Card>
      )}

      {connectionStatus === 'connected' && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger value="pages">
              <Users className="h-4 w-4 mr-2" /> Pages
            </TabsTrigger>
            <TabsTrigger value="ads">
              <TrendingUp className="h-4 w-4 mr-2" /> Ads
            </TabsTrigger>
            <TabsTrigger value="publish">
              <Send className="h-4 w-4 mr-2" /> Publish
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <Calendar className="h-4 w-4 mr-2" /> Schedule
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Impressions</CardTitle>
                  <Eye className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumber(adsInsights?.impressions || 0)}
                  </div>
                  <p className="text-xs text-gray-500">Last 7 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Clicks</CardTitle>
                  <MousePointer className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(adsInsights?.clicks || 0)}</div>
                  <p className="text-xs text-gray-500">CTR: {adsInsights?.ctr || '0'}%</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Reach</CardTitle>
                  <Users className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(adsInsights?.reach || 0)}</div>
                  <p className="text-xs text-gray-500">Unique users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Spend</CardTitle>
                  <DollarSign className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(adsInsights?.spend || 0)}
                  </div>
                  <p className="text-xs text-gray-500">
                    CPC: {formatCurrency(adsInsights?.cpc || 0)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Pages Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Managed Pages ({pages.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {pages.map((page) => (
                    <Card key={page.id} className="bg-gray-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{page.name}</CardTitle>
                        <CardDescription>{page.category}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Fans:</span>{' '}
                            <strong>{formatNumber(page.fan_count || 0)}</strong>
                          </div>
                          <div>
                            <span className="text-gray-500">Followers:</span>{' '}
                            <strong>{formatNumber(page.followers_count || 0)}</strong>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pages Tab */}
          <TabsContent value="pages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Page Insights</CardTitle>
                <CardDescription>Select a page to view detailed analytics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={selectedPage}
                  onValueChange={(value) => {
                    setSelectedPage(value);
                    loadPageInsights(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a page" />
                  </SelectTrigger>
                  <SelectContent>
                    {pages.map((page) => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {pageInsights.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {pageInsights.map((insight, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500">
                          {insight.name.replace('page_', '').replace(/_/g, ' ')}
                        </div>
                        <div className="text-xl font-bold">
                          {formatNumber(insight.values?.[0]?.value || 0)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ads Tab */}
          <TabsContent value="ads" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Campaigns List */}
              <Card>
                <CardHeader>
                  <CardTitle>Campaigns ({campaigns.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{campaign.name}</div>
                          <div className="text-sm text-gray-500">{campaign.objective}</div>
                        </div>
                        <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                      </div>
                    ))}
                    {campaigns.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No campaigns yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Create Campaign */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    <PlusCircle className="h-5 w-5 inline mr-2" />
                    Create Campaign
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Campaign Name</Label>
                    <Input
                      placeholder="My Campaign"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Objective</Label>
                    <Select value={campaignObjective} onValueChange={setCampaignObjective}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OUTCOME_AWARENESS">Brand Awareness</SelectItem>
                        <SelectItem value="OUTCOME_ENGAGEMENT">Engagement</SelectItem>
                        <SelectItem value="OUTCOME_TRAFFIC">Traffic</SelectItem>
                        <SelectItem value="OUTCOME_LEADS">Leads</SelectItem>
                        <SelectItem value="OUTCOME_SALES">Sales</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Daily Budget (VND)</Label>
                    <Input
                      type="number"
                      placeholder="100000"
                      value={campaignBudget}
                      onChange={(e) => setCampaignBudget(e.target.value)}
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleCreateCampaign}
                    disabled={loading || !campaignName}
                  >
                    {loading ? 'Creating...' : 'Create Campaign'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Publish Tab */}
          <TabsContent value="publish">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Send className="h-5 w-5 inline mr-2" />
                  Publish to Page
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Page</Label>
                  <Select value={selectedPage} onValueChange={setSelectedPage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a page" />
                    </SelectTrigger>
                    <SelectContent>
                      {pages.map((page) => (
                        <SelectItem key={page.id} value={page.id}>
                          {page.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    placeholder="What's on your mind?"
                    rows={4}
                    value={postMessage}
                    onChange={(e) => setPostMessage(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Link (optional)</Label>
                  <Input
                    placeholder="https://example.com"
                    value={postLink}
                    onChange={(e) => setPostLink(e.target.value)}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => {
                      setIsScheduled(false);
                      handleCreatePost();
                    }}
                    disabled={loading || !postMessage || !selectedPage}
                    className="flex-1"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Publish Now
                  </Button>

                  <Button variant="outline" className="flex-1" disabled>
                    <Image className="h-4 w-4 mr-2" />
                    Add Photo
                  </Button>

                  <Button variant="outline" className="flex-1" disabled>
                    <Video className="h-4 w-4 mr-2" />
                    Add Video
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Clock className="h-5 w-5 inline mr-2" />
                  Schedule Post
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Page</Label>
                  <Select value={selectedPage} onValueChange={setSelectedPage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a page" />
                    </SelectTrigger>
                    <SelectContent>
                      {pages.map((page) => (
                        <SelectItem key={page.id} value={page.id}>
                          {page.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    placeholder="What's on your mind?"
                    rows={4}
                    value={postMessage}
                    onChange={(e) => setPostMessage(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Link (optional)</Label>
                  <Input
                    placeholder="https://example.com"
                    value={postLink}
                    onChange={(e) => setPostLink(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Schedule Time</Label>
                  <Input
                    type="datetime-local"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    min={new Date(Date.now() + 15 * 60 * 1000).toISOString().slice(0, 16)}
                  />
                </div>

                <Button
                  onClick={() => {
                    setIsScheduled(true);
                    handleCreatePost();
                  }}
                  disabled={loading || !postMessage || !selectedPage || !scheduleTime}
                  className="w-full"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Post
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default FacebookMarketingDashboard;
