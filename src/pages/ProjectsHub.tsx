import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FolderKanban,
  Search,
  Plus,
  Key,
  Bot,
  Workflow,
  Globe,
  Github,
  Server,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Database,
} from 'lucide-react';
import { projectsApi, type ProjectWithStats } from '@/lib/api/projects-service';

// Fallback mock data when database is not available
const mockProjects: ProjectWithStats[] = [
  {
    id: '1',
    slug: 'longsang-portfolio',
    name: 'Long Sang Portfolio',
    description: 'Website portfolio cá nhân với AI integration',
    icon: '🏠',
    color: 'from-blue-500 to-indigo-600',
    status: 'active',
    local_url: 'http://localhost:8081',
    production_url: 'https://longsang.com',
    github_url: 'https://github.com/longsangsabo2025/longsang-portfolio',
    created_at: '2025-11-01',
    updated_at: '2025-11-25',
    metadata: {},
    credentials_count: 5,
    agents_count: 3,
    workflows_count: 4,
  },
  {
    id: '2',
    slug: 'ainewbie-web',
    name: 'AI Newbie Web',
    description: 'Platform học AI cho người mới bắt đầu',
    icon: '🤖',
    color: 'from-purple-500 to-pink-600',
    status: 'active',
    local_url: 'http://localhost:5173',
    production_url: 'https://ainewbie.vn',
    github_url: 'https://github.com/longsangsabo2025/ainewbie-web',
    created_at: '2025-11-01',
    updated_at: '2025-11-24',
    metadata: {},
    credentials_count: 8,
    agents_count: 5,
    workflows_count: 6,
  },
  {
    id: '3',
    slug: 'sabo-hub',
    name: 'Sabo Hub',
    description: 'Hệ sinh thái quản lý doanh nghiệp',
    icon: '🏢',
    color: 'from-green-500 to-emerald-600',
    status: 'development',
    local_url: 'http://localhost:3000',
    production_url: null,
    github_url: 'https://github.com/longsangsabo2025/sabo-hub',
    created_at: '2025-11-01',
    updated_at: '2025-11-23',
    metadata: {},
    credentials_count: 4,
    agents_count: 2,
    workflows_count: 3,
  },
  {
    id: '4',
    slug: 'vungtau-dream-homes',
    name: 'Vũng Tàu Dream Homes',
    description: 'Website bất động sản Vũng Tàu',
    icon: '🏡',
    color: 'from-orange-500 to-red-600',
    status: 'active',
    local_url: 'http://localhost:5174',
    production_url: 'https://vungtaudreamhomes.com',
    github_url: 'https://github.com/longsangsabo2025/vungtau-dream-homes',
    created_at: '2025-11-01',
    updated_at: '2025-11-22',
    metadata: {},
    credentials_count: 3,
    agents_count: 1,
    workflows_count: 2,
  },
  {
    id: '5',
    slug: 'ai-secretary',
    name: 'AI Secretary',
    description: 'Trợ lý AI thông minh đa năng',
    icon: '💼',
    color: 'from-cyan-500 to-blue-600',
    status: 'development',
    local_url: 'http://localhost:3001',
    production_url: null,
    github_url: 'https://github.com/longsangsabo2025/ai-secretary',
    created_at: '2025-11-01',
    updated_at: '2025-11-21',
    metadata: {},
    credentials_count: 6,
    agents_count: 4,
    workflows_count: 5,
  },
  {
    id: '6',
    slug: 'sabo-arena',
    name: 'Sabo Arena',
    description: 'Gaming và giải trí platform',
    icon: '🎮',
    color: 'from-violet-500 to-purple-600',
    status: 'paused',
    local_url: null,
    production_url: null,
    github_url: 'https://github.com/longsangsabo2025/sabo-arena',
    created_at: '2025-11-01',
    updated_at: '2025-11-15',
    metadata: {},
    credentials_count: 2,
    agents_count: 0,
    workflows_count: 1,
  },
];

const statusConfig = {
  active: { label: 'Active', color: 'bg-green-500', icon: CheckCircle },
  development: { label: 'Development', color: 'bg-yellow-500', icon: Clock },
  paused: { label: 'Paused', color: 'bg-gray-500', icon: AlertCircle },
  archived: { label: 'Archived', color: 'bg-red-500', icon: AlertCircle },
};

