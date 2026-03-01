import { motion } from 'framer-motion';
import { GlowCard } from './GlowCard';
import { ProjectData } from '@/data/projects-data';

interface OverviewSectionProps {
  project: ProjectData;
}

export const OverviewSection = ({ project }: OverviewSectionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="py-12"
    >
      <h2 className="font-display text-3xl font-bold mb-6 glow-text">{project.overviewTitle}</h2>

      <GlowCard glowColor="cyan">
        <div className="space-y-4">
          <p className="text-foreground/90 leading-relaxed">{project.overviewDescription}</p>

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="font-display text-lg font-semibold text-neon-cyan mb-3">
                Mục Tiêu Chính
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {project.objectives.map((objective, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-neon-cyan mt-1">▹</span>
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-display text-lg font-semibold text-neon-blue mb-3">
                Tác Động Thực Tế
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {project.impacts.map((impact, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-neon-blue mt-1">▹</span>
                    <span>{impact}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </GlowCard>
    </motion.div>
  );
};
