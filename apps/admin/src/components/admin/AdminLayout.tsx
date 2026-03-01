import { UserProfile } from '@/components/auth/UserProfile';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  SidebarCollapseToggle,
  AnimatedCollapseButton,
  CompactToggle,
} from '@/components/ui/sidebar-collapse-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Activity,
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  Bug,
  ChevronDown,
  ChevronRight,
  Command,
  Database,
  DollarSign,
  ExternalLink,
  Film,
  FileText,
  FolderOpen,
  Gamepad2,
  GraduationCap,
  HardDrive,
  HelpCircle,
  Home,
  LayoutDashboard,
  Lightbulb,
  Menu,
  Music,
  Palette,
  Send,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Tv,
  User,
  Users,
  Video,
  Workflow,
  X,
  Zap,
  Crown,
} from 'lucide-react';
import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FloatingQuickCapture } from './FloatingQuickCapture';
import TravisChat from '../travis/TravisChat';

// ─── CLEAN NAV STRUCTURE ─────────────────────────────────────
// 5 groups, max 5-6 items each. Secondary items in collapsible "more".

interface NavItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
  description?: string;
}

interface NavGroup {
  label: string;
  color: string;
  bgColor: string;
  items: NavItem[];
  moreItems?: NavItem[];
}

const adminNavGroups: NavGroup[] = [
  {
    label: '🎯 Command',
    color: 'text-red-500',
    bgColor: 'hover:bg-red-500/10',
    items: [
      { title: 'Mission Control', icon: Target, href: '/admin/mission-control' },
      { title: 'Dự Án', icon: Home, href: '/admin/command-center' },
      { title: 'Survival Mode', icon: Zap, href: '/admin/survival' },
      { title: 'Ideas', icon: Lightbulb, href: '/admin/ideas' },
    ],
    moreItems: [
      { title: 'Bảng Điều Khiển', icon: LayoutDashboard, href: '/admin' },
      { title: 'Agent Registry', icon: Bot, href: '/admin/agent-registry' },
      { title: 'Marketing Engine', icon: TrendingUp, href: '/admin/marketing-engine' },
      { title: 'Product Settings', icon: Settings, href: '/admin/product-settings' },
      { title: 'Revenue', icon: DollarSign, href: '/admin/revenue' },
    ],
  },
  {
    label: '🎬 YouTube & Video',
    color: 'text-amber-500',
    bgColor: 'hover:bg-amber-500/10',
    items: [
      { title: 'YouTube Channels', icon: Tv, href: '/admin/youtube-channels', badge: '5 kênh' },
      { title: 'Pipeline', icon: Zap, href: '/admin/pipeline' },
      { title: 'Video Factory', icon: Video, href: '/admin/video-factory' },
      { title: 'AI Studio', icon: Film, href: '/admin/studio' },
    ],
    moreItems: [
      { title: 'Video Composer', icon: Film, href: '/admin/video-composer' },
      { title: 'Bulk Video', icon: Video, href: '/admin/bulk-video' },
      { title: 'Sora Video', icon: Video, href: '/admin/sora-video' },
    ],
  },
  {
    label: '🤖 AI Tools',
    color: 'text-purple-500',
    bgColor: 'hover:bg-purple-500/10',
    items: [
      { title: 'AI Brain', icon: Brain, href: '/admin/brain' },
      { title: 'AI Workspace', icon: Bot, href: '/admin/ai-workspace' },
      { title: 'Brand Identity', icon: Crown, href: '/admin/brand' },
      { title: 'Auto Publish', icon: Send, href: '/admin/auto-publish' },
      { title: 'Gemini Chat', icon: Bot, href: '/admin/gemini-chat' },
    ],
    moreItems: [
      { title: 'AI Command Center', icon: Bot, href: '/admin/ai-center' },
      { title: 'Solo Founder Hub', icon: Command, href: '/admin/solo-hub' },
      { title: 'Visual Workspace', icon: Palette, href: '/admin/visual-workspace' },
      { title: 'AI Cost', icon: DollarSign, href: '/admin/ai-cost' },
      { title: 'n8n Server', icon: Workflow, href: '/admin/n8n' },
    ],
  },
  {
    label: '📈 Marketing',
    color: 'text-green-500',
    bgColor: 'hover:bg-green-500/10',
    items: [
      { title: 'Social Media', icon: Zap, href: '/admin/social-media' },
      { title: 'Nội Dung', icon: Workflow, href: '/admin/content-queue' },
      { title: 'SEO Center', icon: TrendingUp, href: '/admin/seo-center' },
      { title: 'Analytics', icon: BarChart3, href: '/admin/unified-analytics' },
    ],
    moreItems: [
      { title: 'Social Connections', icon: Zap, href: '/admin/social-connections' },
      { title: 'Zalo OA', icon: Zap, href: '/admin/zalo-oa' },
      { title: 'Zalo Campaigns', icon: Zap, href: '/admin/zalo-campaigns' },
      { title: 'Facebook', icon: Zap, href: '/admin/facebook-marketing' },
      { title: 'Google Services', icon: BarChart3, href: '/admin/google-services' },
      { title: 'Projects', icon: FolderOpen, href: '/admin/projects' },
    ],
  },
  {
    label: '⚙️ Hệ Thống',
    color: 'text-slate-500',
    bgColor: 'hover:bg-slate-500/10',
    items: [
      { title: 'Services Health', icon: Activity, href: '/admin/services-health' },
      { title: 'Heartbeat', icon: Activity, href: '/admin/heartbeat' },
      { title: 'Files & Library', icon: BookOpen, href: '/admin/library' },
      { title: 'Settings', icon: Settings, href: '/admin/settings' },
    ],
    moreItems: [
      { title: 'Travis AI', icon: Brain, href: '/admin/travis' },
      { title: 'System Map', icon: Database, href: '/admin/system-map' },
      { title: 'Bug System', icon: Bug, href: '/admin/bug-system' },
      { title: 'Database', icon: Database, href: '/admin/database-schema' },
      { title: 'Docs Manager', icon: FileText, href: '/admin/docs' },
      { title: 'Backup', icon: HardDrive, href: '/admin/backup' },
      { title: 'Users', icon: Users, href: '/admin/users' },
      { title: 'Courses', icon: GraduationCap, href: '/admin/courses' },
      { title: 'Feature Audit', icon: FileText, href: '/admin/feature-audit' },
    ],
  },
];

