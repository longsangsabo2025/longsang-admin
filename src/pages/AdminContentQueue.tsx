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
} from 'lucide-react';
import { usePersistedState, useScrollRestore } from '@/hooks/usePersistedState';

interface ContentItem {
  id: string;
  title: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  scheduledFor?: string;
  workflow: string;
}

const AdminContentQueue = () => {
  // Restore scroll & persist tab state
  useScrollRestore('admin-content-queue');
  const [activeTab, setActiveTab] = usePersistedState('admin-content-queue-tab', 'all');

  // Mock data - replace with real data from Supabase
  const contentQueue: ContentItem[] = [
    {
      id: '1',
      title: '10 Tips for Better AI Automation',
      type: 'Blog Post',
      status: 'completed',
      createdAt: '2025-01-11T10:30:00',
      workflow: 'AI Content Factory',
    },
    {
      id: '2',
      title: 'LinkedIn Post: New AI Features',
      type: 'Social Media',
      status: 'processing',
      createdAt: '2025-01-11T11:00:00',
      scheduledFor: '2025-01-11T14:00:00',
      workflow: 'Social Media Manager',
    },
    {
      id: '3',
      title: 'Monthly Newsletter: AI Trends',
      type: 'Email',
      status: 'pending',
      createdAt: '2025-01-11T09:00:00',
      scheduledFor: '2025-01-15T08:00:00',
      workflow: 'Email Campaign Generator',
    },
    {
      id: '4',
      title: 'Product Launch Announcement',
      type: 'Press Release',
      status: 'failed',
      createdAt: '2025-01-10T15:00:00',
      workflow: 'Content Factory',
    },
  ];

  const getStatusIcon = (status: ContentItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-orange-600" />;
    }
  };

  const getStatusBadge = (status: ContentItem['status']) => {
    const variants = {
      completed: 'default',
      processing: 'secondary',
      pending: 'outline',
      failed: 'destructive',
    };

    return (
      <Badge variant={variants[status] as any} className="gap-1">
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filterByStatus = (status: ContentItem['status']) => {
    return contentQueue.filter((item) => item.status === status);
  };

  const ContentCard = ({ item }: { item: ContentItem }) => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg">{item.title}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <FileText className="h-3 w-3" />
              {item.type}
              <span className="text-muted-foreground">•</span>
              {item.workflow}
            </CardDescription>
          </div>
          {getStatusBadge(item.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Timestamps */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Created: {new Date(item.createdAt).toLocaleString()}
          </div>
          {item.scheduledFor && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Scheduled: {new Date(item.scheduledFor).toLocaleString()}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-2">
            <Eye className="h-3 w-3" />
            View
          </Button>
          {item.status === 'pending' && (
            <Button size="sm" variant="outline" className="gap-2">
              <Play className="h-3 w-3" />
              Process Now
            </Button>
          )}
          {item.status === 'failed' && (
            <Button size="sm" variant="outline" className="gap-2">
              <Play className="h-3 w-3" />
              Retry
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-2 text-red-600 hover:text-red-700">
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Content Queue</h1>
        <p className="text-muted-foreground mt-1">
          Manage and monitor your AI-generated content pipeline
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Items</CardDescription>
            <CardTitle className="text-3xl">{contentQueue.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-orange-600">
              {filterByStatus('pending').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Processing</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {filterByStatus('processing').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {filterByStatus('completed').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({contentQueue.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({filterByStatus('pending').length})</TabsTrigger>
          <TabsTrigger value="processing">
            Processing ({filterByStatus('processing').length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({filterByStatus('completed').length})
          </TabsTrigger>
          <TabsTrigger value="failed">Failed ({filterByStatus('failed').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {contentQueue.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
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

        <TabsContent value="processing" className="space-y-4">
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {filterByStatus('processing').map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {filterByStatus('completed').map((item) => (
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
      </Tabs>
    </div>
  );
};

export default AdminContentQueue;
