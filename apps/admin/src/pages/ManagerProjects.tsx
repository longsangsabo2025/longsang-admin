import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import projectsService, { type Project } from '@/lib/api/projects-service';
import { 
  FolderOpen, 
  ExternalLink, 
  Settings, 
  Calendar,
  Search,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ManagerProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectsService.projects.getAll();
      setProjects(data);
    } catch (err) {
      setError('Không thể tải danh sách dự án. Vui lòng thử lại.');
      toast.error('Lỗi tải dự án');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-600';
      case 'development': return 'bg-blue-500/10 text-blue-600';
      case 'paused': return 'bg-yellow-500/10 text-yellow-600';
      case 'completed': return 'bg-gray-500/10 text-gray-600';
      default: return 'bg-gray-500/10 text-gray-600';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'development': return 'Đang phát triển';
      case 'paused': return 'Tạm dừng';
      case 'completed': return 'Hoàn thành';
      default: return status || 'Không xác định';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">📁 Dự Án Của Bạn</h1>
          <p className="text-muted-foreground mt-1">Đang tải danh sách dự án...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">📁 Dự Án Của Bạn</h1>
        </div>
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div>
                <p className="font-medium">{error}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Có thể do lỗi kết nối hoặc bạn chưa được phân quyền dự án nào.
                </p>
              </div>
              <Button onClick={fetchProjects} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Thử lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">📁 Dự Án Của Bạn</h1>
          <p className="text-muted-foreground mt-1">
            {projects.length} dự án được phân quyền
          </p>
        </div>
        <Button onClick={fetchProjects} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Làm mới
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm dự án..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-3 py-8">
              <FolderOpen className="h-12 w-12 text-muted-foreground" />
              {searchQuery ? (
                <>
                  <p className="font-medium">Không tìm thấy dự án</p>
                  <p className="text-sm text-muted-foreground">
                    Không có dự án nào khớp với "{searchQuery}"
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium">Chưa có dự án nào</p>
                  <p className="text-sm text-muted-foreground">
                    Liên hệ admin để được phân quyền dự án.
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card 
              key={project.id} 
              className="group hover:shadow-md transition-all cursor-pointer"
              onClick={() => navigate(`/manager/project/${project.slug || project.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {project.icon ? (
                      <div 
                        className={cn(
                          'h-10 w-10 rounded-lg flex items-center justify-center text-2xl',
                          project.color ? `bg-[${project.color}]/20` : 'bg-gray-100'
                        )}
                      >
                        {project.icon}
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                        {project.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {project.slug}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className={cn('text-xs', getStatusColor(project.status))}>
                    {getStatusLabel(project.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    Cập nhật: {project.updated_at 
                      ? new Date(project.updated_at).toLocaleDateString('vi-VN')
                      : 'N/A'}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/manager/project/${project.slug || project.id}`);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Quản lý
                  </Button>
                  {project.production_url && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(project.production_url!, '_blank');
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
