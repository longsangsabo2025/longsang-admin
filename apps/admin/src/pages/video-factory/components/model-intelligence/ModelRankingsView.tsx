/**
 * Model Rankings View — Rankings table + tier legend + Elon Strategy card
 */

import {
  Image as ImageIcon,
  Rocket,
  Shield,
  Trophy,
  Video,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  MODEL_INTELLIGENCE,
  TIER_CONFIG,
  IMAGE_MODELS_SET,
} from '../../shared-data';
import type { ModelRankingsViewProps } from './types';

export const ModelRankingsView = ({ modelPerf }: ModelRankingsViewProps) => {
  return (
    <div className="space-y-4">
      {/* Tier Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(TIER_CONFIG).map(([key, tier]) => (
          <Badge key={key} variant="outline" className={`${tier.color} text-xs gap-1`}>
            {tier.icon} {tier.label}
            <span className="text-muted-foreground ml-1">— {tier.description}</span>
          </Badge>
        ))}
      </div>

      {/* Rankings Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead className="text-right">Jobs</TableHead>
              <TableHead className="text-right">Success</TableHead>
              <TableHead className="text-right">Avg Time</TableHead>
              <TableHead>Speed</TableHead>
              <TableHead>Quality</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Last Used</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modelPerf.map((perf, idx) => {
              const meta = MODEL_INTELLIGENCE[perf.model];
              const tier = meta?.tier || (IMAGE_MODELS_SET.has(perf.model) ? 'image' : 'experimental');
              const tierCfg = TIER_CONFIG[tier];

              return (
                <TableRow key={perf.model} className={idx === 0 && perf.totalJobs > 0 ? 'bg-yellow-500/5' : ''}>
                  <TableCell className="font-bold text-muted-foreground">
                    {idx === 0 && perf.totalJobs > 0 ? <Trophy className="h-4 w-4 text-yellow-600" /> : idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{meta?.name || perf.model}</span>
                      {meta?.type === 'video' ? <Video className="h-3 w-3 text-muted-foreground" /> : <ImageIcon className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    {meta && <p className="text-xs text-muted-foreground mt-0.5">{meta.provider}</p>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${tierCfg.color} text-xs gap-1`}>
                      {tierCfg.icon} {tierCfg.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <div className="flex items-center justify-end gap-1">
                      <span className="font-semibold">{perf.completed}</span>
                      {perf.failed > 0 && <span className="text-xs text-destructive">+{perf.failed}⛔</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {perf.totalJobs > 0 ? (
                      <Badge variant={perf.successRate >= 90 ? 'default' : perf.successRate >= 70 ? 'secondary' : 'destructive'} className="text-xs">
                        {perf.successRate}%
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {perf.avgGenTime > 0 ? `${perf.avgGenTime}s` : '—'}
                  </TableCell>
                  <TableCell>
                    {meta ? (
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 rounded-full bg-muted w-16 overflow-hidden">
                          <div className="h-full rounded-full bg-green-500" style={{ width: `${meta.speed * 10}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{meta.speed}/10</span>
                      </div>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    {meta ? (
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 rounded-full bg-muted w-16 overflow-hidden">
                          <div className="h-full rounded-full bg-purple-500" style={{ width: `${meta.quality * 10}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{meta.quality}/10</span>
                      </div>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    {meta ? (
                      <Badge variant="outline" className={meta.costType === 'unlimited' ? 'text-green-600 border-green-500/30 text-xs' : meta.costType === 'free' ? 'text-blue-600 border-blue-500/30 text-xs' : 'text-orange-600 border-orange-500/30 text-xs'}>
                        {meta.costType === 'unlimited' ? '♾️ Unlimited' : meta.costType === 'free' ? '🆓 Free' : '💰 Credits'}
                      </Badge>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {perf.lastUsed ? new Date(perf.lastUsed).toLocaleDateString('vi-VN') : 'Never'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Elon Musk Strategy Recommendation */}
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Rocket className="h-4 w-4 text-yellow-600" />
            🧠 Elon Strategy — Focus on the BEST
          </CardTitle>
          <CardDescription>"If you're using 30 models, you're not using any of them well." — 80/15/5 Rule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {modelPerf.filter(m => m.totalJobs > 0).slice(0, 3).map((perf, idx) => {
              const meta = MODEL_INTELLIGENCE[perf.model];
              const allocation = idx === 0 ? 80 : idx === 1 ? 15 : 5;
              const role = idx === 0 ? 'Workhorse' : idx === 1 ? 'Premium' : 'Experimental';
              return (
                <div key={perf.model} className="p-3 rounded-lg border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{meta?.name || perf.model}</span>
                    <Badge variant={idx === 0 ? 'default' : 'outline'} className="text-xs">{allocation}%</Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="h-3 w-3" /> {role}
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">Jobs</span><span className="font-mono">{perf.completed}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Avg Time</span><span className="font-mono">{perf.avgGenTime}s</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Success</span><span className="font-mono">{perf.successRate}%</span></div>
                  </div>
                </div>
              );
            })}
          </div>
          {modelPerf.filter(m => m.totalJobs > 0).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No production data yet. Start generating to see recommendations.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
