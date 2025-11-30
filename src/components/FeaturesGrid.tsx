import { motion } from 'framer-motion';
import { GlowCard } from './GlowCard';
import { ProjectData } from '@/data/projects-data';

interface FeaturesGridProps {
  project: ProjectData;
}

export const FeaturesGrid = ({ project }: FeaturesGridProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="py-12"
    >
      <h2 className="font-display text-3xl font-bold mb-6 glow-text">TÍNH NĂNG NỔI BẬT</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {project.features.map((feature, idx) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
          >
            <GlowCard glowColor={feature.color as 'cyan' | 'blue' | 'green'} className="h-full">
              <div className="flex flex-col items-center text-center mb-4">
                <div
                  className={`
                  p-4 rounded-lg mb-4
                  ${feature.color === 'cyan' && 'bg-neon-cyan/10'}
                  ${feature.color === 'blue' && 'bg-neon-blue/10'}
                  ${feature.color === 'green' && 'bg-neon-green/10'}
                `}
                >
                  <feature.icon
                    className={`
                    h-8 w-8
                    ${feature.color === 'cyan' && 'text-neon-cyan'}
                    ${feature.color === 'blue' && 'text-neon-blue'}
                    ${feature.color === 'green' && 'text-neon-green'}
                  `}
                  />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
              </div>

              <ul className="space-y-2">
                {feature.points.map((point, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 + i * 0.05 }}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span
                      className={`
                      mt-1 text-lg
                      ${feature.color === 'cyan' && 'text-neon-cyan'}
                      ${feature.color === 'blue' && 'text-neon-blue'}
                      ${feature.color === 'green' && 'text-neon-green'}
                    `}
                    >
                      ✓
                    </span>
                    <span>{point}</span>
                  </motion.li>
                ))}
              </ul>
            </GlowCard>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
