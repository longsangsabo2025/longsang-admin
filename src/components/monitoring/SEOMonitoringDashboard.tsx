import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, BarChart3, Globe, Target, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export const SEOMonitoringDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Mock data for demonstration (since tables might not be accessible yet)
  const [dashboardData, setDashboardData] = useState({
    keywords: [
      { keyword: 'longsang automation', position: 1, change: 2, volume: 1200 },
      { keyword: 'sabo arena', position: 3, change: -1, volume: 800 },
      { keyword: 'gaming platform vietnam', position: 8, change: 5, volume: 2100 },
      { keyword: 'ai automation vietnam', position: 12, change: 0, volume: 950 },
      { keyword: 'billiards tournament', position: 6, change: 3, volume: 1500 },
    ],
    pages: [
      { url: 'longsang.org/arena', title: 'SABO ARENA Platform', score: 95, traffic: 1500 },
      {
        url: 'longsang.org/arena/tournaments',
        title: 'Gaming Tournaments',
        score: 88,
        traffic: 800,
      },
      { url: 'longsang.org/automation', title: 'AI Automation', score: 92, traffic: 1200 },
      { url: 'longsang.org/arena/blog', title: 'Gaming Blog', score: 85, traffic: 600 },
    ],
    issues: [
      { type: 'Page Speed', severity: 'medium', count: 3 },
      { type: 'Meta Description', severity: 'high', count: 2 },
      { type: 'Alt Text', severity: 'low', count: 5 },
    ],
    summary: {
      totalTraffic: 4100,
      avgPosition: 6.2,
      avgScore: 90,
      openIssues: 10,
      criticalIssues: 2,
    },
  });

  const refreshMonitoring = async () => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In production, this would fetch real data from SEO tables
      // For now, simulate some random changes
      setDashboardData((prev) => ({
        ...prev,
        keywords: prev.keywords.map((kw) => ({
          ...kw,
          position: Math.max(1, kw.position + Math.floor(Math.random() * 6) - 3),
          traffic: kw.volume + Math.floor(Math.random() * 200) - 100,
        })),
        summary: {
          ...prev.summary,
          totalTraffic: prev.summary.totalTraffic + Math.floor(Math.random() * 400) - 200,
          avgPosition: Math.max(1, prev.summary.avgPosition + Math.random() * 2 - 1),
        },
      }));

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-refresh every 5 minutes
    const interval = setInterval(refreshMonitoring, 300000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getPositionTrend = (change: number) => {
    if (change > 0) return { icon: TrendingUp, color: 'text-green-600', text: `+${change}` };
    if (change < 0) return { icon: TrendingDown, color: 'text-red-600', text: `${change}` };
    return { icon: Target, color: 'text-gray-500', text: '0' };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">📊 Bảng Điều Khiển SEO</h1>
          <p className="text-muted-foreground">
            Theo dõi hiệu suất SEO thời gian thực cho longsang.org/arena
          </p>
        </div>
        <Button
          onClick={refreshMonitoring}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Zap className="h-4 w-4" />
          {isLoading ? 'Đang cập nhật...' : 'Làm Mới Dữ Liệu'}
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lưu Lượng Truy Cập</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.summary.totalTraffic.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Lượt truy cập/tháng</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vị Trí Trung Bình</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.summary.avgPosition.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Trên tất cả từ khóa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Điểm SEO TB</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.summary.avgScore}/100</div>
            <p className="text-xs text-muted-foreground">Tối ưu hóa trang</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vấn Đề Mở</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.summary.openIssues}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.summary.criticalIssues} nghiêm trọng
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Keywords Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Xếp Hạng Từ Khóa</CardTitle>
          <CardDescription>Theo dõi vị trí từ khóa của bạn trong kết quả tìm kiếm</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.keywords.map((keyword, index) => {
              const trend = getPositionTrend(keyword.change);
              const TrendIcon = trend.icon;

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{keyword.keyword}</div>
                    <div className="text-sm text-muted-foreground">
                      {keyword.volume.toLocaleString()} tìm kiếm/tháng
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">#{keyword.position}</div>
                    <div className={`flex items-center gap-1 text-sm ${trend.color}`}>
                      <TrendIcon className="h-3 w-3" />
                      {trend.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Page Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Hiệu Suất Trang</CardTitle>
          <CardDescription>Điểm SEO và lưu lượng truy cập theo từng trang</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.pages.map((page, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{page.title}</div>
                  <div className="text-sm text-muted-foreground">{page.url}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold">{page.score}/100</div>
                    <div className="text-xs text-muted-foreground">Điểm SEO</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{page.traffic.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Lượt truy cập/tháng</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technical Issues */}
      <Card>
        <CardHeader>
          <CardTitle>Vấn Đề Kỹ Thuật</CardTitle>
          <CardDescription>Các vấn đề SEO cần được chú ý</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboardData.issues.map((issue, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{issue.type}</div>
                    <div className="text-sm text-muted-foreground">
                      {issue.count} trang bị ảnh hưởng
                    </div>
                  </div>
                </div>
                <Badge variant={getSeverityColor(issue.severity) as any}>
                  {issue.severity === 'high'
                    ? 'Cao'
                    : issue.severity === 'medium'
                      ? 'Trung bình'
                      : 'Thấp'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-center text-sm text-muted-foreground">
          Cập nhật lần cuối: {lastUpdated.toLocaleString('vi-VN')}
        </div>
      )}
    </div>
  );
};
