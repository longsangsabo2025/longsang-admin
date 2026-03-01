import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  Globe,
  Settings,
  BarChart3,
  Link,
  FileText,
  Sparkles,
  Wand2,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DomainManagement } from '@/components/seo/DomainManagement';
import { IndexingMonitor } from '@/components/seo/IndexingMonitor';
import { SEOSettings } from '@/components/seo/SEOSettings';
import { SitemapGenerator } from '@/components/seo/SitemapGenerator';
import { KeywordTracker } from '@/components/seo/KeywordTracker';
import { SEOAnalytics } from '@/components/seo/SEOAnalytics';
import { AIAutoSEO } from '@/components/seo/AIAutoSEO';
import { SEOContentGenerator } from '@/components/seo/SEOContentGenerator';
import { useToast } from '@/hooks/use-toast';

const API_BASE = 'http://localhost:3001/api';

interface SEOStats {
  totalDomains: number;
  totalClicks: number;
  totalImpressions: number;
  avgPosition: number;
  topRankings: number;
  loading: boolean;
}

export default function AdminSEOCenter() {
  const { toast } = useToast();
  const [stats, setStats] = useState<SEOStats>({
    totalDomains: 0,
    totalClicks: 0,
    totalImpressions: 0,
    avgPosition: 0,
    topRankings: 0,
    loading: true,
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchSEOStats = async () => {
    try {
      // Fetch verified sites
      const sitesRes = await fetch(`${API_BASE}/google/search-console/sites`);
      const sitesData = await sitesRes.json();

      let totalClicks = 0;
      let totalImpressions = 0;
      let totalPosition = 0;
      let topRankings = 0;
      let siteCount = 0;

      if (sitesData.success && sitesData.sites?.length > 0) {
        // Fetch performance for each site
        for (const site of sitesData.sites) {
          try {
            const perfRes = await fetch(`${API_BASE}/google/search-console/performance`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                siteUrl: site.siteUrl,
                startDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
              }),
            });
            const perfData = await perfRes.json();

            if (perfData.success && perfData.summary) {
              totalClicks += perfData.summary.totalClicks || 0;
              totalImpressions += perfData.summary.totalImpressions || 0;
              totalPosition += perfData.summary.avgPosition || 0;
              siteCount++;
            }

            // Fetch keywords for top rankings count
            const kwRes = await fetch(`${API_BASE}/google/search-console/keywords`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                siteUrl: site.siteUrl,
                startDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                rowLimit: 500,
              }),
            });
            const kwData = await kwRes.json();

            if (kwData.success && kwData.rankingBreakdown) {
              topRankings += kwData.rankingBreakdown.top10 || 0;
            }
          } catch (siteErr) {
            console.warn(`Failed to fetch data for ${site.siteUrl}:`, siteErr);
          }
        }

        setStats({
          totalDomains: sitesData.sites.length,
          totalClicks,
          totalImpressions,
          avgPosition: siteCount > 0 ? Math.round((totalPosition / siteCount) * 10) / 10 : 0,
          topRankings,
          loading: false,
        });
      } else {
        setStats((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Failed to fetch SEO stats:', error);
      toast({
        title: 'Lỗi tải dữ liệu SEO',
        description: 'Không thể kết nối Search Console. Kiểm tra lại API key.',
        variant: 'destructive',
      });
      setStats((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchSEOStats();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSEOStats();
    setRefreshing(false);
    toast({
      title: 'Đã cập nhật',
      description: 'Dữ liệu SEO đã được làm mới từ Google Search Console',
    });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-primary" />
            SEO Management Center
          </h1>
          <p className="text-muted-foreground mt-2">
            Quản lý SEO tự động cho tất cả domains - Google Indexing, Bing, Sitemap & Analytics
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing || stats.loading}
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh Data
        </Button>
      </div>

      {/* Quick Stats - Real Data from Search Console */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tổng Domains</p>
              {stats.loading ? (
                <Loader2 className="w-6 h-6 animate-spin mt-1" />
              ) : (
                <p className="text-2xl font-bold">{stats.totalDomains}</p>
              )}
            </div>
            <Globe className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Clicks (28d)</p>
              {stats.loading ? (
                <Loader2 className="w-6 h-6 animate-spin mt-1" />
              ) : (
                <p className="text-2xl font-bold">{formatNumber(stats.totalClicks)}</p>
              )}
            </div>
            <Link className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Impressions (28d)</p>
              {stats.loading ? (
                <Loader2 className="w-6 h-6 animate-spin mt-1" />
              ) : (
                <p className="text-2xl font-bold">{formatNumber(stats.totalImpressions)}</p>
              )}
            </div>
            <BarChart3 className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Top 10 Rankings</p>
              {stats.loading ? (
                <Loader2 className="w-6 h-6 animate-spin mt-1" />
              ) : (
                <p className="text-2xl font-bold">{stats.topRankings}</p>
              )}
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="ai-auto" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="ai-auto" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Auto
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="domains" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Domains
          </TabsTrigger>
          <TabsTrigger value="indexing" className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            Indexing
          </TabsTrigger>
          <TabsTrigger value="sitemap" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Sitemap
          </TabsTrigger>
          <TabsTrigger value="keywords" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Keywords
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-auto" className="space-y-4">
          <AIAutoSEO />
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <SEOContentGenerator />
        </TabsContent>

        <TabsContent value="domains" className="space-y-4">
          <DomainManagement />
        </TabsContent>

        <TabsContent value="indexing" className="space-y-4">
          <IndexingMonitor />
        </TabsContent>

        <TabsContent value="sitemap" className="space-y-4">
          <SitemapGenerator />
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          <KeywordTracker />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <SEOAnalytics />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <SEOSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
