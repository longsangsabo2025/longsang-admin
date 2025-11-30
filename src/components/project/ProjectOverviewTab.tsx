import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  ExternalLink,
  Globe,
  Key,
  Users,
  FileText,
  TrendingUp,
} from 'lucide-react';

interface ProjectOverviewTabProps {
  project: {
    id: string;
    name: string;
    slug: string;
    description: string;
    status: string;
    icon: string;
    color: string;
    created_at: string;
    updated_at: string;
  };
  onRefresh: () => void;
}

export function ProjectOverviewTab({ project }: ProjectOverviewTabProps) {
  const stats = [
    { label: 'API Keys', value: '0', icon: Key, color: 'text-blue-500' },
    { label: 'Domains', value: '0', icon: Globe, color: 'text-green-500' },
    { label: 'Team Members', value: '0', icon: Users, color: 'text-purple-500' },
    { label: 'Documents', value: '0', icon: FileText, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Project Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Thông Tin Dự Án
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Slug</span>
              <code className="bg-muted px-2 py-1 rounded text-sm">{project.slug}</code>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                {project.status}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Color</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border"
                  style={{ backgroundColor: project.color }}
                />
                <code className="text-sm">{project.color}</code>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Ngày tạo
              </span>
              <span className="text-sm">
                {new Date(project.created_at).toLocaleDateString('vi-VN')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Cập nhật
              </span>
              <span className="text-sm">
                {new Date(project.updated_at).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Key className="h-4 w-4 mr-2" />
              Xem tất cả API Keys
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Globe className="h-4 w-4 mr-2" />
              Quản lý Domains
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Thêm Team Member
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Tạo Document mới
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Mô Tả Dự Án</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {project.description || 'Chưa có mô tả cho dự án này.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
