import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Clock, DollarSign, Sparkles, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { N8N_WORKFLOWS, type N8nWorkflow, RelativeTime } from './mission-control.types';

export function AutomationRevenue() {
  const { toast } = useToast();

  // ── n8n workflow local state
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>(N8N_WORKFLOWS);

  // ── Revenue & cost aggregates
  const { data: costStats } = useQuery({
    queryKey: ['mission-control', 'cost-stats'],
    queryFn: async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);

      const [todayCostRes, weekVideosRes, monthCostRes] = await Promise.all([
        supabase
          .from('pipeline_runs')
          .select('total_cost')
          .gte('created_at', todayStart.toISOString()),
        supabase
          .from('pipeline_runs')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', weekStart.toISOString())
          .eq('status', 'completed'),
        supabase
          .from('pipeline_runs')
          .select('total_cost')
          .gte(
            'created_at',
            new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
          ),
      ]);

      const todayCost = (todayCostRes.data ?? []).reduce((s, r) => s + (r.total_cost ?? 0), 0);
      const monthCost = (monthCostRes.data ?? []).reduce((s, r) => s + (r.total_cost ?? 0), 0);
      const weekVideos = weekVideosRes.count ?? 0;
      const avgCost = weekVideos > 0 ? todayCost / Math.max(weekVideos, 1) : 0;

      return { todayCost, weekVideos, monthCost, avgCost };
    },
  });

  const safe = costStats ?? { todayCost: 0, weekVideos: 0, monthCost: 0, avgCost: 0 };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ─── AUTOMATION STATUS (left, 2/3 width) ─── */}
      <section className="lg:col-span-2 space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5" /> Automation Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {workflows.map((wf) => (
            <Card key={wf.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{wf.name}</CardTitle>
                  <Switch
                    checked={wf.enabled}
                    onCheckedChange={(checked) => {
                      setWorkflows((prev) =>
                        prev.map((w) => (w.id === wf.id ? { ...w, enabled: checked } : w))
                      );
                      toast({ title: `${wf.name} ${checked ? 'enabled' : 'disabled'}` });
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-1 pt-0">
                <Badge variant="outline" className="text-[10px]">
                  {wf.triggerType}
                </Badge>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Last: <RelativeTime iso={wf.lastRun} />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3 w-3" />
                  Next: {wf.nextRun ? new Date(wf.nextRun).toLocaleString() : '—'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── REVENUE & COSTS (right, 1/3 width) ─── */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5" /> Revenue & Costs
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Today's Pipeline Cost</CardDescription>
              <CardTitle className="text-2xl">${safe.todayCost.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Videos This Week</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                {safe.weekVideos}
                <TrendingUp className="h-5 w-5 text-green-500" />
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Est. Monthly Cost</CardDescription>
              <CardTitle className="text-2xl">${safe.monthCost.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Cost / Video (avg)</CardDescription>
              <CardTitle className="text-2xl">${safe.avgCost.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
}
