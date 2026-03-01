/**
 * Model Compare View — Model selector + side-by-side comparison table
 */

import {
  CheckCircle2,
  Eye,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MODEL_INTELLIGENCE, TIER_CONFIG } from '../../shared-data';
import type { ModelCompareViewProps } from './types';

export const ModelCompareView = ({
  compareModels,
  setCompareModels,
  allModelIds,
  modelPerf,
}: ModelCompareViewProps) => {
  return (
    <div className="space-y-4">
      {/* Model Selector */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4" /> Select Models to Compare (2-4)
          </CardTitle>
          <CardDescription>Pick models for side-by-side comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {allModelIds.map(id => {
              const meta = MODEL_INTELLIGENCE[id];
              const isSelected = compareModels.includes(id);
              return (
                <Button
                  key={id}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    if (isSelected) {
                      setCompareModels(prev => prev.filter(m => m !== id));
                    } else if (compareModels.length < 4) {
                      setCompareModels(prev => [...prev, id]);
                    }
                  }}
                >
                  {isSelected && <CheckCircle2 className="h-3 w-3" />}
                  {meta.name}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      {compareModels.length >= 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Side-by-Side Comparison</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Attribute</TableHead>
                  {compareModels.map(id => (
                    <TableHead key={id} className="text-center min-w-[160px]">
                      <div className="font-semibold">{MODEL_INTELLIGENCE[id]?.name}</div>
                      <Badge variant="outline" className={`text-[10px] mt-1 ${TIER_CONFIG[MODEL_INTELLIGENCE[id]?.tier || 'experimental'].color}`}>
                        {TIER_CONFIG[MODEL_INTELLIGENCE[id]?.tier || 'experimental'].icon} {TIER_CONFIG[MODEL_INTELLIGENCE[id]?.tier || 'experimental'].label}
                      </Badge>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Type */}
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">Type</TableCell>
                  {compareModels.map(id => (
                    <TableCell key={id} className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        {MODEL_INTELLIGENCE[id]?.type === 'video' ? '🎬' : '🖼️'} {MODEL_INTELLIGENCE[id]?.type}
                      </Badge>
                    </TableCell>
                  ))}
                </TableRow>
                {/* Provider */}
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">Provider</TableCell>
                  {compareModels.map(id => (
                    <TableCell key={id} className="text-center text-sm">{MODEL_INTELLIGENCE[id]?.provider}</TableCell>
                  ))}
                </TableRow>
                {/* Max Resolution */}
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">Max Resolution</TableCell>
                  {compareModels.map(id => (
                    <TableCell key={id} className="text-center font-mono text-sm">{MODEL_INTELLIGENCE[id]?.maxResolution}</TableCell>
                  ))}
                </TableRow>
                {/* Max Duration */}
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">Max Duration</TableCell>
                  {compareModels.map(id => (
                    <TableCell key={id} className="text-center font-mono text-sm">{MODEL_INTELLIGENCE[id]?.maxDuration || '—'}</TableCell>
                  ))}
                </TableRow>
                {/* Speed */}
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">Speed</TableCell>
                  {compareModels.map(id => {
                    const s = MODEL_INTELLIGENCE[id]?.speed || 0;
                    return (
                      <TableCell key={id}>
                        <div className="flex items-center gap-2 justify-center">
                          <Progress value={s * 10} className="w-16 h-2" />
                          <span className="font-mono text-xs">{s}/10</span>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
                {/* Quality */}
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">Quality</TableCell>
                  {compareModels.map(id => {
                    const q = MODEL_INTELLIGENCE[id]?.quality || 0;
                    return (
                      <TableCell key={id}>
                        <div className="flex items-center gap-2 justify-center">
                          <Progress value={q * 10} className="w-16 h-2" />
                          <span className="font-mono text-xs">{q}/10</span>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
                {/* Creativity */}
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">Creativity</TableCell>
                  {compareModels.map(id => {
                    const c = MODEL_INTELLIGENCE[id]?.creativity || 0;
                    return (
                      <TableCell key={id}>
                        <div className="flex items-center gap-2 justify-center">
                          <Progress value={c * 10} className="w-16 h-2" />
                          <span className="font-mono text-xs">{c}/10</span>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
                {/* Cost */}
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">Cost</TableCell>
                  {compareModels.map(id => (
                    <TableCell key={id} className="text-center">
                      <Badge variant={MODEL_INTELLIGENCE[id]?.costType === 'unlimited' ? 'default' : 'secondary'} className="text-xs">
                        {MODEL_INTELLIGENCE[id]?.costType === 'unlimited' ? '♾️ Unlimited' : MODEL_INTELLIGENCE[id]?.costType === 'credits' ? '💎 Credits' : MODEL_INTELLIGENCE[id]?.costType}
                      </Badge>
                    </TableCell>
                  ))}
                </TableRow>
                {/* Production Stats */}
                <TableRow className="bg-muted/30">
                  <TableCell className="font-bold">Production Stats</TableCell>
                  {compareModels.map(id => (
                    <TableCell key={id} className="text-center text-xs text-muted-foreground">Live Data ↓</TableCell>
                  ))}
                </TableRow>
                {/* Total Jobs */}
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">Total Jobs</TableCell>
                  {compareModels.map(id => {
                    const perf = modelPerf.find(p => p.model === id);
                    return <TableCell key={id} className="text-center font-mono">{perf?.totalJobs || 0}</TableCell>;
                  })}
                </TableRow>
                {/* Success Rate */}
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">Success Rate</TableCell>
                  {compareModels.map(id => {
                    const perf = modelPerf.find(p => p.model === id);
                    const rate = perf?.successRate || 0;
                    return (
                      <TableCell key={id} className="text-center">
                        <Badge variant={rate >= 90 ? 'default' : rate >= 70 ? 'secondary' : 'destructive'} className="font-mono">
                          {rate}%
                        </Badge>
                      </TableCell>
                    );
                  })}
                </TableRow>
                {/* Avg Gen Time */}
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">Avg Gen Time</TableCell>
                  {compareModels.map(id => {
                    const perf = modelPerf.find(p => p.model === id);
                    return <TableCell key={id} className="text-center font-mono text-sm">{perf?.avgGenTime || '—'}s</TableCell>;
                  })}
                </TableRow>
                {/* Features */}
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">Features</TableCell>
                  {compareModels.map(id => (
                    <TableCell key={id}>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {MODEL_INTELLIGENCE[id]?.features.slice(0, 4).map((f, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">{f}</Badge>
                        ))}
                        {(MODEL_INTELLIGENCE[id]?.features.length || 0) > 4 && (
                          <Badge variant="outline" className="text-[10px]">+{MODEL_INTELLIGENCE[id].features.length - 4}</Badge>
                        )}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
                {/* Best For */}
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">Best For</TableCell>
                  {compareModels.map(id => (
                    <TableCell key={id} className="text-xs text-center text-muted-foreground">{MODEL_INTELLIGENCE[id]?.bestFor}</TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {compareModels.length < 2 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Eye className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-sm">Select at least 2 models to compare</p>
        </div>
      )}
    </div>
  );
};
