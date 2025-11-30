import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Eye, 
  Users, 
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Target
} from 'lucide-react';

interface KeywordRanking {
  keyword: string;
  position: number;
  previousPosition: number;
  searchVolume: number;
  trend: 'up' | 'down' | 'stable';
  competition: 'low' | 'medium' | 'high';
}

interface PageMetrics {
  url: string;
  title: string;
  seoScore: number;
  organicTraffic: number;
  bounceRate: number;
  conversions: number;
}

interface SEOIssue {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  pageUrl: string;
  status: 'open' | 'in_progress' | 'resolved';
}

export const SEODashboard: React.FC = () => {
  const [keywordRankings, setKeywordRankings] = useState<KeywordRanking[]>([]);
  const [pageMetrics, setPageMetrics] = useState<PageMetrics[]>([]);
  const [seoIssues, setSeoIssues] = useState<SEOIssue[]>([]);
  const [loading, setLoading] = useState(true);

  // Sample data - replace with real API calls
  useEffect(() => {
    // Simulate API calls
    setTimeout(() => {
      setKeywordRankings([
        { keyword: 'sabo arena', position: 1, previousPosition: 2, searchVolume: 8900, trend: 'up', competition: 'low' },
        { keyword: 'gaming platform vietnam', position: 15, previousPosition: 18, searchVolume: 2400, trend: 'up', competition: 'medium' },
        { keyword: 'esports vietnam', position: 8, previousPosition: 12, searchVolume: 5600, trend: 'up', competition: 'high' },
        { keyword: 'billiards vietnam', position: 3, previousPosition: 4, searchVolume: 1800, trend: 'down', competition: 'low' },
        { keyword: 'ai gaming automation', position: 25, previousPosition: 30, searchVolume: 890, trend: 'up', competition: 'medium' }
      ]);

      setPageMetrics([
        { url: '/blog/esports-guide-2025', title: 'Complete Esports Guide 2025', seoScore: 92, organicTraffic: 15420, bounceRate: 35.2, conversions: 89 },
        { url: '/blog/ai-gaming-automation', title: 'AI Gaming Automation', seoScore: 88, organicTraffic: 8950, bounceRate: 42.1, conversions: 45 },
        { url: '/tournaments/championship-2025', title: 'Championship Tournament 2025', seoScore: 85, organicTraffic: 12300, bounceRate: 28.7, conversions: 156 },
        { url: '/blog/billiards-techniques', title: 'Advanced Billiards Techniques', seoScore: 73, organicTraffic: 3420, bounceRate: 55.8, conversions: 12 }
      ]);

      setSeoIssues([
        { id: '1', type: 'technical', severity: 'high', description: 'Missing meta descriptions on 5 pages', pageUrl: '/blog/*', status: 'open' },
        { id: '2', type: 'content', severity: 'medium', description: 'Low content quality score', pageUrl: '/blog/old-post', status: 'in_progress' },
        { id: '3', type: 'performance', severity: 'critical', description: 'Page load time > 3 seconds', pageUrl: '/tournaments', status: 'open' }
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const getTrendIcon = (trend: string, positionChange: number) => {
    if (trend === 'up' || positionChange > 0) {
      return <ArrowUp className="w-4 h-4 text-green-500" />;
    } else if (trend === 'down' || positionChange < 0) {
      return <ArrowDown className="w-4 h-4 text-red-500" />;
    }
    return <div className="w-4 h-4" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getCompetitionColor = (competition: string) => {
    switch (competition) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading SEO Dashboard...</p>
        </div>
      </div>
    );
  }

  const averagePosition = keywordRankings.reduce((sum, kw) => sum + kw.position, 0) / keywordRankings.length;
  const totalTraffic = pageMetrics.reduce((sum, page) => sum + page.organicTraffic, 0);
  const averageSEOScore = pageMetrics.reduce((sum, page) => sum + page.seoScore, 0) / pageMetrics.length;
  const criticalIssues = seoIssues.filter(issue => issue.severity === 'critical').length;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Keyword Position</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averagePosition.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {keywordRankings.filter(kw => kw.trend === 'up').length} keywords improving
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organic Traffic</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTraffic.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg SEO Score</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageSEOScore.toFixed(0)}/100</div>
            <Progress value={averageSEOScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalIssues}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="keywords" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Keywords Tab */}
        <TabsContent value="keywords">
          <Card>
            <CardHeader>
              <CardTitle>Keyword Rankings</CardTitle>
              <CardDescription>Track your keyword positions and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {keywordRankings.map((keyword, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{keyword.keyword}</h4>
                        <Badge className={getCompetitionColor(keyword.competition)}>
                          {keyword.competition}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Search Volume: {keyword.searchVolume.toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        <span className="text-2xl font-bold">#{keyword.position}</span>
                        {getTrendIcon(keyword.trend, keyword.previousPosition - keyword.position)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {keyword.previousPosition > keyword.position ? '+' : ''}
                        {keyword.previousPosition - keyword.position} from #{keyword.previousPosition}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pages Tab */}
        <TabsContent value="pages">
          <Card>
            <CardHeader>
              <CardTitle>Page Performance</CardTitle>
              <CardDescription>SEO performance metrics for your pages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pageMetrics.map((page, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{page.title}</h4>
                      <p className="text-sm text-muted-foreground">{page.url}</p>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold">{page.seoScore}</div>
                        <div className="text-xs text-muted-foreground">SEO Score</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">{page.organicTraffic.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Traffic</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">{page.bounceRate}%</div>
                        <div className="text-xs text-muted-foreground">Bounce Rate</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">{page.conversions}</div>
                        <div className="text-xs text-muted-foreground">Conversions</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues">
          <Card>
            <CardHeader>
              <CardTitle>SEO Issues</CardTitle>
              <CardDescription>Issues that need attention to improve SEO performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {seoIssues.map((issue) => (
                  <div key={issue.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getSeverityColor(issue.severity)}>
                          {issue.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{issue.type}</Badge>
                      </div>
                      <h4 className="font-medium">{issue.description}</h4>
                      <p className="text-sm text-muted-foreground">{issue.pageUrl}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {issue.status === 'resolved' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : issue.status === 'in_progress' ? (
                        <Clock className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <Button size="sm" variant="outline">
                        Fix
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Wins</CardTitle>
                <CardDescription>Easy improvements for immediate SEO gains</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Optimize meta descriptions</p>
                      <p className="text-sm text-muted-foreground">5 pages missing descriptions - estimated 15% CTR boost</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Target long-tail keywords</p>
                      <p className="text-sm text-muted-foreground">23 opportunities for easy ranking improvements</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-purple-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Internal linking</p>
                      <p className="text-sm text-muted-foreground">Add 15 internal links to boost page authority</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Opportunities</CardTitle>
                <CardDescription>Suggested topics based on keyword gaps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded">
                    <p className="font-medium">AI in Esports 2025</p>
                    <p className="text-sm text-muted-foreground">Search Volume: 2,400 • Competition: Medium</p>
                  </div>
                  <div className="p-3 border rounded">
                    <p className="font-medium">Vietnam Gaming Industry Report</p>
                    <p className="text-sm text-muted-foreground">Search Volume: 1,800 • Competition: Low</p>
                  </div>
                  <div className="p-3 border rounded">
                    <p className="font-medium">Professional Gaming Setup Guide</p>
                    <p className="text-sm text-muted-foreground">Search Volume: 3,200 • Competition: Medium</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SEODashboard;