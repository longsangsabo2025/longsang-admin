import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: "cyan" | "blue" | "green";
  hover?: boolean;
  onClick?: () => void;
}

export const GlowCard = ({ children, className, glowColor = "cyan", hover = true, onClick }: GlowCardProps) => {
  const glowClass = {
    cyan: "glow-border",
    blue: "glow-border-blue",
    green: "shadow-[0_0_20px_hsl(var(--neon-green)/0.3)]",
  }[glowColor];

  return (
    <motion.div
      className={cn(
        "glass-panel rounded-lg p-6 transition-all duration-300",
        glowClass,
        hover && "hover:scale-[1.02] hover:shadow-[0_0_30px_hsl(var(--neon-cyan)/0.5)]",
        className
      )}
      whileHover={hover ? { y: -5 } : {}}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};
