import { motion } from 'framer-motion';
import { ChevronDown, Sparkles, ExternalLink } from 'lucide-react';
import { ActionButton } from './ui/ActionButton';
import { AppShowcaseData } from '@/types/app-showcase.types';

interface HeroSectionProps {
  data: AppShowcaseData;
}

export const HeroSection = ({ data }: HeroSectionProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Enhanced particle system */}
      <div className="absolute inset-0 opacity-40">
        {[...Array(100)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-neon-cyan"
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -150, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Floating blurred phones in background */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <motion.div
          className="absolute top-20 -left-20 w-64 h-96 bg-gradient-to-br from-neon-blue to-primary rounded-3xl blur-3xl"
          animate={{
            y: [0, 50, 0],
            rotate: [0, 10, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 -right-20 w-64 h-96 bg-gradient-to-br from-neon-cyan to-accent rounded-3xl blur-3xl"
          animate={{
            y: [0, -50, 0],
            rotate: [0, -10, 0],
          }}
          transition={{ duration: 25, repeat: Infinity }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 mb-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-foreground shadow-glow-cyan"
        >
          <Sparkles size={18} className="text-neon-cyan" />
          <span className="text-sm font-semibold font-display">{data.hero.badge}</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl md:text-8xl lg:text-9xl font-black mb-6 leading-[0.95] tracking-tight font-display"
        >
          <motion.span
            className="block gradient-text"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              backgroundSize: '200% 200%',
            }}
          >
            {data.hero.title}
          </motion.span>
          <span className="block text-foreground/90">{data.hero.subtitle.split(' / ')[0]}</span>
          <span className="block bg-gradient-to-r from-neon-blue via-primary to-accent bg-clip-text text-transparent">
            {data.hero.subtitle.split(' / ')[1] || data.hero.subtitle}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed"
        >
          {data.description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-wrap gap-4 justify-center mb-12"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative h-16 px-10 rounded-full bg-gradient-to-r from-primary via-neon-blue to-accent text-primary-foreground font-bold text-lg shadow-glow overflow-hidden font-display"
          >
            <span className="relative z-10">Tải Ứng Dụng</span>
            <motion.div
              className="absolute inset-0 bg-white/20"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.5 }}
            />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
            whileTap={{ scale: 0.95 }}
            className="h-16 px-10 rounded-full glass-panel border-2 text-foreground font-bold text-lg transition-all font-display"
          >
            Xem Demo
          </motion.button>

          <motion.a
            href="https://longsang.org"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(0, 217, 255, 0.15)' }}
            whileTap={{ scale: 0.95 }}
            className="h-16 px-10 rounded-full glass-panel border-2 border-neon-cyan/50 text-neon-cyan font-bold text-lg transition-all font-display flex items-center gap-2"
          >
            <span>Xem Trang Web</span>
            <ExternalLink size={20} />
          </motion.a>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap gap-8 justify-center items-center text-muted-foreground text-sm"
        >
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue to-primary border-2 border-dark-bg"
                />
              ))}
            </div>
            <span>{data.hero.stats.users}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-accent">★★★★★</span>
            <span>{data.hero.stats.rating}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neon-green font-bold">
              {data.hero.stats.tournaments.split('+')[0]}+
            </span>
            <span>{data.hero.stats.tournaments.split(' ').slice(1).join(' ')}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown size={36} className="text-muted-foreground" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
