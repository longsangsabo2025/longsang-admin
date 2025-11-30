import { motion } from "framer-motion";
import { Code2 } from 'lucide-react';
import { ProjectData } from "@/data/projects-data";
import { GlowCard } from "./GlowCard";
import { NeonBadge } from "./NeonBadge";

// Simple component to render tech icons - uses CDN for brand icons
const TechIcon = ({ iconifyIcon, className }: { iconifyIcon?: string; className?: string }) => {
  if (!iconifyIcon) {
    return <Code2 className={className} />;
  }
  
  // Extract icon name from iconify format (e.g., "simple-icons:react" -> "react")
  const iconName = iconifyIcon.split(':')[1] || iconifyIcon;
  const cdnUrl = `https://cdn.simpleicons.org/${iconName}`;
  
  return (
    <img 
      src={cdnUrl} 
      alt={iconName}
      className={className}
      onError={(e) => {
        // Fallback to Code2 icon if image fails to load
        e.currentTarget.style.display = 'none';
      }}
    />
  );
};

interface TechArchitectureProps {
  project: ProjectData;
}

export const TechArchitecture = ({ project }: TechArchitectureProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="py-12 space-y-8"
    >
      <h2 className="font-display text-3xl font-bold mb-6 glow-text">
        KIẾN TRÚC CÔNG NGHỆ
      </h2>

      {/* Tech Stack Grid with Real Logos */}
      {project.techStack && (
        <div className="space-y-4">
          <h3 className="font-display text-xl font-semibold text-neon-cyan">
            Tech Stack
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {project.techStack.map((tech, idx) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <GlowCard className="p-6 text-center h-full hover:scale-105 transition-transform group" glowColor="cyan">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      {tech.iconifyIcon ? (
                        <TechIcon 
                          iconifyIcon={tech.iconifyIcon} 
                          className="w-16 h-16 drop-shadow-[0_0_15px_rgba(0,217,255,0.5)] group-hover:drop-shadow-[0_0_25px_rgba(0,217,255,0.8)] transition-all" 
                        />
                      ) : tech.icon ? (
                        <tech.icon className="w-16 h-16 text-neon-cyan" />
                      ) : (
                        <Code2 className="w-16 h-16 text-neon-cyan" />
                      )}
                    </div>
                    <div>
                      <p className="font-display text-sm font-semibold text-foreground">
                        {tech.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {tech.category}
                      </p>
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Technical Details Grid */}
      {project.technicalDetails && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Performance Metrics */}
          {project.technicalDetails.performance && (
            <GlowCard glowColor="green" className="p-6">
              <h3 className="font-display text-lg font-semibold text-neon-green mb-4">
                Performance Metrics
              </h3>
              <div className="space-y-3">
                {project.technicalDetails.performance.map((metric) => (
                  <div key={metric.label} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{metric.label}</span>
                    <NeonBadge variant="green">{metric.value}</NeonBadge>
                  </div>
                ))}
              </div>
            </GlowCard>
          )}

          {/* Development Tools */}
          {project.technicalDetails.tools && (
            <GlowCard glowColor="cyan" className="p-6">
              <h3 className="font-display text-lg font-semibold text-neon-cyan mb-4">
                Development Tools
              </h3>
              <div className="grid grid-cols-4 gap-6">
                {project.technicalDetails.tools.map((tool) => (
                  <div key={tool.name} className="flex flex-col items-center gap-2 p-2 rounded hover:bg-neon-cyan/10 transition-colors group">
                    {tool.iconifyIcon ? (
                      <TechIcon 
                        iconifyIcon={tool.iconifyIcon} 
                        className="w-12 h-12 drop-shadow-[0_0_10px_rgba(0,217,255,0.4)] group-hover:drop-shadow-[0_0_20px_rgba(0,217,255,0.7)] transition-all" 
                      />
                    ) : (
                      <Code2 className="w-12 h-12 text-neon-cyan" />
                    )}
                    <span className="text-xs text-center text-muted-foreground">{tool.name}</span>
                  </div>
                ))}
              </div>
            </GlowCard>
          )}
        </div>
      )}

      {/* Infrastructure Details */}
      {project.technicalDetails?.infrastructure && (
        <GlowCard glowColor="blue" className="p-6">
          <h3 className="font-display text-lg font-semibold text-neon-blue mb-4">
            Infrastructure & Deployment
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {project.technicalDetails.infrastructure.map((item) => (
              <div key={item.label} className="space-y-2">
                <p className="text-sm font-semibold text-neon-blue">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </GlowCard>
      )}
    </motion.div>
  );
};
