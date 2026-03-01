import {
  BookOpen,
  Flag,
  Star,
  Bookmark,
  Trophy,
  BarChart3,
  Search,
  Cpu,
  Code,
  Palette,
  Database,
  Link,
  Smartphone,
  Rocket,
  Mail,
  Users,
  MessageSquare,
  Gift,
  Settings,
  HelpCircle,
  GraduationCap,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useUserEnrollments } from '@/hooks/useAcademy';
import { useGamification } from '@/hooks/useGamification';

const categories = [
  { icon: Cpu, label: 'AI & Machine Learning', badge: '🔥', slug: 'ai-machine-learning' },
  { icon: Code, label: 'Web Development', badge: '📈', slug: 'web-development' },
  { icon: Palette, label: 'UI/UX Design', badge: '⚡', slug: 'ui-ux-design' },
  { icon: Database, label: 'Data Science', badge: '🆕', slug: 'data-science' },
  { icon: Link, label: 'Blockchain & Web3', badge: '💎', slug: 'blockchain-web3' },
  { icon: Smartphone, label: 'Mobile Development', badge: '✨', slug: 'mobile-development' },
  { icon: Rocket, label: 'Game Development', badge: '🎯', slug: 'game-development' },
  { icon: Mail, label: 'Digital Marketing', badge: '💼', slug: 'digital-marketing' },
];

export const GamingSidebar = () => {
  const location = useLocation();
  const { data: enrollmentsData } = useUserEnrollments();
  const { badges } = useGamification();

  const enrollments = Array.isArray(enrollmentsData)
    ? enrollmentsData
    : enrollmentsData?.data || [];

  // Calculate real stats
  const inProgressCount = enrollments.filter((e) => !e.completed_at && e.progress > 0).length;
  const completedCount = enrollments.filter((e) => e.completed_at).length;
  const savedCount = 0; // TODO: Implement saved courses
  const certificatesCount = completedCount;

  const myLearningItems = [
    { icon: Home, label: 'All Courses', path: '/academy', badge: null },
    {
      icon: Flag,
      label: 'In Progress',
      path: '/academy/my-learning?tab=in-progress',
      badge: inProgressCount > 0 ? String(inProgressCount) : null,
    },
    {
      icon: Star,
      label: 'Completed',
      path: '/academy/my-learning?tab=completed',
      badge: completedCount > 0 ? String(completedCount) : null,
    },
    {
      icon: Bookmark,
      label: 'Saved Courses',
      path: '/academy/my-learning?tab=not-started',
      badge: null,
    },
    {
      icon: Trophy,
      label: 'My Certificates',
      path: '/academy/certificates',
      badge: certificatesCount > 0 ? String(certificatesCount) : null,
    },
    { icon: BarChart3, label: 'Learning Stats', path: '/academy/stats', badge: null },
  ];

  const communityItems = [
    { icon: MessageSquare, label: 'Discussions', path: '/academy', badge: 'Soon' },
    { icon: Trophy, label: 'Leaderboard', path: '/academy/leaderboard', badge: null },
    { icon: Users, label: 'Study Groups', path: '/academy', badge: 'Soon' },
    { icon: Flag, label: 'Challenges', path: '/academy', badge: 'Soon' },
    { icon: Gift, label: 'Rewards Shop', path: '/academy', badge: 'Soon' },
  ];

  const isActive = (path: string) => {
    if (path === '/academy') {
      return location.pathname === '/academy';
    }
    return location.pathname.startsWith(path.split('?')[0]);
  };

  return (
    <aside className="fixed left-0 top-[70px] bottom-0 w-[260px] glass-card border-r border-border/50 hidden lg:block z-40">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-6">
          {/* My Learning */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold mb-3 text-foreground">
              <BookOpen className="h-4 w-4" />
              MY LEARNING
            </h3>
            <div className="space-y-1">
              {myLearningItems.map((item) => (
                <RouterLink key={item.label} to={item.path}>
                  <Button
                    variant={isActive(item.path) ? 'gaming' : 'ghost'}
                    className="w-full justify-start text-sm"
                    size="sm"
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                    {item.badge && (
                      <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-primary/20">
                        {item.badge}
                      </span>
                    )}
                  </Button>
                </RouterLink>
              ))}
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Browse Courses */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold mb-3 text-foreground">
              <Search className="h-4 w-4" />
              ALL COURSES
            </h3>
            <div className="space-y-1">
              {categories.map((item) => (
                <RouterLink key={item.label} to={`/academy/category/${item.slug}`}>
                  <Button
                    variant={
                      location.pathname === `/academy/category/${item.slug}` ? 'gaming' : 'ghost'
                    }
                    className="w-full justify-start text-sm hover:bg-muted/50"
                    size="sm"
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <span className="text-xs">{item.badge}</span>
                  </Button>
                </RouterLink>
              ))}
              <RouterLink to="/academy">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm text-primary"
                  size="sm"
                >
                  + View All Categories
                </Button>
              </RouterLink>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Community Hub */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold mb-3 text-foreground">
              <Users className="h-4 w-4" />
              COMMUNITY
            </h3>
            <div className="space-y-1">
              {communityItems.map((item) => (
                <RouterLink key={item.label} to={item.path}>
                  <Button
                    variant={isActive(item.path) && item.path !== '/academy' ? 'gaming' : 'ghost'}
                    className="w-full justify-start text-sm hover:bg-muted/50"
                    size="sm"
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                    {item.badge && (
                      <span className="ml-auto text-xs text-muted-foreground">{item.badge}</span>
                    )}
                  </Button>
                </RouterLink>
              ))}
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Additional */}
          <div className="space-y-1">
            <RouterLink to="/admin/settings">
              <Button variant="ghost" className="w-full justify-start text-sm" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </RouterLink>
            <Button variant="ghost" className="w-full justify-start text-sm" size="sm">
              <HelpCircle className="h-4 w-4 mr-2" />
              Support
            </Button>
            <Button variant="neon" className="w-full justify-start text-sm" size="sm">
              <GraduationCap className="h-4 w-4 mr-2" />
              Become Instructor
            </Button>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
};
