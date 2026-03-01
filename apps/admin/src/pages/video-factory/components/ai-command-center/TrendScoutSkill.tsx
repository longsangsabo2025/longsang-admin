import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy, Loader2, Target } from 'lucide-react';
import type { TrendScoutResponse } from '@/services/video-factory.service';

export interface TrendScoutSkillProps {
  tsNiche: string;
  setTsNiche: (v: string) => void;
  tsPlatform: string;
  setTsPlatform: (v: string) => void;
  tsCount: number;
  setTsCount: (v: number) => void;
  tsResult: TrendScoutResponse | null;
  loading: boolean;
  onGenerate: () => void;
  copyToClipboard: (text: string) => void;
}

export const TrendScoutSkill = ({
  tsNiche, setTsNiche,
  tsPlatform, setTsPlatform,
  tsCount, setTsCount,
  tsResult,
  loading,
  onGenerate,
  copyToClipboard,
}: TrendScoutSkillProps) => {
  return (
    <div className="space-y-4">
      <Card className="border-orange-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">🎯 Trend Scout</CardTitle>
          <CardDescription>Discover trending topics, viral patterns, and content opportunities in your niche</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Niche *</Label>
              <Input placeholder="e.g. AI Technology..." value={tsNiche} onChange={e => setTsNiche(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Platform Focus</Label>
              <Select value={tsPlatform} onValueChange={setTsPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🌐 All Platforms</SelectItem>
                  <SelectItem value="tiktok">🎵 TikTok</SelectItem>
                  <SelectItem value="youtube">📺 YouTube</SelectItem>
                  <SelectItem value="instagram">📸 Instagram</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Trends #</Label>
              <Input type="number" min={1} max={10} value={tsCount} onChange={e => setTsCount(parseInt(e.target.value) || 5)} />
            </div>
          </div>
          <Button className="w-full gap-2" disabled={loading || !tsNiche.trim()} onClick={onGenerate}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Scouting Trends...</> : <><Target className="h-4 w-4" /> Scout Trends</>}
          </Button>
        </CardContent>
      </Card>

      {tsResult && (
        <div className="space-y-4">
          {tsResult.trend_score != null && (
            <Card className="border-dashed">
              <CardContent className="pt-4 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium">Niche Trend Score</p>
                  <Badge className={`${tsResult.trend_score >= 70 ? 'bg-green-600' : 'bg-orange-500'}`}>
                    {tsResult.trend_score}/100
                  </Badge>
                </div>
                {tsResult.recommended_priority?.length > 0 && (
                  <p className="text-xs text-muted-foreground">Priority: {tsResult.recommended_priority.join(' → ')}</p>
                )}
              </CardContent>
            </Card>
          )}

          {tsResult.trends?.map((trend, idx) => (
            <Card key={idx} className="border-orange-500/10">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-lg">
                      {trend.category === 'evergreen' ? '🌲' : trend.category === 'seasonal' ? '🎄' : trend.category === 'emerging' ? '🚀' : trend.category === 'niche_specific' ? '🔬' : '🔗'}
                    </span>
                    {trend.trend_name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{trend.category}</Badge>
                    <Badge variant="outline" className="text-[10px]">{trend.difficulty}</Badge>
                    <Badge className={`text-xs ${trend.virality_score >= 8 ? 'bg-red-600' : 'bg-orange-500'}`}>
                      🔥 {trend.virality_score}/10
                    </Badge>
                  </div>
                </div>
                <CardDescription>{trend.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs"><strong>Why trending:</strong> {trend.why_trending}</p>
                <p className="text-xs"><strong>Timing:</strong> {trend.timing}</p>
                {trend.best_platforms?.length > 0 && (
                  <div className="flex gap-1">
                    {trend.best_platforms.map(p => <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>)}
                  </div>
                )}

                {trend.content_ideas?.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs font-semibold">Content Ideas:</p>
                    {trend.content_ideas.map((idea, iIdx) => (
                      <div key={iIdx} className="flex items-start gap-2 p-2 rounded bg-muted/30 border text-xs">
                        <div className="flex-1">
                          <span className="font-medium">{idea.title}</span>
                          {idea.hook && <span className="text-muted-foreground ml-2">— {idea.hook}</span>}
                          <p className="text-muted-foreground line-clamp-1 mt-0.5">{idea.prompt}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0">{idea.estimated_views}</Badge>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => copyToClipboard(idea.prompt)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {tsResult.avoid?.length > 0 && (
            <Card className="border-destructive/30">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs font-semibold text-destructive mb-2">⚠️ Avoid</p>
                {tsResult.avoid.map((a, i) => <p key={i} className="text-xs text-muted-foreground">• {a}</p>)}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
