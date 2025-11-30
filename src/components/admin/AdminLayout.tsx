import { UserProfile } from '@/components/auth/UserProfile';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  Bug,
  Command,
  Database,
  FileText,
  FolderOpen,
  GraduationCap,
  HardDrive,
  HelpCircle,
  Home,
  LayoutDashboard,
  Menu,
  Palette,
  Settings,
  TrendingUp,
  Users,
  Workflow,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const adminNavGroups = [
  {
    label: '🏠 Trung Tâm',
    color: 'text-blue-500',
    bgColor: 'hover:bg-blue-500/10',
    items: [
      {
        title: 'Bảng Điều Khiển',
        icon: LayoutDashboard,
        href: '/admin',
      },
      {
        title: '🎯 Trung Tâm Dự Án',
        icon: Home,
        href: '/admin/command-center',
        badge: '⭐',
        description: 'Dự án • Keys • Agents',
      },
    ],
  },
  {
    label: '🤖 AI & Automation',
    color: 'text-purple-500',
    bgColor: 'hover:bg-purple-500/10',
    items: [
      {
        title: '🧠 AI Second Brain',
        icon: Brain,
        href: '/admin/brain',
        badge: '⭐ NEW',
        description: 'Knowledge & Core Logic',
      },
      {
        title: '🚀 AI Workspace',
        icon: Bot,
        href: '/admin/ai-workspace',
        badge: '⭐ NEW',
        description: '6 Trợ lý AI chuyên biệt',
      },
      {
        title: '🎨 Visual Workspace',
        icon: Palette,
        href: '/admin/visual-workspace',
        badge: '🔥 NEW',
        description: 'Build apps trực quan với AI',
      },
      {
        title: '🎯 AI Command Center',
        icon: Bot,
        href: '/admin/ai-center',
        badge: '⭐ UNIFIED',
      },
      {
        title: '🚀 Solo Founder Hub',
        icon: Command,
        href: '/admin/solo-hub',
        badge: '🔥 NEW',
        description: 'AI Agents cho one-person business',
      },
      {
        title: '🎛️ n8n Server',
        icon: Zap,
        href: '/admin/n8n',
      },
    ],
  },
  {
    label: '📈 Marketing',
    color: 'text-green-500',
    bgColor: 'hover:bg-green-500/10',
    items: [
      {
        title: '📁 Projects',
        icon: FolderOpen,
        href: '/admin/projects',
        badge: '⭐ NEW',
        description: 'Quản lý dự án & Social Media',
      },
      {
        title: 'SEO Center',
        icon: TrendingUp,
        href: '/admin/seo-center',
      },
      {
        title: 'Nội Dung',
        icon: Workflow,
        href: '/admin/content-queue',
      },
      {
        title: '📱 Social Media',
        icon: Zap,
        href: '/admin/social-media',
      },
      {
        title: '🔗 Social Connections',
        icon: Zap,
        href: '/admin/social-connections',
      },
      {
        title: 'Google Services',
        icon: BarChart3,
        href: '/admin/google-services',
      },
    ],
  },
  {
    label: '🎓 Đào Tạo',
    color: 'text-indigo-500',
    bgColor: 'hover:bg-indigo-500/10',
    items: [
      {
        title: 'AI Academy',
        icon: GraduationCap,
        href: '/academy',
      },
      {
        title: 'Khóa Học',
        icon: BookOpen,
        href: '/admin/courses',
      },
    ],
  },
  {
    label: '⚙️ Hệ Thống',
    color: 'text-slate-500',
    bgColor: 'hover:bg-slate-500/10',
    items: [
      {
        title: 'Quản Lý Users',
        icon: Users,
        href: '/admin/users',
      },
      {
        title: 'Files & Docs',
        icon: FileText,
        href: '/admin/files',
      },
      {
        title: '📚 Docs Manager',
        icon: BookOpen,
        href: '/admin/docs',
        badge: '⭐ NEW',
        description: 'Auto-organize tài liệu',
      },
      {
        title: '📖 Docs Viewer',
        icon: FileText,
        href: '/admin/docs/viewer',
        description: 'Xem tài liệu cross-project',
      },
      {
        title: 'Database',
        icon: Database,
        href: '/admin/database-schema',
      },
      {
        title: '🗺️ System Map',
        icon: Database,
        href: '/admin/system-map',
        badge: '⭐ NEW',
        description: 'Live Connection Network',
      },
      {
        title: '🐛 Bug System',
        icon: Bug,
        href: '/admin/bug-system',
        badge: 'NEW',
        description: 'Error tracking & Auto-fix',
      },
      {
        title: '💾 Backup',
        icon: HardDrive,
        href: '/admin/backup',
        badge: 'NEW',
        description: 'Backup lên Google Drive',
      },
      {
        title: '🔍 Feature Audit',
        icon: FileText,
        href: '/admin/feature-audit',
        badge: 'DEV',
      },
      {
        title: 'Cài Đặt',
        icon: Settings,
        href: '/admin/settings',
      },
    ],
  },
];

export const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur-md">
        <div className="flex h-16 items-center px-4 gap-4">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
              LS
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold">Cổng Quản Trị</h1>
              <p className="text-xs text-muted-foreground">Trung Tâm Điều Khiển Tự Động Hóa AI</p>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin/docs/viewer')}
              title="Tài liệu hướng dẫn"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
            <ThemeToggle />
            <NotificationCenter />
            <Button variant="outline" size="sm" onClick={() => navigate('/')} className="gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Trang Chủ</span>
            </Button>
            <UserProfile />
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-background transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <ScrollArea className="h-full py-6 px-3">
          <div className="space-y-4">
            {adminNavGroups.map((group) => (
              <div key={group.label}>
                {/* Group Label */}
                <div className="px-3 mb-2">
                  <h3 className={`text-xs font-semibold uppercase tracking-wider ${group.color}`}>
                    {group.label}
                  </h3>
                </div>

                {/* Group Items */}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                      <Button
                        key={item.href}
                        variant={active ? 'secondary' : 'ghost'}
                        className={`w-full justify-start gap-3 ${
                          active ? 'bg-secondary' : group.bgColor
                        }`}
                        onClick={() => {
                          navigate(item.href);
                          setSidebarOpen(false);
                        }}
                      >
                        <Icon className={`h-4 w-4 ${active ? '' : group.color}`} />
                        <span className="text-sm font-medium flex-1 text-left">{item.title}</span>
                        {item.badge && (
                          <span className="ml-auto px-2 py-0.5 text-[10px] font-semibold rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                            {item.badge}
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </div>

                {/* Separator between groups (except last) */}
                {group.label !== adminNavGroups.at(-1)?.label && <Separator className="my-4" />}
              </div>
            ))}
          </div>

          <Separator className="my-6" />

          {/* Quick Stats */}
          <div className="px-3 space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase">
              Thống Kê Nhanh
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Quy Trình Hoạt Động</span>
                <span className="font-semibold">15</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">AI Agents</span>
                <span className="font-semibold">4</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Thực Thi Hôm Nay</span>
                <span className="font-semibold text-green-600">127</span>
              </div>
            </div>
          </div>
        </ScrollArea>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 top-16 z-30 bg-background/80 backdrop-blur-sm lg:hidden cursor-default"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 pb-8">
        <div className="container mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