const ProjectsHub = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);

  // Load projects from Supabase
  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await projectsApi.getAllWithStats();
      if (data && data.length > 0) {
        setProjects(data);
        setUsingMockData(false);
      } else {
        // No data in database, use mock data
        setProjects(mockProjects);
        setUsingMockData(true);
        toast({
          title: 'Sử dụng dữ liệu mẫu',
          description: 'Chưa có dữ liệu trong database. Đang hiển thị dữ liệu mẫu.',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      // Fallback to mock data on error
      setProjects(mockProjects);
      setUsingMockData(true);
      toast({
        title: 'Không thể kết nối database',
        description: 'Đang sử dụng dữ liệu mẫu. Chạy migration để tạo tables.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalStats = projects.reduce(
    (acc, p) => ({
      credentials: acc.credentials + (p.credentials_count || 0),
      agents: acc.agents + (p.agents_count || 0),
      workflows: acc.workflows + (p.workflows_count || 0),
    }),
    { credentials: 0, agents: 0, workflows: 0 }
  );

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FolderKanban className="h-8 w-8 text-indigo-500" />
            Projects Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý tất cả dự án, credentials, AI agents và workflows
          </p>
        </div>
        <div className="flex gap-2">
          {usingMockData && (
            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
              <Database className="h-3 w-3" />
              Mock Data
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={loadProjects}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm Project
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
              <FolderKanban className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{projects.length}</p>
              <p className="text-sm text-muted-foreground">Projects</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
              <Key className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStats.credentials}</p>
              <p className="text-sm text-muted-foreground">Credentials</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Bot className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStats.agents}</p>
              <p className="text-sm text-muted-foreground">AI Agents</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Workflow className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStats.workflows}</p>
              <p className="text-sm text-muted-foreground">Workflows</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'development', 'paused'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all'
                ? 'Tất cả'
                : statusConfig[status as keyof typeof statusConfig]?.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const StatusIcon = statusConfig[project.status]?.icon || CheckCircle;
          const statusStyle = statusConfig[project.status] || statusConfig.active;
          return (
            <Card
              key={project.id}
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-indigo-500/50"
              onClick={() => navigate(`/admin/projects/${project.slug}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div
                    className={`text-4xl p-3 rounded-xl bg-gradient-to-br ${project.color} shadow-lg`}
                  >
                    {project.icon}
                  </div>
                  <Badge variant="outline" className={`${statusStyle.color} text-white border-0`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusStyle.label}
                  </Badge>
                </div>
                <CardTitle className="mt-4 group-hover:text-indigo-500 transition-colors">
                  {project.name}
                </CardTitle>
                <CardDescription>{project.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-muted rounded-lg">
                    <Key className="h-4 w-4 mx-auto mb-1 text-amber-500" />
                    <p className="text-lg font-semibold">{project.credentials_count}</p>
                    <p className="text-xs text-muted-foreground">Keys</p>
                  </div>
                  <div className="p-2 bg-muted rounded-lg">
                    <Bot className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                    <p className="text-lg font-semibold">{project.agents_count}</p>
                    <p className="text-xs text-muted-foreground">Agents</p>
                  </div>
                  <div className="p-2 bg-muted rounded-lg">
                    <Workflow className="h-4 w-4 mx-auto mb-1 text-green-500" />
                    <p className="text-lg font-semibold">{project.workflows_count}</p>
                    <p className="text-xs text-muted-foreground">Flows</p>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="flex gap-2 pt-2 border-t">
                  {project.local_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(project.local_url!, '_blank');
                      }}
                    >
                      <Server className="h-4 w-4 mr-1" />
                      Local
                    </Button>
                  )}
                  {project.production_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(project.production_url!, '_blank');
                      }}
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      Live
                    </Button>
                  )}
                  {project.github_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(project.github_url!, '_blank');
                      }}
                    >
                      <Github className="h-4 w-4 mr-1" />
                      Code
                    </Button>
                  )}
                </div>

                {/* Last Updated */}
                <p className="text-xs text-muted-foreground text-right">
                  Cập nhật: {new Date(project.updated_at).toLocaleDateString('vi-VN')}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Không tìm thấy project nào</p>
            <p className="text-muted-foreground">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectsHub;
