import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ExternalLink } from "lucide-react";
import { GlowCard } from "./GlowCard";
import { ProjectData } from "@/data/projects-data";

interface ProjectHeroProps {
  project: ProjectData;
}

export const ProjectHero = ({ project }: ProjectHeroProps) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    // Navigate to the project showcase detail page using slug
    // Use project.slug if available, otherwise generate from name
    const slug = project.slug || project.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, ''); // Remove any special characters
    console.log('Navigate to:', `/project-showcase/${slug}`, 'from project:', project.name, 'slug:', project.slug);
    navigate(`/project-showcase/${slug}`);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-cyan/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-blue/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 py-12"
      >
        {/* Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-4 gradient-text">
              {project.heroTitle}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
              {project.heroDescription}
            </p>
            
            {/* Buttons Container */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {/* View Details Button - Premium Design */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative inline-block group"
              >
                {/* Animated border glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-green rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-pulse-glow"></div>
                
                {/* Button */}
                <motion.button
                  onClick={handleViewDetails}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative inline-flex items-center gap-3 px-10 py-4 bg-background/80 backdrop-blur-sm hover:bg-background/60 text-white font-display font-bold text-lg rounded-xl transition-all duration-500 shadow-[0_0_30px_rgba(0,217,255,0.6),inset_0_0_20px_rgba(0,217,255,0.1)] hover:shadow-[0_0_50px_rgba(0,217,255,1),inset_0_0_30px_rgba(0,217,255,0.2)] border-2 border-neon-cyan/50 hover:border-neon-cyan"
                >
                  <span className="relative z-10 tracking-wide bg-gradient-to-r from-neon-cyan via-white to-neon-blue bg-clip-text text-transparent">
                    XEM CHI TIẾT SẢN PHẨM
                  </span>
                  
                  {/* Arrow with animation */}
                  <motion.div
                    className="relative z-10 text-neon-cyan"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <ArrowRight className="w-6 h-6" strokeWidth={2.5} />
                  </motion.div>
                  
                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    initial={{ x: "-100%" }}
                    whileHover={{
                      x: "100%",
                      transition: { duration: 0.6, ease: "easeInOut" }
                    }}
                    style={{
                      background: "linear-gradient(90deg, transparent, rgba(0,217,255,0.2), transparent)",
                    }}
                  />
                </motion.button>
              </motion.div>

              {/* View Production Website Button */}
              {project.productionUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="relative inline-block group"
                >
                  {/* Animated border glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-neon-green via-neon-cyan to-neon-blue rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-pulse-glow"></div>
                  
                  {/* Button */}
                  <motion.a
                    href={project.productionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative inline-flex items-center gap-3 px-10 py-4 bg-background/80 backdrop-blur-sm hover:bg-background/60 text-white font-display font-bold text-lg rounded-xl transition-all duration-500 shadow-[0_0_30px_rgba(62,207,142,0.6),inset_0_0_20px_rgba(62,207,142,0.1)] hover:shadow-[0_0_50px_rgba(62,207,142,1),inset_0_0_30px_rgba(62,207,142,0.2)] border-2 border-neon-green/50 hover:border-neon-green"
                  >
                    <span className="relative z-10 tracking-wide bg-gradient-to-r from-neon-green via-white to-neon-cyan bg-clip-text text-transparent">
                      XEM TRANG WEB
                    </span>
                    
                    {/* External Link Icon with animation */}
                    <motion.div
                      className="relative z-10 text-neon-green"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <ExternalLink className="w-6 h-6" strokeWidth={2.5} />
                    </motion.div>
                    
                    {/* Shine effect */}
                    <motion.div
                      className="absolute inset-0 rounded-xl"
                      initial={{ x: "-100%" }}
                      whileHover={{
                        x: "100%",
                        transition: { duration: 0.6, ease: "easeInOut" }
                      }}
                      style={{
                        background: "linear-gradient(90deg, transparent, rgba(62,207,142,0.2), transparent)",
                      }}
                    />
                  </motion.a>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {project.heroStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
            >
              <GlowCard className="text-center" glowColor="cyan">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-lg bg-neon-cyan/10">
                    <stat.icon className="h-6 w-6 text-neon-cyan" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      {stat.label}
                    </p>
                    <p className="font-display text-lg font-semibold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
