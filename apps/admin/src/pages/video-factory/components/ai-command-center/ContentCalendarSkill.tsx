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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Copy, Loader2 } from 'lucide-react';
import type { ContentCalendarResponse } from '@/services/video-factory.service';

export interface ContentCalendarSkillProps {
  calNiche: string;
  setCalNiche: (v: string) => void;
  calDays: number;
  setCalDays: (v: number) => void;
  calPostsPerDay: number;
  setCalPostsPerDay: (v: number) => void;
  calPlatforms: string[];
  setCalPlatforms: (v: string[] | ((prev: string[]) => string[])) => void;
  calResult: ContentCalendarResponse | null;
  loading: boolean;
  onGenerate: () => void;
  copyToClipboard: (text: string) => void;
}

export const ContentCalendarSkill = ({
  calNiche, setCalNiche,
  calDays, setCalDays,
  calPostsPerDay, setCalPostsPerDay,
  calPlatforms, setCalPlatforms,
  calResult,
  loading,
  onGenerate,
  copyToClipboard,
}: ContentCalendarSkillProps) => {
  return (
    <div className="space-y-4">
      <Card className="border-blue-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">📅 Content Calendar Generator</CardTitle>
          <CardDescription>AI generates a complete posting schedule with prompts, times, and models</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2 space-y-1">
              <Label className="text-xs">Niche *</Label>
              <Input placeholder="e.g. AI Technology, Fitness, Cooking..." value={calNiche} onChange={e => setCalNiche(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Days</Label>
              <Select value={String(calDays)} onValueChange={v => setCalDays(parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Posts/Day</Label>
              <Input type="number" min={1} max={10} value={calPostsPerDay} onChange={e => setCalPostsPerDay(parseInt(e.target.value) || 3)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {['tiktok', 'youtube', 'instagram', 'twitter'].map(p => (
              <Button
                key={p} size="sm" variant={calPlatforms.includes(p) ? 'default' : 'outline'} className="text-xs gap-1"
                onClick={() => setCalPlatforms((prev: string[]) => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
              >
                {p === 'tiktok' ? '🎵' : p === 'youtube' ? '📺' : p === 'instagram' ? '📸' : '🐦'} {p}
              </Button>
            ))}
          </div>
          <Button className="w-full gap-2" disabled={loading || !calNiche.trim()} onClick={onGenerate}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating Calendar...</> : <><Calendar className="h-4 w-4" /> Generate {calDays}-Day Calendar</>}
          </Button>
        </CardContent>
      </Card>

      {calResult && (
        <div className="space-y-4">
          <Card className="border-dashed">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{calResult.calendar_name}</p>
                  <p className="text-sm text-muted-foreground">{calResult.period} • {calResult.total_pieces} total pieces</p>
                </div>
                {calResult.content_mix && (
                  <div className="flex gap-1.5">
                    {Object.entries(calResult.content_mix).map(([type, pct]) => (
                      <Badge key={type} variant="outline" className="text-[10px]">{type}: {pct}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {calResult.days?.map((day) => (
                <Card key={day.day} className="border-blue-500/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{day.date_label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {day.posts?.map((post, pIdx) => (
                        <div key={pIdx} className="flex items-start gap-3 p-2 rounded bg-muted/30 border text-xs">
                          <Badge variant="outline" className="text-[10px] min-w-[50px] justify-center shrink-0">{post.time_utc}</Badge>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{post.title}</span>
                              <Badge variant="secondary" className="text-[10px]">{post.content_type}</Badge>
                              <Badge variant="outline" className="text-[10px]">
                                {post.platform === 'tiktok' ? '🎵' : post.platform === 'youtube' ? '📺' : '📸'} {post.platform}
                              </Badge>
                              {post.is_pillar && <Badge className="text-[10px] bg-yellow-600">⭐ Pillar</Badge>}
                            </div>
                            <p className="text-muted-foreground line-clamp-1 mt-1">{post.prompt}</p>
                          </div>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => copyToClipboard(post.prompt)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
