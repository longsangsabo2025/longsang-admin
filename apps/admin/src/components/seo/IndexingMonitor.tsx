import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link, RefreshCw, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface IndexingStatus {
  id: string;
  domain: string;
  url: string;
  status: 'pending' | 'crawling' | 'indexed' | 'failed';
  submittedAt: string;
  indexedAt?: string;
  searchEngine: 'google' | 'bing';
}

export function IndexingMonitor() {
  const { toast } = useToast();
  const [indexingQueue, setIndexingQueue] = useState<IndexingStatus[]>([
    {
      id: '1',
      domain: 'saboarena.com',
      url: 'https://saboarena.com/news/top-10-co-thu-bia-xuat-sac-nhat-viet-nam-2025',
      status: 'pending',
      submittedAt: '2025-11-11T20:18:00Z',
      searchEngine: 'google',
    },
    {
      id: '2',
      domain: 'saboarena.com',
      url: 'https://saboarena.com/rankings',
      status: 'indexed',
      submittedAt: '2025-11-11T12:00:00Z',
      indexedAt: '2025-11-11T18:30:00Z',
      searchEngine: 'google',
    },
  ]);

  const [stats, setStats] = useState({
    total: 310,
    pending: 150,
    crawling: 50,
    indexed: 100,
    failed: 10,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'indexed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'crawling':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      crawling: 'default',
      indexed: 'default',
      failed: 'destructive',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status === 'pending' && 'Đang chờ'}
        {status === 'crawling' && 'Đang crawl'}
        {status === 'indexed' && 'Đã index'}
        {status === 'failed' && 'Thất bại'}
      </Badge>
    );
  };

  const handleRefresh = () => {
    toast({
      title: 'Đang cập nhật...',
      description: 'Kiểm tra trạng thái indexing từ Google & Bing',
    });

    // Simulate refresh
    setTimeout(() => {
      toast({
        title: '✅ Đã cập nhật',
        description: 'Trạng thái indexing đã được làm mới',
      });
    }, 1500);
  };

  const handleRetryFailed = () => {
    toast({
      title: 'Đang thử lại...',
      description: 'Submit lại các URLs thất bại',
    });
  };

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng URLs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đang chờ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <Progress value={(stats.pending / stats.total) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đang crawl</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.crawling}</div>
            <Progress value={(stats.crawling / stats.total) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đã indexed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.indexed}</div>
            <Progress value={(stats.indexed / stats.total) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Thất bại</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <Progress value={(stats.failed / stats.total) * 100} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Indexing Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link className="w-5 h-5" />
                Trạng Thái Indexing
              </CardTitle>
              <CardDescription>
                Theo dõi realtime quá trình Google & Bing index các URLs
              </CardDescription>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryFailed}
                disabled={stats.failed === 0}
              >
                Thử lại thất bại
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Làm mới
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Search Engine</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Indexed</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {indexingQueue.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="max-w-xs">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-sm hover:text-primary"
                        title={item.url}
                      >
                        {item.url}
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>{item.domain}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.searchEngine === 'google' ? 'Google' : 'Bing'}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(item.submittedAt).toLocaleString('vi-VN')}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.indexedAt ? new Date(item.indexedAt).toLocaleString('vi-VN') : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        window.open(`https://www.google.com/search?q=site:${item.url}`, '_blank')
                      }
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
