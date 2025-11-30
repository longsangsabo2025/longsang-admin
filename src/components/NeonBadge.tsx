import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NeonBadgeProps {
  children: React.ReactNode;
  variant?: "cyan" | "blue" | "green";
  className?: string;
  onClick?: () => void;
}

export const NeonBadge = ({ children, variant = "cyan", className, onClick }: NeonBadgeProps) => {
  const variants = {
    cyan: "border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10",
    blue: "border-neon-blue text-neon-blue hover:bg-neon-blue/10",
    green: "border-neon-green text-neon-green hover:bg-neon-green/10",
  };

  return (
    <motion.span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full border text-xs font-medium transition-colors cursor-pointer",
        variants[variant],
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {children}
    </motion.span>
  );
};
