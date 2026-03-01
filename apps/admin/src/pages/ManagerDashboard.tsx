import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import projectsService, { type Project } from '@/lib/api/projects-service';
import { ManagerOnboarding, useManagerOnboarding } from '@/components/manager/ManagerOnboarding';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  FolderOpen, 
  ImageIcon, 
  ArrowRight,
  Clock,
  Sparkles,
  ExternalLink,
  TrendingUp,
  Activity,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showOnboarding, completeOnboarding } = useManagerOnboarding();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectsService.projects.getAll();
        setProjects(data);
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const activeProjects = projects.filter(p => p.status === 'active').length;
  const devProjects = projects.filter(p => p.status === 'development').length;
  
  // Get recent projects (last 3 updated)
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 3);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Manager';

  return (
    <div className="space-y-8">
      {/* Onboarding Modal */}
      <ManagerOnboarding open={showOnboarding} onComplete={completeOnboarding} />

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-yellow-500" />
            Xin chào, {userName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Đây là tổng quan các dự án bạn được phân quyền quản lý.
          </p>
        </div>
        <Button onClick={() => navigate('/manager/projects')} className="gap-2">
          <FolderOpen className="h-4 w-4" />
          Xem tất cả dự án
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng dự án</p>
                <p className="text-2xl font-bold">{loading ? '-' : projects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đang hoạt động</p>
                <p className="text-2xl font-bold">{loading ? '-' : activeProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đang phát triển</p>
                <p className="text-2xl font-bold">{loading ? '-' : devProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Thư viện</p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-2xl font-bold"
                  onClick={() => navigate('/manager/library')}
                >
                  Mở →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Thao tác nhanh
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate('/manager/projects')}
            >
              <FolderOpen className="h-5 w-5" />
              <span>Xem dự án</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate('/manager/library')}
            >
              <ImageIcon className="h-5 w-5" />
              <span>Thư viện media</span>
            </Button>
            {recentProjects[0] && (
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate(`/manager/project/${recentProjects[0].slug}`)}
              >
                <Clock className="h-5 w-5" />
                <span className="truncate max-w-[120px]">
                  {recentProjects[0].name}
                </span>
              </Button>
            )}
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => window.open('mailto:longsang2103@gmail.com', '_blank')}
            >
              <ExternalLink className="h-5 w-5" />
              <span>Liên hệ Admin</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Dự án gần đây
            </CardTitle>
            <CardDescription>
              Các dự án được cập nhật gần nhất
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/manager/projects')}>
            Xem tất cả
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Chưa có dự án nào được phân quyền</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <button
                  type="button"
                  key={project.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors w-full text-left"
                  onClick={() => navigate(`/manager/project/${project.slug}`)}
                >
                  <div 
                    className={cn(
                      'h-12 w-12 rounded-lg flex items-center justify-center text-xl',
                      project.color ? `bg-[${project.color}]/10` : 'bg-muted'
                    )}
                  >
                    {project.icon || project.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{project.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Cập nhật: {new Date(project.updated_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      'shrink-0',
                      project.status === 'active' && 'bg-green-500/10 text-green-600',
                      project.status === 'development' && 'bg-blue-500/10 text-blue-600',
                    )}
                  >
                    {project.status === 'active' ? 'Hoạt động' : 
                     project.status === 'development' ? 'Phát triển' : project.status}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-blue-500/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">💡 Mẹo sử dụng</h4>
              <p className="text-sm text-muted-foreground">
                Click vào bất kỳ dự án nào để xem chi tiết và quản lý nội dung. 
                Bạn có quyền chỉnh sửa các dự án được phân quyền. 
                Nếu cần thêm dự án, hãy liên hệ Admin.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