export const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Load từ localStorage nếu có
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    return saved === 'true';
  });

  // Track which nav groups have "more" items expanded
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Lưu state vào localStorage khi thay đổi
  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem('admin-sidebar-collapsed', String(newState));
      return newState;
    });
  };

  // Keyboard shortcut Ctrl+B để toggle sidebar
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebarCollapse();
      }
    };
    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, []);

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

          {/* Quick Project Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-medium">Dự Án</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Chuyển Nhanh Dự Án
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* SABO Ecosystem */}
                <DropdownMenuLabel className="text-xs text-muted-foreground uppercase flex items-center gap-2">
                  🎱 SABO Ecosystem
                </DropdownMenuLabel>
                <DropdownMenuItem 
                  className="cursor-pointer gap-3"
                  onClick={() => navigate('/admin/p/sabo-arena')}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-green-500/10 text-green-500">
                    <Gamepad2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">SABO Arena</div>
                    <div className="text-xs text-muted-foreground">Billiards Platform</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer gap-3"
                  onClick={() => navigate('/admin/p/sabo-hub')}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-green-500/10 text-green-500">
                    <Home className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">SABO Hub</div>
                    <div className="text-xs text-muted-foreground">Central Hub</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer gap-3"
                  onClick={() => navigate('/admin/p/sabo-billiards')}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-green-500/10 text-green-500">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">SABO Billiards</div>
                    <div className="text-xs text-muted-foreground">Main Business</div>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* AI Ecosystem */}
                <DropdownMenuLabel className="text-xs text-muted-foreground uppercase flex items-center gap-2">
                  🤖 AI Newbie Ecosystem
                </DropdownMenuLabel>
                <DropdownMenuItem 
                  className="cursor-pointer gap-3"
                  onClick={() => navigate('/admin/p/ainewbie-web')}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-cyan-500/10 text-cyan-500">
                    <GraduationCap className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">AI Newbie Web</div>
                    <div className="text-xs text-muted-foreground">Learning Platform</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer gap-3"
                  onClick={() => navigate('/admin/p/ai-secretary')}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-pink-500/10 text-pink-500">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">AI Secretary</div>
                    <div className="text-xs text-muted-foreground">Automation Tool</div>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Standalone Projects */}
                <DropdownMenuLabel className="text-xs text-muted-foreground uppercase flex items-center gap-2">
                  📄 Other Projects
                </DropdownMenuLabel>
                <DropdownMenuItem 
                  className="cursor-pointer gap-3"
                  onClick={() => navigate('/admin/p/vungtau-dream-homes')}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-orange-500/10 text-orange-500">
                    <Home className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">VT Dream Homes</div>
                    <div className="text-xs text-muted-foreground">Real Estate</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer gap-3"
                  onClick={() => navigate('/admin/p/music-video-app')}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-purple-500/10 text-purple-500">
                    <Music className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">Music Video App</div>
                    <div className="text-xs text-muted-foreground">Entertainment</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer gap-3"
                  onClick={() => navigate('/admin/projects')}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-500/10 text-slate-500">
                    <FolderOpen className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">📂 Tất Cả Dự Án</div>
                    <div className="text-xs text-muted-foreground">View all {`>`} 17 projects</div>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Dev Servers - External Links */}
                <DropdownMenuLabel className="text-xs text-muted-foreground uppercase">
                  🚀 Dev Servers (localhost)
                </DropdownMenuLabel>
                <DropdownMenuItem 
                  className="cursor-pointer gap-3"
                  onClick={() => window.open('http://localhost:5173', '_blank')}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-500/10 text-blue-500">
                    <LayoutDashboard className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">LongSang Admin</div>
                    <div className="text-xs text-muted-foreground">:5173 - This Portal</div>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer gap-3"
                  onClick={() => window.open('http://localhost:5174', '_blank')}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-green-500/10 text-green-500">
                    <Gamepad2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">SABO Arena</div>
                    <div className="text-xs text-muted-foreground">:5174 - Billiards Platform</div>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer gap-3"
                  onClick={() => window.open('http://localhost:5175', '_blank')}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-orange-500/10 text-orange-500">
                    <Home className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">VT Dream Homes</div>
                    <div className="text-xs text-muted-foreground">:5175 - Real Estate</div>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Production Links */}
                <DropdownMenuLabel className="text-xs text-muted-foreground uppercase">
                  🌐 Production
                </DropdownMenuLabel>
                <DropdownMenuItem 
                  className="cursor-pointer gap-3"
                  onClick={() => window.open('https://longsang.vercel.app', '_blank')}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-emerald-500/10 text-emerald-500">
                    <ExternalLink className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">longsang.vercel.app</div>
                    <div className="text-xs text-muted-foreground">Production Site</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Thư Viện Button */}
            <Button 
              variant="ghost" 
              className="gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => navigate('/admin/library')}
            >
              <BookOpen className="h-4 w-4" />
              <span className="font-medium">Thư Viện</span>
            </Button>
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
            <NotificationBell />
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
          fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r bg-background 
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}
          w-64
        `}
      >
        {/* Floating Collapse Toggle Button - hiện ở cạnh sidebar */}
        <SidebarCollapseToggle
          isCollapsed={sidebarCollapsed}
          onToggle={toggleSidebarCollapse}
          variant="floating"
          position="middle"
          className="hidden lg:flex"
        />

        <ScrollArea className="h-full py-6 px-3">
          <div className="space-y-4">
            {adminNavGroups.map((group) => (
              <div key={group.label}>
                {/* Group Label */}
                <div className={`px-3 mb-2 transition-all duration-300 ${sidebarCollapsed ? 'lg:px-1 lg:text-center' : ''}`}>
                  <h3 className={`text-xs font-semibold uppercase tracking-wider ${group.color} ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                    {group.label}
                  </h3>
                  {/* Collapsed: show dot indicator */}
                  {sidebarCollapsed && (
                    <div className={`hidden lg:block w-2 h-2 rounded-full mx-auto ${group.color.replace('text-', 'bg-')}`} />
                  )}
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
                        className={`w-full gap-3 transition-all duration-300 ${
                          active ? 'bg-secondary' : group.bgColor
                        } ${sidebarCollapsed ? 'lg:justify-center lg:px-2' : 'justify-start'}`}
                        onClick={() => {
                          navigate(item.href);
                          setSidebarOpen(false);
                        }}
                        title={sidebarCollapsed ? item.title : undefined}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${active ? '' : group.color}`} />
                        <span className={`text-sm font-medium flex-1 text-left transition-all duration-300 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                          {item.title}
                        </span>
                        {item.badge && !sidebarCollapsed && (
                          <span className="ml-auto px-2 py-0.5 text-[10px] font-semibold rounded-full bg-green-500/10 text-green-600 dark:text-green-400 lg:block hidden">
                            {item.badge}
                          </span>
                        )}
                      </Button>
                    );
                  })}

                  {/* More Items Toggle */}
                  {group.moreItems && group.moreItems.length > 0 && !sidebarCollapsed && (
                    <>
                      <Button
                        variant="ghost"
                        className={`w-full gap-2 justify-start text-muted-foreground hover:text-foreground text-xs h-7 ${sidebarCollapsed ? 'lg:hidden' : ''}`}
                        onClick={() =>
                          setExpandedGroups((prev) => ({
                            ...prev,
                            [group.label]: !prev[group.label],
                          }))
                        }
                      >
                        <ChevronRight
                          className={`h-3 w-3 transition-transform duration-200 ${
                            expandedGroups[group.label] ? 'rotate-90' : ''
                          }`}
                        />
                        <span>{expandedGroups[group.label] ? 'Ẩn bớt' : `Thêm ${group.moreItems.length} mục...`}</span>
                      </Button>
                      {expandedGroups[group.label] &&
                        group.moreItems.map((item) => {
                          const Icon = item.icon;
                          const active = isActive(item.href);
                          return (
                            <Button
                              key={item.href}
                              variant={active ? 'secondary' : 'ghost'}
                              className={`w-full gap-3 transition-all duration-300 ${
                                active ? 'bg-secondary' : group.bgColor
                              } justify-start pl-6 opacity-80 hover:opacity-100`}
                              onClick={() => {
                                navigate(item.href);
                                setSidebarOpen(false);
                              }}
                            >
                              <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? '' : group.color}`} />
                              <span className="text-sm font-medium flex-1 text-left">
                                {item.title}
                              </span>
                            </Button>
                          );
                        })}
                    </>
                  )}
                </div>

                {/* Separator between groups (except last) */}
                {group.label !== adminNavGroups.at(-1)?.label && <Separator className="my-4" />}
              </div>
            ))}
          </div>

          <Separator className="my-6" />

          {/* Quick Stats - ẩn khi collapsed */}
          <div className={`px-3 space-y-2 transition-all duration-300 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
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

          {/* Collapse Toggle Button at Bottom */}
          <div className={`mt-4 px-2 hidden lg:block`}>
            {sidebarCollapsed ? (
              <CompactToggle
                isCollapsed={sidebarCollapsed}
                onToggle={toggleSidebarCollapse}
              />
            ) : (
              <AnimatedCollapseButton
                isCollapsed={sidebarCollapsed}
                onToggle={toggleSidebarCollapse}
                label="Thu gọn menu"
              />
            )}
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
      <main className={`pt-16 pb-8 transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        <div className="container mx-auto p-6">
          <Outlet />
        </div>
      </main>

      {/* Floating Quick Capture - Available everywhere in admin */}
      <FloatingQuickCapture />

      {/* Travis AI - Floating chat widget */}
      <TravisChat />
    </div>
  );
};
