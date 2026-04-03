import { AlertTriangle, BarChart3, CheckCircle2, Clock, Layers, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ContentStats } from '@/types/content-pipeline';
import { STAGES } from '@/types/content-pipeline';

interface Props {
  stats: ContentStats;
}

export function ContentStatsBar({ stats }: Props) {
  const cards = [
    {
      label: 'Tổng nội dung',
      value: stats.total,
      icon: Layers,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Đang làm',
      value: stats.byStage.script + stats.byStage.visual + stats.byStage.production,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Đã đăng tuần này',
      value: stats.publishedThisWeek,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Quá hạn',
      value: stats.overdueCount,
      icon: AlertTriangle,
      color: stats.overdueCount > 0 ? 'text-red-400' : 'text-muted-foreground',
      bg: stats.overdueCount > 0 ? 'bg-red-500/10' : 'bg-muted/10',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top-level stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="bg-card/60 backdrop-blur-sm border-white/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('flex items-center justify-center h-10 w-10 rounded-lg', c.bg)}>
                <c.icon className={cn('h-5 w-5', c.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold">{c.value}</p>
                <p className="text-[11px] text-muted-foreground">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline Mini Bar — horizontal stage progress */}
      <div className="flex items-center gap-1 rounded-lg border bg-card/40 p-2">
        {STAGES.map((stage) => {
          const count = stats.byStage[stage.key] || 0;
          const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
          return (
            <div
              key={stage.key}
              className="flex-1 flex flex-col items-center gap-1"
              title={`${stage.label}: ${count}`}
            >
              <span className="text-xs">{stage.icon}</span>
              <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    stage.key === 'idea' && 'bg-amber-500',
                    stage.key === 'script' && 'bg-blue-500',
                    stage.key === 'visual' && 'bg-purple-500',
                    stage.key === 'production' && 'bg-rose-500',
                    stage.key === 'review' && 'bg-emerald-500',
                    stage.key === 'published' && 'bg-cyan-500'
                  )}
                  style={{ width: `${Math.max(pct, count > 0 ? 10 : 0)}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
