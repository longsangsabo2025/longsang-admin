import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Settings, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppShowcaseService } from '@/services/app-showcase.service';
import { AppShowcaseData } from '@/types/app-showcase.types';
import { AnimatedBackground } from '@/components/showcase/AnimatedBackground';

const AppShowcaseList = () => {
  const [projects, setProjects] = useState<AppShowcaseData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const allProjects = await AppShowcaseService.loadAllProjects();
    setProjects(allProjects);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải danh sách projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-dark-bg">
      <AnimatedBackground />

      {/* Admin Button - Floating */}
      <Link
        to="/app-showcase/admin"
        className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full bg-neon-cyan text-dark-bg flex items-center justify-center shadow-lg shadow-neon-cyan/50 hover:scale-110 transition-transform"
        title="Vào trang Admin"
      >
        <Settings size={24} />
      </Link>

      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden px-6 py-20">
        <div className="relative z-10 container mx-auto text-center max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 mb-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-foreground shadow-glow-cyan"
          >
            <Sparkles size={18} className="text-neon-cyan" />
            <span className="text-sm font-semibold font-display">Portfolio Showcase</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight font-display"
          >
            <span className="gradient-text">App Showcase</span>
            <br />
            <span className="text-foreground/90">Khám Phá Dự Án</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed"
          >
            Tổng hợp các ứng dụng và dự án đã triển khai thành công
          </motion.p>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="relative py-20 px-6">
        <div className="container mx-auto max-w-7xl">
          {projects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-muted-foreground text-lg">Chưa có project nào được showcase</p>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project, index) => (
                <motion.div
                  key={project.slug}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative"
                >
                  <Link to={`/app-showcase/${project.slug}`}>
                    <div className="glass-panel rounded-2xl p-6 border border-white/10 hover:border-neon-cyan/50 transition-all h-full">
                      {/* App Icon/Logo */}
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-blue mb-4 flex items-center justify-center text-4xl">
                        {project.icon || '🎮'}
                      </div>

                      {/* Title */}
                      <h3 className="text-2xl font-bold text-foreground mb-2 font-display">
                        {project.appName}
                      </h3>

                      {/* Tagline */}
                      <p className="text-sm text-neon-cyan mb-3 font-semibold">{project.tagline}</p>

                      {/* Description */}
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                        {project.description}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <span className="text-accent">★★★★★</span>
                          <span>{project.hero?.stats?.rating || '5.0'}</span>
                        </div>
                        <div>
                          <span className="text-neon-green font-bold">
                            {project.hero?.stats?.users || '1000+'}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <div className="flex-1 px-4 py-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-sm font-semibold text-center group-hover:bg-neon-cyan/20 transition-colors">
                          Xem Chi Tiết
                        </div>
                        {project.productionUrl && (
                          <a
                            href={project.productionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-10 h-10 rounded-lg bg-neon-blue/10 border border-neon-blue/30 text-neon-blue flex items-center justify-center hover:bg-neon-blue/20 transition-colors"
                            title="Xem trang web"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AppShowcaseList;
