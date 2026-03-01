import { AppShowcaseData } from '@/types/app-showcase.types';
import { motion } from 'framer-motion';
import { Crown, Heart, Rocket, Shield, Sparkles, Star, Trophy, Zap } from 'lucide-react';
import { PhoneMockup } from './PhoneMockup';

// Icon map with common icons - lazy load others if needed
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Zap,
  Shield,
  Heart,
  Star,
  Trophy,
  Rocket,
  Crown,
};

interface FeaturesSectionProps {
  data: AppShowcaseData;
}

const FeatureIcon = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <motion.div
    className="relative inline-flex"
    animate={{
      rotate: [0, 5, 0, -5, 0],
      scale: [1, 1.1, 1, 1.1, 1],
    }}
    transition={{
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  >
    <motion.div
      className={`absolute inset-0 ${color} rounded-full blur-lg`}
      animate={{
        scale: [1, 1.5, 1],
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
    <div className={`relative ${color} rounded-full p-2`}>{children}</div>
  </motion.div>
);

// Get icon component by name - only use predefined icons
const getIconComponent = (iconName: string) => {
  return iconMap[iconName] || Sparkles;
};

export const FeaturesSection = ({ data }: FeaturesSectionProps) => {
  return (
    <section className="py-32 bg-gradient-to-b from-dark-bg via-dark-surface to-dark-bg relative overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-black gradient-text mb-6 font-display">
            Tính năng nổi bật
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Khám phá các tính năng độc đáo được thiết kế để nâng cao trải nghiệm của bạn
          </p>
        </motion.div>

        <div className="space-y-20">
          {data.features.map((feature, index) => {
            const IconComponent = getIconComponent(feature.icon);
            const isEven = index % 2 === 0;

            return (
              <motion.div
                key={feature.id}
                className={`grid lg:grid-cols-2 gap-8 items-center ${
                  !isEven ? 'lg:flex-row-reverse' : ''
                }`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <div className={`${!isEven ? 'lg:order-2' : 'order-2 lg:order-1'}`}>
                  {feature.badge && (
                    <div
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-${feature.badge.color}/10 border border-${feature.badge.color}/30 mb-4`}
                    >
                      <FeatureIcon color={`bg-${feature.badge.color}`}>
                        <IconComponent className={`w-5 h-5 text-${feature.badge.color}`} />
                      </FeatureIcon>
                      <span className={`text-${feature.badge.color} text-sm font-semibold`}>
                        {feature.badge.text}
                      </span>
                    </div>
                  )}

                  <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-display">
                    {feature.title}
                  </h3>

                  <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                    {feature.description}
                  </p>

                  {feature.highlights && feature.highlights.length > 0 && (
                    <ul className="space-y-2 mb-6">
                      {feature.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  )}

                  {feature.stats && feature.stats.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {feature.stats.map((stat, idx) => {
                        const StatIcon = stat.icon ? getIconComponent(stat.icon) : null;
                        return (
                          <motion.div
                            key={idx}
                            className="glass-panel rounded-xl p-4"
                            whileHover={{ scale: 1.05, borderColor: 'hsl(var(--neon-cyan))' }}
                            transition={{ type: 'spring', stiffness: 300 }}
                          >
                            {StatIcon && <StatIcon className="w-6 h-6 text-neon-cyan mb-2" />}
                            <p className="text-foreground font-semibold text-sm">{stat.label}</p>
                            <p className="text-muted-foreground text-xs">{stat.value}</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className={`${!isEven ? 'lg:order-1' : 'order-1 lg:order-2'}`}>
                  <PhoneMockup delay={index * 0.2}>
                    {feature.screenshot ? (
                      <img
                        src={feature.screenshot}
                        alt={feature.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="h-full bg-gradient-to-b from-app-dark to-dark-bg flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <IconComponent className="w-16 h-16 mx-auto mb-2 opacity-20" />
                          <p className="text-xs">Screenshot sẽ được thêm</p>
                        </div>
                      </div>
                    )}
                  </PhoneMockup>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
