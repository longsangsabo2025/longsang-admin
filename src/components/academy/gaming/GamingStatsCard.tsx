import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface GamingStatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down";
}

export const GamingStatsCard = ({ icon: Icon, title, value, change, trend }: GamingStatsCardProps) => {
  return (
    <Card className="glass-card p-6 hover-lift group cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-gradient-to-br from-gaming-purple to-gaming-cyan group-hover:shadow-[0_0_20px_hsl(260,60%,60%/0.5)] transition-all">
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-3xl font-bold text-foreground mb-2">{value}</p>
        {change && (
          <div className="flex items-center gap-1">
            <span className={`text-xs px-2 py-1 rounded-full ${
              trend === "up" 
                ? "bg-gaming-success/20 text-gaming-success" 
                : "bg-gaming-warning/20 text-gaming-warning"
            }`}>
              {change}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};
