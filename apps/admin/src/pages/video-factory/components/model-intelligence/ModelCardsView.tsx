/**
 * Model Cards View — Video models grid + Image models grid
 */

import {
  Activity,
  Clock,
  Gauge,
  Image as ImageIcon,
  Video,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MODEL_INTELLIGENCE, TIER_CONFIG } from '../../shared-data';
import type { ModelCardsViewProps } from './types';

const ModelCard = ({ meta, perf, tierCfg }: {
  meta: (typeof MODEL_INTELLIGENCE)[string];
  perf: { totalJobs: number; completed: number; avgGenTime: number; successRate: number } | undefined;
  tierCfg: (typeof TIER_CONFIG)[keyof typeof TIER_CONFIG];
}) => (
  <Card className="hover:border-primary/30 transition-colors">
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-base">{meta.name}</CardTitle>
        <Badge variant="outline" className={`${tierCfg.color} text-xs gap-1`}>{tierCfg.icon} {tierCfg.label}</Badge>
      </div>
      <CardDescription className="text-xs">{meta.provider}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      {/* Ratings */}
      <div className="space-y-1.5">
        {[
          { label: 'Speed', value: meta.speed, color: 'bg-green-500' },
          { label: 'Quality', value: meta.quality, color: 'bg-purple-500' },
          { label: 'Creativity', value: meta.creativity, color: 'bg-pink-500' },
        ].map(r => (
          <div key={r.label} className="flex items-center gap-2 text-xs">
            <span className="w-16 text-muted-foreground">{r.label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.value * 10}%` }} />
            </div>
            <span className="w-8 text-right font-mono">{r.value}/10</span>
          </div>
        ))}
      </div>

      {/* Specs (video-specific) */}
      {meta.type === 'video' && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Gauge className="h-3 w-3" /> {meta.maxResolution}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" /> {meta.maxDuration}
          </div>
          <div className="col-span-2">
            <Badge variant="outline" className={meta.costType === 'unlimited' ? 'text-green-600 border-green-500/30 text-xs' : 'text-orange-600 border-orange-500/30 text-xs'}>
              {meta.costType === 'unlimited' ? '♾️ Unlimited' : '💰 Credits'}
            </Badge>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="flex flex-wrap gap-1">
        {meta.features.map(f => (
          <Badge key={f} variant="secondary" className="text-[10px] px-1.5">{f}</Badge>
        ))}
      </div>

      {/* Best For */}
      <div className="text-xs p-2 rounded bg-muted/50 border">
        <span className="font-medium">Best for:</span> {meta.bestFor}
      </div>

      {/* Production Stats */}
      {perf && perf.totalJobs > 0 && (
        <div className="text-xs p-2 rounded bg-primary/5 border border-primary/20 space-y-1">
          <div className="font-medium flex items-center gap-1"><Activity className="h-3 w-3" /> Production Data</div>
          <div className="grid grid-cols-3 gap-2">
            <div><span className="text-muted-foreground">Jobs:</span> <span className="font-mono">{perf.completed}</span></div>
            <div><span className="text-muted-foreground">Avg:</span> <span className="font-mono">{perf.avgGenTime}s</span></div>
            <div><span className="text-muted-foreground">Rate:</span> <span className="font-mono">{perf.successRate}%</span></div>
          </div>
        </div>
      )}

      {/* Notes */}
      <p className="text-xs text-muted-foreground italic">{meta.notes}</p>
    </CardContent>
  </Card>
);

export const ModelCardsView = ({ modelPerf }: ModelCardsViewProps) => {
  return (
    <div className="space-y-6">
      {/* Video Models */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Video className="h-4 w-4" /> Video Models</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(MODEL_INTELLIGENCE).filter(m => m.type === 'video').map(meta => {
            const perf = modelPerf.find(p => p.model === meta.id);
            const tierCfg = TIER_CONFIG[meta.tier];
            return <ModelCard key={meta.id} meta={meta} perf={perf} tierCfg={tierCfg} />;
          })}
        </div>
      </div>

      {/* Image Models */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Image Models</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(MODEL_INTELLIGENCE).filter(m => m.type === 'image').map(meta => {
            const perf = modelPerf.find(p => p.model === meta.id);
            const tierCfg = TIER_CONFIG[meta.tier];
            return <ModelCard key={meta.id} meta={meta} perf={perf} tierCfg={tierCfg} />;
          })}
        </div>
      </div>
    </div>
  );
};
