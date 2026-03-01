/**
 * A/B Test View — Configuration form + results display
 */

import {
  Activity,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  Rocket,
  Trophy,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import type { VideoModel } from '@/services/video-factory.service';
import { MODEL_INTELLIGENCE } from '../../shared-data';
import type { ABTestViewProps } from './types';

export const ABTestView = ({
  allModelIds,
  abTestPrompt,
  setAbTestPrompt,
  abTestModels,
  setAbTestModels,
  abTestId,
  abTestData,
  abTestMutation,
}: ABTestViewProps) => {
  return (
    <div className="space-y-4">
      {/* Test Configuration */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-500" /> Quick A/B Test
          </CardTitle>
          <CardDescription>Same prompt → multiple models → compare results in real-time</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prompt Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Test Prompt</Label>
            <Textarea
              placeholder="Enter a prompt to test across models... (e.g. 'A cinematic drone shot over a misty mountain at sunrise, golden light streaming through clouds')"
              value={abTestPrompt}
              onChange={(e) => setAbTestPrompt(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Models to Test (2-5)</Label>
            <div className="flex flex-wrap gap-2">
              {allModelIds.filter(id => MODEL_INTELLIGENCE[id]?.type === 'video').map(id => {
                const meta = MODEL_INTELLIGENCE[id];
                const isSelected = abTestModels.includes(id);
                return (
                  <Button
                    key={id}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => {
                      if (isSelected) {
                        setAbTestModels(prev => prev.filter(m => m !== id));
                      } else if (abTestModels.length < 5) {
                        setAbTestModels(prev => [...prev, id]);
                      }
                    }}
                  >
                    {isSelected && <CheckCircle2 className="h-3 w-3" />}
                    {meta.name}
                  </Button>
                );
              })}
            </div>
            <Separator className="my-2" />
            <Label className="text-xs text-muted-foreground">Image Models</Label>
            <div className="flex flex-wrap gap-2">
              {allModelIds.filter(id => MODEL_INTELLIGENCE[id]?.type === 'image').map(id => {
                const meta = MODEL_INTELLIGENCE[id];
                const isSelected = abTestModels.includes(id);
                return (
                  <Button
                    key={id}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => {
                      if (isSelected) {
                        setAbTestModels(prev => prev.filter(m => m !== id));
                      } else if (abTestModels.length < 5) {
                        setAbTestModels(prev => [...prev, id]);
                      }
                    }}
                  >
                    {isSelected && <CheckCircle2 className="h-3 w-3" />}
                    {meta.name}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Launch Button */}
          <Button
            className="w-full gap-2"
            disabled={abTestPrompt.trim().length < 5 || abTestModels.length < 2 || abTestMutation.isPending}
            onClick={() => abTestMutation.mutate({ prompt: abTestPrompt, models: abTestModels as VideoModel[] })}
          >
            {abTestMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Launching Test...</>
            ) : (
              <><Rocket className="h-4 w-4" /> Launch A/B Test ({abTestModels.length} models)</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {abTestId && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" /> Test Results
              <Badge variant="outline" className="text-xs font-mono">{abTestId}</Badge>
              {abTestData?.status === 'in_progress' && (
                <Badge variant="secondary" className="text-xs gap-1 animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" /> Running...
                </Badge>
              )}
              {abTestData?.status === 'completed' && (
                <Badge className="text-xs gap-1 bg-green-600">
                  <CheckCircle2 className="h-3 w-3" /> Completed
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {abTestData?.jobs && abTestData.jobs.length > 0 ? (
              <div className="space-y-3">
                {abTestData.jobs.map((result: any, idx: number) => {
                  const meta = MODEL_INTELLIGENCE[result.model];
                  const isWinner = abTestData.winner?.model === result.model;
                  return (
                    <div
                      key={result.model}
                      className={`flex items-center gap-4 p-3 rounded-lg border ${isWinner ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-border'}`}
                    >
                      <div className="flex items-center gap-2 min-w-[160px]">
                        {isWinner && <Trophy className="h-4 w-4 text-yellow-600" />}
                        <span className="font-medium text-sm">{meta?.name || result.model}</span>
                      </div>
                      <Badge
                        variant={result.status === 'completed' ? 'default' : result.status === 'failed' ? 'destructive' : 'secondary'}
                        className="text-xs min-w-[80px] justify-center"
                      >
                        {result.status === 'completed' ? '✅ Done' : result.status === 'failed' ? '❌ Failed' : result.status === 'processing' ? '⏳ Processing' : '🔄 Queued'}
                      </Badge>
                      {result.generation_time != null && (
                        <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                          <Clock className="h-3 w-3" /> {result.generation_time.toFixed(1)}s
                        </div>
                      )}
                      {result.output_url && (
                        <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
                          <a href={result.output_url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-3 w-3" /> View
                          </a>
                        </Button>
                      )}
                      {isWinner && (
                        <Badge className="bg-yellow-600 text-white text-xs ml-auto">
                          🏆 Winner — Fastest
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm">Waiting for results...</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Active Test Placeholder */}
      {!abTestId && (
        <Card className="border-dashed">
          <CardContent className="pt-6 pb-6 flex flex-col items-center text-center text-muted-foreground">
            <Zap className="h-12 w-12 mb-4 opacity-30" />
            <p className="font-medium">No Active A/B Test</p>
            <p className="text-sm">Configure a prompt and select models above to start a comparison test</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
