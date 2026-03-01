import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  Trash2,
  Eye,
  Plus,
  RefreshCw,
  Send,
} from 'lucide-react';
import { usePersistedState, useScrollRestore } from '@/hooks/usePersistedState';
import { useContentQueue, type ContentItem } from '@/hooks/useContentQueue';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const AdminContentQueue = () => {
  // Restore scroll & persist tab state
  useScrollRestore('admin-content-queue');
  const [activeTab, setActiveTab] = usePersistedState('admin-content-queue-tab', 'all');
  const { toast } = useToast();

  // 📊 Load real data from Supabase
  const { items: contentQueue, loading, stats, refresh, deleteItem, publishNow } = useContentQueue();

  const handlePublish = async (item: ContentItem) => {
    try {
      await publishNow(item.id);
      toast({ title: '✅ Đã đăng bài thành công' });
    } catch (err: any) {
      toast({ title: '❌ Lỗi', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa nội dung này?')) return;
    try {
      await deleteItem(id);
      toast({ title: '🗑️ Đã xóa nội dung' });
    } catch (err: any) {
      toast({ title: '❌ Lỗi', description: err.message, variant: 'destructive' });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-orange-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      published: 'default',
      scheduled: 'secondary',
      pending: 'outline',
      failed: 'destructive',
    };
    const labels: Record<string, string> = {
      published: 'Đã đăng',
      scheduled: 'Đã lên lịch',
      pending: 'Chờ xử lý',
      failed: 'Thất bại',
    };

    return (
      <Badge variant={variants[status] as any} className="gap-1">
        {getStatusIcon(status)}
        {labels[status] || status}
      </Badge>
    );
  };

  const filterByStatus = (status: string) => {
    return contentQueue.filter((item) => item.status === status);
  };

  const ContentCard = ({ item }: { item: ContentItem }) => {
    // Safely extract platform from metadata
    const platform = typeof item.metadata?.platform === 'string' 
      ? item.metadata.platform 
      : (item.metadata?.platform ? JSON.stringify(item.metadata.platform) : null);
    
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg">{item.title || 'Không có tiêu đề'}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <FileText className="h-3 w-3" />
                {item.content_type || 'post'}
                {platform && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    {platform}
                  </>
                )}
              </CardDescription>
            </div>
            {getStatusBadge(item.status)}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Content Preview */}
          {item.content && typeof item.content === 'string' && (
            <p className="text-sm text-muted-foreground line-clamp-2">{item.content}</p>
          )}

        {/* Timestamps */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Tạo: {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
          </div>
          {item.scheduled_for && (
            <div className="flex items-center gap-1 text-blue-600">
              <Clock className="h-3 w-3" />
              Lên lịch: {format(new Date(item.scheduled_for), 'dd/MM/yyyy HH:mm', { locale: vi })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-2">
            <Eye className="h-3 w-3" />
            Xem
          </Button>
          {item.status === 'pending' && (
            <Button size="sm" variant="outline" className="gap-2" onClick={() => handlePublish(item)}>
              <Send className="h-3 w-3" />
              Đăng ngay
            </Button>
          )}
          {item.status === 'failed' && (
            <Button size="sm" variant="outline" className="gap-2" onClick={() => handlePublish(item)}>
              <Play className="h-3 w-3" />
              Thử lại
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-2 text-red-600 hover:text-red-700" onClick={() => handleDelete(item.id)}>
            <Trash2 className="h-3 w-3" />
            Xóa
          </Button>
        </div>
      </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📅 Content Queue</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý và lên lịch nội dung AI tự động
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refresh()}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng cộng</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Chờ xử lý</CardDescription>
            <CardTitle className="text-3xl text-orange-600">
              {stats.pending}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đã lên lịch</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {stats.scheduled}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đã đăng</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {stats.published}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Tất cả ({stats.total})</TabsTrigger>
          <TabsTrigger value="pending">Chờ xử lý ({stats.pending})</TabsTrigger>
          <TabsTrigger value="scheduled">
            Đã lên lịch ({stats.scheduled})
          </TabsTrigger>
          <TabsTrigger value="published">
            Đã đăng ({stats.published})
          </TabsTrigger>
          <TabsTrigger value="failed">Thất bại ({stats.failed})</TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <TabsContent value="all" className="space-y-4">
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {contentQueue.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">Chưa có nội dung nào</p>
                      </CardContent>
                    </Card>
                  ) : (
                    contentQueue.map((item) => (
                      <ContentCard key={item.id} item={item} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {filterByStatus('pending').map((item) => (
                    <ContentCard key={item.id} item={item} />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-4">
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {filterByStatus('scheduled').map((item) => (
                    <ContentCard key={item.id} item={item} />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="published" className="space-y-4">
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {filterByStatus('published').map((item) => (
                    <ContentCard key={item.id} item={item} />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="failed" className="space-y-4">
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {filterByStatus('failed').map((item) => (
                    <ContentCard key={item.id} item={item} />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default AdminContentQueue;
