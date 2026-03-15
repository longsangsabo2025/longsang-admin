import { BookOpen, Command, HelpCircle, Home, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '@/components/auth/UserProfile';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Button } from '@/components/ui/button';
import { ActivityFeed } from './ActivityFeed';
import { ProjectQuickNav } from './ProjectQuickNav';

interface AdminHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const AdminHeader = ({ sidebarOpen, onToggleSidebar }: AdminHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur-md">
      <div className="flex h-16 items-center px-4 gap-4">
        {/* Mobile Menu Toggle */}
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onToggleSidebar}>
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
          <ProjectQuickNav onNavigate={(path) => navigate(path)} />

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
            variant="outline"
            size="sm"
            className="hidden md:inline-flex gap-1.5 text-xs text-muted-foreground"
            onClick={() =>
              document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
            }
          >
            <Command className="h-3 w-3" />
            <span>Ctrl+K</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/docs/viewer')}
            title="Tài liệu hướng dẫn"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
          <ThemeToggle />
          <ActivityFeed />
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
  );
};
