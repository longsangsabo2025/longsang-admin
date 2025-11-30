import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowIntensity?: "low" | "medium" | "high";
}

export const GlowCard = ({ children, className, glowIntensity = "medium" }: GlowCardProps) => {
  const glowStyles = {
    low: "glow-border",
    medium: "glow-box",
    high: "shadow-[0_0_40px_hsl(var(--glow-cyan)/0.4)]",
  };

  return (
    <div
      className={cn(
        "rounded-lg bg-card/50 backdrop-blur-sm border border-primary/30 p-6 transition-all duration-300 hover:border-primary/50",
        glowStyles[glowIntensity],
        className
      )}
    >
      {children}
    </div>
  );
};
