import { motion } from 'framer-motion';
import { useParams, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { ArrowLeft, BarChart3, Map, DollarSign, FileText, TrendingUp } from 'lucide-react';
import { projectsData } from '@/data/projects-data';

const InvestmentPortalLayout = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const project = projectsData.find((p) => p.slug === slug) || projectsData[0];

  const navItems = [
    {
      path: `/project-showcase/${slug}/investment`,
      label: 'Tổng Quan',
      icon: TrendingUp,
    },
    {
      path: `/project-showcase/${slug}/investment/roadmap`,
      label: 'Lộ Trình',
      icon: Map,
    },
    {
      path: `/project-showcase/${slug}/investment/financials`,
      label: 'Tài Chính',
      icon: BarChart3,
    },
    {
      path: `/project-showcase/${slug}/investment/apply`,
      label: 'Đăng Ký',
      icon: FileText,
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/30 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/30 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-border/30 backdrop-blur-xl bg-dark-surface/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => navigate(`/project-showcase/${slug}`)}
              className="inline-flex items-center gap-2 text-yellow-500 hover:text-yellow-400 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Quay lại {project.name}</span>
            </motion.button>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="font-display text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Investment Portal
              </h1>
              <p className="text-sm text-muted-foreground">{project.name}</p>
            </motion.div>

            {/* CTA Quick Action */}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => navigate(`/project-showcase/${slug}/investment/apply`)}
              className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 font-bold rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              Đăng Ký Ngay
            </motion.button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="relative z-10 border-b border-border/30 backdrop-blur-xl bg-dark-surface/30">
        <div className="container mx-auto px-6">
          <nav className="flex gap-1 overflow-x-auto">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <motion.button
                  key={item.path}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => navigate(item.path)}
                  className={`
                    relative px-6 py-4 font-semibold transition-all whitespace-nowrap
                    ${active ? 'text-yellow-500' : 'text-muted-foreground hover:text-foreground'}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>

                  {/* Active Indicator */}
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-t-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <Outlet />
      </div>
    </div>
  );
};

export default InvestmentPortalLayout;
