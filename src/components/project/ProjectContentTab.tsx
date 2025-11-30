import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

interface ProjectContentTabProps {
  projectId: string;
}

export function ProjectContentTab({ projectId }: ProjectContentTabProps) {
  // Placeholder content items
  const contentItems = [
    {
      id: 1,
      title: 'Blog Post: AI trong Marketing',
      status: 'published',
      date: '2025-01-15',
      type: 'blog',
    },
    {
      id: 2,
      title: 'Video: Hướng dẫn sử dụng',
      status: 'draft',
      date: '2025-01-18',
      type: 'video',
    },
    {
      id: 3,
      title: 'Social Post: Khuyến mãi',
      status: 'scheduled',
      date: '2025-01-20',
      type: 'social',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'draft':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'scheduled':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Content Queue</h3>
          <p className="text-sm text-muted-foreground">Quản lý nội dung và lịch đăng bài</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Tạo Content Mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-500">12</p>
            <p className="text-sm text-muted-foreground">Published</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-yellow-500">5</p>
            <p className="text-sm text-muted-foreground">Drafts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-500">8</p>
            <p className="text-sm text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>
      </div>

      {/* Content List */}
      <div className="space-y-4">
        {contentItems.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <FileText className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.title}</span>
                      <Badge variant="outline">{item.type}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(item.status)}
                      <span className="text-sm text-muted-foreground capitalize">
                        {item.status}
                      </span>
                      <span className="text-sm text-muted-foreground">• {item.date}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coming Soon */}
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h4 className="font-semibold mb-2">Content Calendar Coming Soon</h4>
          <p className="text-sm text-muted-foreground">Tích hợp content calendar và scheduling</p>
        </CardContent>
      </Card>
    </div>
  );
}
