import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScreenCardProps {
  children: ReactNode;
  className?: string;
}

export const ScreenCard = ({ children, className }: ScreenCardProps) => {
  return (
    <div
      className={cn(
        "glass-panel rounded-xl p-4 backdrop-blur-glass border border-white/10",
        className
      )}
    >
      {children}
    </div>
  );
};
