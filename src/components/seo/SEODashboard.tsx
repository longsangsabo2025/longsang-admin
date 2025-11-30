/**
 * 📊 SEO Dashboard Component
 * Hiển thị và quản lý tất cả hoạt động SEO
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  Search,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SEODashboard() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [keywords, setKeywords] = useState<any[]>([]);

  // Kiểm tra connection khi load
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      // Import dynamic để tránh build errors
      const { testConnection } = await import('@/lib/seo/google-api-client');
      const result = await testConnection();

      setIsConnected(result.success);

      if (result.success) {
        toast({
          title: '✅ Kết nối Google API thành công',
          description: `Tìm thấy ${result.sites?.length || 0} websites`,
        });
      }
    } catch (error) {
      setIsConnected(false);
      toast({
        title: '❌ Chưa cấu hình Google API',
        description: 'Vui lòng thêm credentials vào .env',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPerformanceData = async () => {
    setIsLoading(true);
    try {
      const { searchConsoleAPI } = await import('@/lib/seo/google-api-client');
      const { autoSEOTasks } = await import('@/lib/seo/auto-seo-manager');

      const siteUrl = import.meta.env.GOOGLE_SEARCH_CONSOLE_PROPERTY_URL;
      const data = await autoSEOTasks.dailyPerformanceReport(siteUrl);

      setPerformanceData(data);

      toast({
        title: '✅ Đã cập nhật dữ liệu',
        description: 'Performance data đã được refresh',
      });
    } catch (error) {
      toast({
        title: '❌ Lỗi khi lấy dữ liệu',
        description: String(error),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitNewContent = async (urls: string[]) => {
    setIsLoading(true);
    try {
      const { autoSEOTasks } = await import('@/lib/seo/auto-seo-manager');
      const results = await autoSEOTasks.autoSubmitNewContent(urls);

      const successCount = results.filter((r) => r.status === 'success').length;

      toast({
        title: '✅ Đã submit lên Google',
        description: `${successCount}/${urls.length} URLs đã được submit thành công`,
      });
    } catch (error) {
      toast({
        title: '❌ Lỗi khi submit',
        description: String(error),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🎯 SEO Dashboard</h1>
          <p className="text-muted-foreground">Quản lý và tự động hóa SEO cho website</p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            {isConnected ? '✓ Connected' : '✗ Not Connected'}
          </Badge>

          <Button onClick={checkConnection} disabled={isLoading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Test Connection
          </Button>
        </div>
      </div>

      {!isConnected ? (
        <Card>
          <CardHeader>
            <CardTitle>⚙️ Cấu hình Google API</CardTitle>
            <CardDescription>
              Bạn cần setup Google credentials để sử dụng tính năng này
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">📋 Các bước setup:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Đọc file{' '}
                  <code className="bg-background px-2 py-1 rounded">GOOGLE_API_SETUP_GUIDE.md</code>
                </li>
                <li>Tạo Google Cloud Project & Service Account</li>
                <li>Download JSON credentials</li>
                <li>
                  Copy vào file <code className="bg-background px-2 py-1 rounded">.env.local</code>
                </li>
                <li>Restart development server</li>
              </ol>
            </div>

            <Button onClick={checkConnection} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Kiểm tra lại kết nối
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value="performance">
              <TrendingUp className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="keywords">
              <Search className="w-4 h-4 mr-2" />
              Keywords
            </TabsTrigger>
            <TabsTrigger value="indexing">
              <CheckCircle className="w-4 h-4 mr-2" />
              Indexing
            </TabsTrigger>
            <TabsTrigger value="automation">
              <Clock className="w-4 h-4 mr-2" />
              Automation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {performanceData?.totalClicks?.toLocaleString() || '0'}
                  </div>
                  <p className="text-xs text-muted-foreground">Last 7 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {performanceData?.totalImpressions?.toLocaleString() || '0'}
                  </div>
                  <p className="text-xs text-muted-foreground">Last 7 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Avg CTR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {performanceData?.avgCTR?.toFixed(2) || '0'}%
                  </div>
                  <p className="text-xs text-muted-foreground">Last 7 days</p>
                </CardContent>
              </Card>
            </div>

            <Button onClick={fetchPerformanceData} disabled={isLoading} className="w-full">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>📊 Top Performing Queries</CardTitle>
                <CardDescription>Các từ khóa đang hoạt động tốt nhất (7 ngày qua)</CardDescription>
              </CardHeader>
              <CardContent>
                {performanceData?.topQueries?.length > 0 ? (
                  <div className="space-y-3">
                    {performanceData.topQueries.map((query: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{query.query}</div>
                          <div className="text-sm text-muted-foreground">
                            Position: {query.position?.toFixed(1)} | CTR:{' '}
                            {(query.ctr * 100).toFixed(2)}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{query.clicks} clicks</div>
                          <div className="text-sm text-muted-foreground">
                            {query.impressions} impressions
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Click "Refresh Data" để xem dữ liệu
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keywords">
            <Card>
              <CardHeader>
                <CardTitle>🔍 Keyword Monitoring</CardTitle>
                <CardDescription>Theo dõi thứ hạng của các keywords quan trọng</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Feature đang được phát triển...
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="indexing">
            <Card>
              <CardHeader>
                <CardTitle>🚀 Quick Indexing</CardTitle>
                <CardDescription>
                  Submit URLs mới lên Google để được index nhanh hơn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">💡 Cách sử dụng:</h4>
                  <p className="text-sm text-muted-foreground">
                    Mỗi khi bạn publish content mới, sử dụng chức năng này để thông báo cho Google.
                    Google sẽ crawl và index nhanh hơn thay vì phải chờ tự nhiên.
                  </p>
                </div>

                <Button
                  onClick={() => {
                    const urls = [window.location.origin];
                    submitNewContent(urls);
                  }}
                  disabled={isLoading}
                  className="w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Homepage to Google
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automation">
            <Card>
              <CardHeader>
                <CardTitle>⚡ Tự động hóa SEO</CardTitle>
                <CardDescription>Các tác vụ SEO sẽ chạy tự động hàng ngày</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Daily Performance Report', status: 'active', nextRun: '6:00 AM' },
                    { name: 'Keyword Rankings Monitor', status: 'active', nextRun: '8:00 AM' },
                    { name: 'Ranking Drops Alert', status: 'active', nextRun: '10:00 AM' },
                    {
                      name: 'Weekly Analytics Summary',
                      status: 'active',
                      nextRun: 'Monday 9:00 AM',
                    },
                  ].map((task, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                          <div className="font-medium">{task.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Next run: {task.nextRun}
                          </div>
                        </div>
                      </div>
                      <Badge>{task.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
