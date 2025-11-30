import { motion } from "framer-motion";
import { Heart, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProjectData } from "@/data/projects-data";

interface ProjectCTAProps {
  project: ProjectData;
}

export const ProjectCTA = ({ project }: ProjectCTAProps) => {
  const navigate = useNavigate();

  const handleInterest = () => {
    navigate(`/project-showcase/${project.slug}/interest`);
  };

  const handleInvestment = () => {
    navigate(`/project-showcase/${project.slug}/investment`);
  };

  return (
    <div className="relative overflow-hidden py-16 mb-12">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-surface/50 via-dark-bg to-dark-surface/50" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-cyan/30 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center"
      >
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="font-display text-3xl md:text-4xl font-bold gradient-text mb-4"
        >
          Quan Tâm Đến Dự Án Này?
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Hãy theo dõi hoặc đầu tư vào {project.name} để không bỏ lỡ cơ hội phát triển cùng chúng tôi
        </motion.p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          {/* Quan Tâm Dự Án Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="relative inline-block group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-neon-blue via-neon-cyan to-neon-blue rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-500 animate-pulse-glow"></div>
            <motion.button
              onClick={handleInterest}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="relative inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-neon-blue/20 to-neon-cyan/20 hover:from-neon-blue/30 hover:to-neon-cyan/30 text-white font-bold text-lg rounded-xl transition-all duration-300 border-2 border-neon-cyan/50 hover:border-neon-cyan shadow-lg hover:shadow-[0_0_30px_rgba(0,217,255,0.6)]"
            >
              <Heart className="w-6 h-6 text-neon-cyan" />
              <span className="bg-gradient-to-r from-neon-cyan via-white to-neon-blue bg-clip-text text-transparent">
                QUAN TÂM DỰ ÁN
              </span>
            </motion.button>
          </motion.div>

          {/* Đầu Tư Vào Dự Án Button */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="relative inline-block group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-500 animate-pulse-glow"></div>
            <motion.button
              onClick={handleInvestment}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="relative inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 font-bold text-lg rounded-xl transition-all duration-300 shadow-xl hover:shadow-[0_0_40px_rgba(251,191,36,1)]"
            >
              <TrendingUp className="w-6 h-6" />
              <span className="text-shadow-lg">ĐẦU TƯ VÀO DỰ ÁN</span>
            </motion.button>
          </motion.div>
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-sm text-muted-foreground"
        >
          <p>Tham gia cùng <span className="text-neon-cyan font-semibold">500+ nhà đầu tư</span> đã tin tưởng vào {project.name}</p>
        </motion.div>
      </motion.div>
    </div>
  );
};
