import { useAuth } from '@/components/auth/AuthProvider';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { BookOpen, GraduationCap, Mail, Settings, ShoppingBag, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';

  const quickActions = [
    {
      icon: GraduationCap,
      title: 'AI Academy',
      description: 'Tiếp tục học tập',
      href: '/academy',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: ShoppingBag,
      title: 'AI Marketplace',
      description: 'Khám phá AI Agents',
      href: '/marketplace',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: BookOpen,
      title: 'Dự Án',
      description: 'Xem các dự án',
      href: '/#projects',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Mail,
      title: 'Liên Hệ',
      description: 'Tư vấn dự án',
      href: '/consultation',
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          {/* Welcome Section */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Xin chào, {userName}! 👋
                </h1>
                <p className="text-muted-foreground">{userEmail}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Truy cập nhanh</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action) => (
                <button
                  key={action.href}
                  onClick={() => navigate(action.href)}
                  className="group bg-card border border-border/10 rounded-2xl p-6 text-left hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all duration-300"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity or Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account Info */}
            <div className="bg-card border border-border/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-semibold text-foreground">Thông tin tài khoản</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Tên hiển thị</p>
                  <p className="text-foreground font-medium">{userName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-foreground font-medium">{userEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vai trò</p>
                  <p className="text-foreground font-medium">
                    {user?.user_metadata?.role === 'admin' ? 'Admin' : 'User'}
                  </p>
                </div>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                🎉 Chào mừng đến với Long Sang!
              </h3>
              <p className="text-muted-foreground mb-4">
                Cảm ơn bạn đã đăng ký. Khám phá các khóa học AI, mua sắm AI Agents, hoặc liên hệ để
                được tư vấn dự án chuyên nghiệp.
              </p>
              <Button
                onClick={() => navigate('/academy')}
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                Bắt đầu học ngay
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
