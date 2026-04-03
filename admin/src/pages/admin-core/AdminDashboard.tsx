import {
  Activity,
  ArrowRight,
  BookOpen,
  Bot,
  Briefcase,
  Briefcase as BriefcaseIcon,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Globe,
  Home,
  Loader2,
  MessageSquare,
  Newspaper,
  Palette,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Trophy,
  Workflow,
  XCircle,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DatabaseConnectionStatus } from '@/components/admin/DatabaseConnectionStatus';
import { MorningDashboard } from '@/components/dashboard/MorningDashboard';
import GoogleDriveTest from '@/components/GoogleDriveTest';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardStats } from '@/hooks';
import { API_URL } from '@/config/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [projectStatuses, setProjectStatuses] = useState<
    Record<string, 'running' | 'stopped' | 'error'>
  >({});
  const [statusLoading, setStatusLoading] = useState(false);

  // 📊 Load real stats from Supabase
  const {
    stats: dashboardStats,
    loading: statsLoading,
    refresh: refreshStats,
  } = useDashboardStats();

  // Default stats when loading
  const safeStats = dashboardStats || {
    workflowsTotal: 0,
    workflowsActive: 0,
    agentsTotal: 0,
    agentsOnline: 0,
    executionsToday: 0,
    executionsTotal: 0,
    successRate: 0,
  };

  // Check project status by trying to fetch from each port
  // In dev mode, we skip these checks to avoid console spam
  const checkProjectStatus = async (
    projectId: string,
    port: number
  ): Promise<'running' | 'stopped' | 'error'> => {
    // Skip status checks in dev mode - projects are managed separately
    if (import.meta.env.DEV) {
      return 'stopped'; // Default to stopped, user can check manually
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`http://localhost:${port}`, {
        method: 'HEAD',
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);
      if (!response) return 'stopped';
      return response.ok ? 'running' : 'error';
    } catch {
      return 'stopped';
    }
  };

  const refreshProjectStatuses = async () => {
    setStatusLoading(true);
    const statuses: Record<string, 'running' | 'stopped' | 'error'> = {};

    const checks = projects.map(async (project) => {
      const status = await checkProjectStatus(project.id, project.port);
      statuses[project.id] = status;
    });

    await Promise.all(checks);
    setProjectStatuses(statuses);
    setStatusLoading(false);
  };

  useEffect(() => {
    refreshProjectStatuses();
    // Refresh every 30 seconds
    const interval = setInterval(refreshProjectStatuses, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    {
      title: 'Tổng Quy Trình',
      value: statsLoading ? '...' : safeStats.workflowsTotal.toString(),
      change: `${safeStats.workflowsActive} đang hoạt động`,
      icon: Workflow,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'AI Agents',
      value: statsLoading ? '...' : safeStats.agentsTotal.toString(),
      change: `${safeStats.agentsOnline} Online`,
      icon: Bot,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Thực Thi Hôm Nay',
      value: statsLoading ? '...' : safeStats.executionsToday.toString(),
      change: `Tổng: ${safeStats.executionsTotal.toLocaleString()}`,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Tỷ Lệ Thành Công',
      value: statsLoading ? '...' : `${safeStats.successRate.toFixed(1)}%`,
      change:
        safeStats.successRate >= 95
          ? 'Xuất sắc'
          : safeStats.successRate >= 80
            ? 'Tốt'
            : 'Cần cải thiện',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const quickActions = [
    {
      title: '🎨 Visual Workspace',
      description: 'Build apps trực quan với AI - Chat + Canvas + Preview',
      icon: Sparkles,
      color: 'bg-gradient-to-br from-cyan-600 to-blue-600',
      action: () => navigate('/admin/visual-workspace'),
      badge: '🔥 NEW',
    },
    {
      title: '🚀 AI Workspace',
      description: '6 Trợ lý AI chuyên biệt - Tiết kiệm 83 giờ/tháng',
      icon: Sparkles,
      color: 'bg-gradient-to-br from-purple-600 to-pink-600',
      action: () => navigate('/admin/ai-workspace'),
      badge: '⭐ NEW',
    },
    {
      title: '🛒 AI Marketplace',
      description: 'Mua và sử dụng AI agents có sẵn',
      icon: Bot,
      color: 'bg-indigo-600',
      action: () => navigate('/marketplace'),
    },
    {
      title: 'Kiểm Tra Quy Trình AI',
      description: 'Chạy và kiểm tra các quy trình tự động',
      icon: Workflow,
      color: 'bg-blue-600',
      action: () => navigate('/admin/workflows'),
    },
    {
      title: 'Quản Lý AI Agents',
      description: 'Điều khiển và giám sát các AI agents',
      icon: Bot,
      color: 'bg-purple-600',
      action: () => navigate('/automation'),
    },
    {
      title: 'Xem Phân Tích',
      description: 'Kiểm tra hiệu suất và số liệu',
      icon: TrendingUp,
      color: 'bg-green-600',
      action: () => navigate('/analytics'),
    },
  ];

  const projectsConfig = [
    {
      id: 'portfolio',
      name: 'LongSang Portfolio',
      description: 'Website portfolio cá nhân',
      icon: Briefcase,
      color: 'bg-blue-600',
      url: 'http://localhost:5000',
      port: 5000,
      batFile: 'START_PORTFOLIO.bat',
    },
    {
      id: 'ainewbie',
      name: 'AI Newbie Web',
      description: 'Platform học AI cho người mới',
      icon: Globe,
      color: 'bg-purple-600',
      url: 'http://localhost:5174',
      port: 5174,
      batFile: 'START_AINEWBIE.bat',
    },
    {
      id: 'secretary',
      name: 'AI Secretary',
      description: 'Trợ lý AI thông minh',
      icon: MessageSquare,
      color: 'bg-green-600',
      url: 'http://localhost:5173',
      port: 5173,
      batFile: 'START_AI_SECRETARY.bat',
    },
    {
      id: 'vungtau',
      name: 'Vung Tau Dream Homes',
      description: 'BĐS Vũng Tàu',
      icon: Home,
      color: 'bg-orange-600',
      url: 'http://localhost:5175',
      port: 5175,
      batFile: 'START_VUNGTAU.bat',
    },
    {
      id: 'sabo-arena',
      name: 'SABO Arena',
      description: 'Billiards & E-Sports Platform',
      icon: Trophy,
      color: 'bg-yellow-600',
      url: 'https://saboarena.com',
      port: 443,
      batFile: 'START_SABO_ARENA.bat',
    },
  ];

  // Add status to projects dynamically
  const projects = projectsConfig.map((project) => ({
    ...project,
    status: projectStatuses[project.id] || 'stopped',
  }));

  const startProject = async (project: (typeof projects)[0]) => {
    try {
      // Try to start via API first
      const response = await fetch(`${API_URL}/projects/start/${project.id}`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        alert(
          `✅ ${data.project} đang khởi động!\n\n` +
            `🚀 Server sẽ sẵn sàng tại:\n` +
            `   ${data.url}\n\n` +
            `⏳ Vui lòng đợi 5-10 giây...`
        );

        // Open URL after delay
        setTimeout(() => {
          window.open(data.url, '_blank');
        }, 8000);
        return;
      }
    } catch (error) {
      console.warn('API not available, falling back to manual method:', error);
    }

    // Fallback: Show manual instructions
    const message =
      `🚀 Khởi động ${project.name}...\n\n` +
      `📍 CÁCH 1 (Khuyến nghị):\n` +
      `   1. Minimize tất cả cửa sổ (Win + D)\n` +
      `   2. Tìm "${project.name}.lnk" trên Desktop\n` +
      `   3. Double-click để start\n` +
      `   4. Browser sẽ tự mở sau 3 giây\n\n` +
      `💻 CÁCH 2 (Terminal):\n` +
      `   1. Mở PowerShell\n` +
      `   2. cd D:\\0.PROJECTS\\00-MASTER-ADMIN\\longsang-admin\n` +
      `   3. .\\${project.batFile}\n\n` +
      `⚡ URL: http://localhost:${project.port}\n\n` +
      `Click OK để mở URL (nếu server đã chạy)`;

    if (confirm(message)) {
      window.open(project.url, '_blank');
    }
  };

  const recentActivity = [
    {
      type: 'success',
      workflow: 'Nhà Máy Nội Dung AI',
      message: 'Tạo bài viết blog thành công',
      time: '2 phút trước',
    },
    {
      type: 'success',
      workflow: 'Quản Lý Khách Hàng Tiềm Năng',
      message: 'Khách hàng mới được xử lý và chấm điểm',
      time: '15 phút trước',
    },
    {
      type: 'running',
      workflow: 'Email Marketing',
      message: 'Chiến dịch đang thực hiện',
      time: '23 phút trước',
    },
    {
      type: 'success',
      workflow: 'Quản Lý Mạng Xã Hội',
      message: 'Bài viết đã lên lịch cho LinkedIn',
      time: '1 giờ trước',
    },
    {
      type: 'error',
      workflow: 'Hỗ Trợ Khách Hàng',
      message: 'Vượt giới hạn API',
      time: '2 giờ trước',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 🌅 Morning Dashboard - Tổng quan mỗi sáng */}
      <MorningDashboard />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bảng Điều Khiển Admin</h1>
          <p className="text-muted-foreground mt-1">
            Chào mừng trở lại! Đây là những gì đang diễn ra với hệ thống tự động hóa AI của bạn.
          </p>
        </div>
        <DatabaseConnectionStatus showDetails={false} />
      </div>

      {/* Stats Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
            📊 Dashboard Analytics
            {statsLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </h2>
          <Button variant="ghost" size="sm" onClick={refreshStats} disabled={statsLoading}>
            <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.title}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 relative"
                onClick={action.action}
              >
                {action.badge && (
                  <Badge className="absolute top-2 right-2 bg-yellow-500 text-white">
                    {action.badge}
                  </Badge>
                )}
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3 shadow-md`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-base">{action.title}</CardTitle>
                  <CardDescription className="text-xs">{action.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Visual Workspace Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Palette className="h-5 w-5 text-cyan-600" />🎨 Visual Workspace Builder - Build Apps
              Trực Quan
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Chat với AI + Visual Canvas + Live Preview - Giống Lovable & Google Studio
            </p>
          </div>
          <Button
            onClick={() => navigate('/admin/visual-workspace')}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
          >
            Mở Visual Workspace <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200 mb-6">
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-cyan-600" />
                  <h3 className="font-semibold">Chat với AI</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Mô tả bằng ngôn ngữ tự nhiên, AI sẽ generate components
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">Visual Canvas</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Drag & drop, connect components, build workflows trực quan
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold">Live Preview</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Xem code và preview real-time khi build
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Workspace Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />🚀 AI Workspace - 6 Trợ Lý Chuyên Biệt
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Văn phòng ảo với AI - Tiết kiệm 83 giờ/tháng
            </p>
          </div>
          <Button
            onClick={() => navigate('/admin/ai-workspace')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            Mở AI Workspace <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              {[
                {
                  id: 'course',
                  name: 'Khóa học',
                  icon: BookOpen,
                  color: 'text-blue-600',
                  bg: 'bg-blue-100',
                },
                {
                  id: 'financial',
                  name: 'Tài chính',
                  icon: DollarSign,
                  color: 'text-green-600',
                  bg: 'bg-green-100',
                },
                {
                  id: 'research',
                  name: 'Nghiên cứu',
                  icon: Search,
                  color: 'text-purple-600',
                  bg: 'bg-purple-100',
                },
                {
                  id: 'news',
                  name: 'Tin tức',
                  icon: Newspaper,
                  color: 'text-orange-600',
                  bg: 'bg-orange-100',
                },
                {
                  id: 'career',
                  name: 'Sự nghiệp',
                  icon: BriefcaseIcon,
                  color: 'text-indigo-600',
                  bg: 'bg-indigo-100',
                },
                {
                  id: 'daily',
                  name: 'Kế hoạch',
                  icon: Calendar,
                  color: 'text-pink-600',
                  bg: 'bg-pink-100',
                },
              ].map((assistant) => {
                const Icon = assistant.icon;
                return (
                  <div
                    key={assistant.id}
                    className="flex flex-col items-center p-4 rounded-lg bg-white hover:shadow-md transition-all cursor-pointer border border-gray-200 hover:border-purple-300"
                    onClick={() => navigate(`/admin/ai-workspace?assistant=${assistant.id}`)}
                  >
                    <div
                      className={`w-12 h-12 rounded-full ${assistant.bg} flex items-center justify-center mb-2`}
                    >
                      <Icon className={`h-6 w-6 ${assistant.color}`} />
                    </div>
                    <span className="text-sm font-medium text-center">{assistant.name}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 p-4 bg-white rounded-lg border border-purple-200">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-purple-900 mb-1">✨ Tính năng nổi bật:</p>
                  <ul className="text-purple-800 space-y-1 list-disc list-inside">
                    <li>6 AI Assistants chuyên biệt cho từng lĩnh vực</li>
                    <li>RAG System - Tìm kiếm thông minh trong dữ liệu cá nhân</li>
                    <li>Multi-Agent Orchestration - Phối hợp nhiều AI cùng lúc</li>
                    <li>Tích hợp Tavily Search, Google Calendar, n8n Workflows</li>
                    <li>Streaming responses - Phản hồi real-time</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Quick Access */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">🚀 Projects Quick Access</h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {projects.filter((p) => p.status === 'running').length} Running
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshProjectStatuses}
              disabled={statusLoading}
            >
              <RefreshCw className={`h-4 w-4 ${statusLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {projects.map((project) => {
            const Icon = project.icon;
            return (
              <Card
                key={project.name}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                onClick={() => startProject(project)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-10 h-10 rounded-lg ${project.color} flex items-center justify-center`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <Zap className="h-4 w-4 text-yellow-500" />
                  </div>
                  <CardTitle className="text-sm mt-2">{project.name}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {project.description}
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    {(() => {
                      const getStatusStyles = (status: string) => {
                        if (status === 'running')
                          return 'bg-green-50 text-green-700 border-green-200';
                        if (status === 'error') return 'bg-red-50 text-red-700 border-red-200';
                        return 'bg-gray-50 text-gray-700 border-gray-200';
                      };

                      const getStatusText = (status: string) => {
                        if (status === 'running') return '🟢 Running';
                        if (status === 'error') return '🔴 Error';
                        return '⚫ Stopped';
                      };

                      return (
                        <Badge
                          variant="outline"
                          className={`text-xs ${getStatusStyles(project.status)}`}
                        >
                          {getStatusText(project.status)}
                        </Badge>
                      );
                    })()}
                    <span className="text-xs text-muted-foreground">:{project.port}</span>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-green-900 mb-1">⚡ Quick Start Projects:</p>
              <p className="text-green-800">
                <strong>Option 1:</strong> Check your Desktop for project shortcuts (Portfolio, AI
                Newbie, AI Secretary, etc.)
                <br />
                <strong>Option 2:</strong> Click card → Follow instructions → Start dev server
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & System Status */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Hoạt Động Gần Đây</CardTitle>
            <CardDescription>Các quy trình và sự kiện thực thi mới nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={`${activity.workflow}-${activity.time}`}
                  className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
                >
                  {getActivityIcon(activity.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.workflow}</p>
                    <p className="text-xs text-muted-foreground">{activity.message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => navigate('/automation')}
            >
              Xem Tất Cả Hoạt Động <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>Trạng Thái Hệ Thống</CardTitle>
            <CardDescription>Trạng thái hiện tại của tất cả các dịch vụ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">N8N Workflow Engine</span>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Hoạt động
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Supabase Database</span>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Hoạt động
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">OpenAI API</span>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Đã Kết Nối
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Vite Dev Server</span>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Đang Chạy
                </Badge>
              </div>
            </div>
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-800">
                🟢 Tất Cả Hệ Thống Hoạt Động Bình Thường
              </p>
              <p className="text-xs text-green-600 mt-1">
                Không phát hiện sự cố. Mọi thứ đang chạy trơn tru.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Google Drive Integration Test */}
        <div className="mt-6">
          <GoogleDriveTest />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
