import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PillBadgeProps {
  text: string;
  icon?: LucideIcon;
  variant?: "default" | "accent";
}

export const PillBadge = ({ text, icon: Icon, variant = "default" }: PillBadgeProps) => {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md",
        variant === "default" ? "bg-white/15 text-white" : "bg-app-light-blue/20 text-app-light-blue"
      )}
    >
      {Icon && <Icon size={16} />}
      {text}
    </div>
  );
};
