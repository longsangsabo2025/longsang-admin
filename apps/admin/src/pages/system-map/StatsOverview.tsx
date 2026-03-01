/**
 * Stats overview cards for SystemMap
 */

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ServiceHealth } from './shared';

// ============================================================
// PROPS
// ============================================================

export interface StatsOverviewProps {
  services: ServiceHealth[];
}

// ============================================================
// COMPONENT
// ============================================================

export function StatsOverview({ services }: StatsOverviewProps) {
  const online = services.filter((s) => s.status === 'online').length;
  const offline = services.filter((s) => s.status === 'offline').length;
  const degraded = services.filter((s) => s.status === 'degraded').length;
  const total = services.length;
  const healthPercent = Math.round((online / total) * 100);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Services</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
            <Layers className="h-8 w-8 text-muted-foreground/50" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Online</p>
              <p className="text-2xl font-bold text-green-600">{online}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500/50" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Issues</p>
              <p className="text-2xl font-bold text-red-600">{offline + degraded}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500/50" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div>
            <p className="text-sm text-muted-foreground">Health Score</p>
            <p className="text-2xl font-bold">{healthPercent}%</p>
          </div>
          <Progress value={healthPercent} className="mt-2" />
        </CardContent>
      </Card>
    </div>
  );
}
