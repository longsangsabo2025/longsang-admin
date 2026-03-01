/**
 * Channel-Model Matrix View — Channel→model mapping, production distribution, selection guide
 */

import {
  BarChart3,
  TrendingUp,
  Tv,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Channel, VideoModel } from '@/services/video-factory.service';
import { MODEL_INTELLIGENCE, TIER_CONFIG } from '../../shared-data';
import type { ChannelMatrixViewProps } from './types';

export const ChannelMatrixView = ({
  channels,
  modelPerf,
  totalProduction,
  allModelIds,
  switchModelMutation,
}: ChannelMatrixViewProps) => {
  return (
    <div className="space-y-4">
      {channels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Tv className="h-12 w-12 mb-4" />
          <p>No channels configured yet</p>
          <p className="text-sm">Create channels to see model assignments</p>
        </div>
      ) : (
        <>
          {/* Channel → Model Mapping */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Tv className="h-4 w-4" /> Channel → Model Assignment
              </CardTitle>
              <CardDescription>Which model powers each channel</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Niche</TableHead>
                    <TableHead>Preferred Model</TableHead>
                    <TableHead>Model Tier</TableHead>
                    <TableHead className="text-right">Videos/Day</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Switch</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channels.map((ch: Channel) => {
                    const meta = MODEL_INTELLIGENCE[ch.preferred_model];
                    const perf = modelPerf.find(p => p.model === ch.preferred_model);
                    const tier = meta?.tier || 'experimental';
                    const tierCfg = TIER_CONFIG[tier];
                    return (
                      <TableRow key={ch.id}>
                        <TableCell className="font-medium">{ch.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {ch.platform === 'youtube' ? '📺' : ch.platform === 'tiktok' ? '🎵' : '📱'} {ch.platform}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{ch.niche}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{meta?.name || ch.preferred_model}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${tierCfg.color} text-xs gap-1`}>{tierCfg.icon} {tierCfg.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">{ch.videos_per_day}</TableCell>
                        <TableCell>
                          {perf && perf.totalJobs > 0 ? (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-mono">{perf.avgGenTime}s avg</span>
                              <Badge variant={perf.successRate >= 90 ? 'default' : 'secondary'} className="text-xs">{perf.successRate}%</Badge>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No data</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={ch.preferred_model}
                            onValueChange={(val) => {
                              switchModelMutation.mutate({ channelId: ch.id, model: val as VideoModel });
                            }}
                          >
                            <SelectTrigger className="h-7 w-[140px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {allModelIds.map(id => (
                                <SelectItem key={id} value={id} className="text-xs">
                                  {MODEL_INTELLIGENCE[id]?.name || id}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Model Usage Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Production Distribution
              </CardTitle>
              <CardDescription>How production output is distributed across models</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {modelPerf.filter(m => m.completed > 0).map(perf => {
                  const meta = MODEL_INTELLIGENCE[perf.model];
                  const pct = totalProduction > 0 ? Math.round((perf.completed / totalProduction) * 100) : 0;
                  return (
                    <div key={perf.model} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{meta?.name || perf.model}</span>
                        <span className="text-muted-foreground font-mono">{perf.completed} jobs ({pct}%)</span>
                      </div>
                      <div className="h-3 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {modelPerf.filter(m => m.completed > 0).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No production data yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Quick Recommendation */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Model Selection Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { need: '⚡ Max Speed Production', rec: 'MiniMax Hailuo', reason: '~22s, unlimited, consistent' },
              { need: '🎬 Cinematic Hero Content', rec: 'Kling 3.0', reason: '4K + audio + multi-shot 15s' },
              { need: '🎨 Artistic / Editorial', rec: 'Soul 2.0', reason: '20+ presets, culture-native' },
              { need: '🖼️ Best Thumbnails', rec: 'Nano Banana Pro', reason: '<10s, 4K, perfect text' },
              { need: '📝 Text in Images', rec: 'Flux 2 Pro', reason: 'Best text rendering' },
              { need: '🧪 Complex Narratives', rec: 'Sora 2', reason: 'World knowledge, 20s duration' },
            ].map(item => (
              <div key={item.need} className="flex items-start gap-2 p-2 rounded bg-muted/40 border text-xs">
                <span className="font-medium whitespace-nowrap">{item.need}</span>
                <span className="text-muted-foreground">→</span>
                <div>
                  <span className="font-semibold">{item.rec}</span>
                  <p className="text-muted-foreground">{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
