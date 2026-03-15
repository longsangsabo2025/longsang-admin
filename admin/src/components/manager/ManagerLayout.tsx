import {
  Film,
  FolderOpen,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { UserProfile } from '@/components/auth/UserProfile';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const managerNavItems = [
  {
    title: '🏠 Tổng quan',
    icon: LayoutDashboard,
    href: '/manager',
    description: 'Dashboard & Quick actions',
    exact: true,
  },
  {
    title: '📁 Dự Án',
    icon: FolderOpen,
    href: '/manager/projects',
    description: 'Quản lý dự án được phân quyền',
  },
  {
    title: '📚 Thư Viện',
    icon: ImageIcon,
    href: '/manager/library',
    description: 'Media & tài liệu',
  },
  {
    title: '🖼️ Tạo Ảnh AI',
    icon: Sparkles,
    href: '/manager/image-generator',
    description: 'Tạo & chỉnh sửa ảnh với AI',
  },
  {
    title: '🎬 Tạo Video AI',
    icon: Film,
    href: '/manager/video-generator',
    description: 'Veo 3, Image to Video, UGC Ads',
  },
  {
    title: '💬 Gemini Chat',
    icon: Sparkles,
    href: '/manager/gemini-chat',
    description: 'Chat với Google Gemini AI',
  },
];

export function ManagerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Đăng xuất thành công');
      navigate('/manager/login');
    } catch (error: unknown) {
      console.error('Logout error:', error);
      toast.error('Lỗi đăng xuất');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Left side */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                M
              </div>
              <span className="font-semibold hidden sm:inline-block">Manager Portal</span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserProfile />
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Đăng xuất">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-64 border-r bg-background transition-transform lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <ScrollArea className="h-full py-4">
            <div className="px-3 space-y-1">
              <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Menu
              </p>

              {managerNavItems.map((item) => {
                const isActive = item.exact
                  ? location.pathname === item.href
                  : location.pathname === item.href ||
                    location.pathname.startsWith(item.href + '/');

                return (
                  <Button
                    key={item.href}
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-3 h-auto py-3',
                      isActive && 'bg-primary/10 text-primary'
                    )}
                    onClick={() => {
                      navigate(item.href);
                      if (window.innerWidth < 1024) setSidebarOpen(false);
                    }}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </div>
                  </Button>
                );
              })}
            </div>

            {/* Help section */}
            <div className="px-3 py-4 border-t mt-8">
              <div className="rounded-lg bg-muted/50 p-4">
                <h4 className="font-medium mb-1">💡 Hỗ trợ</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Liên hệ admin nếu cần thêm quyền truy cập dự án.
                </p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href="mailto:longsang2103@gmail.com">Liên hệ Admin</a>
                </Button>
              </div>
            </div>
          </ScrollArea>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/50 lg:hidden cursor-default"
            onClick={() => setSidebarOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setSidebarOpen(false)}
            aria-label="Close sidebar"
          />
        )}

        {/* Main Content */}
        <main
          className={cn(
            'flex-1 transition-all duration-300 min-h-[calc(100vh-3.5rem)]',
            sidebarOpen ? 'lg:ml-64' : 'ml-0'
          )}
        >
          <div className="h-full py-4 px-4 lg:px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default ManagerLayout;
