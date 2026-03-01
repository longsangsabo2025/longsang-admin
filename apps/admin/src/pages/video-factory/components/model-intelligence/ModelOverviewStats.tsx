/**
 * Model Overview Stats — Top stat cards, capacity panel, alerts banner
 */

import {
  AlertCircle,
  Brain,
  Crown,
  Gauge,
  Image as ImageIcon,
  Trophy,
  Video,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MODEL_INTELLIGENCE } from '../../shared-data';
import type { ModelOverviewStatsProps } from './types';

export const ModelOverviewStats = ({
  totalProduction,
  activeModels,
  totalModelsCount,
  avgTime,
  topModel,
  capacityData,
  alerts,
}: ModelOverviewStatsProps) => {
  return (
    <>
      {/* ── Overview Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-yellow-500/30">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Production</p>
                <p className="text-2xl font-bold">{totalProduction}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-500/30">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Models</p>
                <p className="text-2xl font-bold">{activeModels} <span className="text-sm text-muted-foreground font-normal">/ {totalModelsCount}</span></p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Brain className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/30">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Gen Time</p>
                <p className="text-2xl font-bold">{avgTime.toFixed(1)}s</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Gauge className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/30">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">#1 Model</p>
                <p className="text-lg font-bold truncate">{topModel ? (MODEL_INTELLIGENCE[topModel.model]?.name || topModel.model) : '—'}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Crown className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Capacity Panel ─────────────────────────────────────────────────── */}
      {capacityData && (
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium flex items-center gap-1.5"><Video className="h-3.5 w-3.5" /> Video Slots</span>
                  <span className="text-sm text-muted-foreground">{capacityData.video.current}/{capacityData.video.limit}</span>
                </div>
                <Progress value={(capacityData.video.current / capacityData.video.limit) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> Image Slots</span>
                  <span className="text-sm text-muted-foreground">{capacityData.image.current}/{capacityData.image.limit}</span>
                </div>
                <Progress value={(capacityData.image.current / capacityData.image.limit) * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Alerts Banner ──────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="font-semibold text-sm text-destructive">
                {alerts.length} Model Alert{alerts.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-1.5">
              {alerts.map((alert, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} className="text-[10px] px-1.5">
                    {alert.severity === 'critical' ? '🔴' : '🟡'} {alert.type.replace(/_/g, ' ')}
                  </Badge>
                  <span>{alert.message}</span>
                  {alert.recommendation && (
                    <Badge variant="outline" className="text-[10px] text-green-600 border-green-500/30 gap-0.5">
                      → {MODEL_INTELLIGENCE[alert.recommendation]?.name || alert.recommendation}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
