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
import { Textarea } from '@/components/ui/textarea';
import { Copy, Loader2, RefreshCw } from 'lucide-react';
import type { RepurposeResponse } from '@/services/video-factory.service';

export interface ContentRepurposeSkillProps {
  rpPrompt: string;
  setRpPrompt: (v: string) => void;
  rpSource: string;
  setRpSource: (v: string) => void;
  rpNiche: string;
  setRpNiche: (v: string) => void;
  rpResult: RepurposeResponse | null;
  loading: boolean;
  onGenerate: () => void;
  copyToClipboard: (text: string) => void;
}

export const ContentRepurposeSkill = ({
  rpPrompt, setRpPrompt,
  rpSource, setRpSource,
  rpNiche, setRpNiche,
  rpResult,
  loading,
  onGenerate,
  copyToClipboard,
}: ContentRepurposeSkillProps) => {
  return (
    <div className="space-y-4">
      <Card className="border-green-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">🔄 Content Repurpose</CardTitle>
          <CardDescription>Take 1 content idea → auto-adapt for 6 platforms with optimized prompts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Original Prompt / Content Idea *</Label>
            <Textarea
              placeholder="Paste your prompt or describe your content idea..."
              value={rpPrompt} onChange={e => setRpPrompt(e.target.value)} className="min-h-[80px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Source Platform</Label>
              <Select value={rpSource} onValueChange={setRpSource}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiktok">🎵 TikTok</SelectItem>
                  <SelectItem value="youtube">📺 YouTube</SelectItem>
                  <SelectItem value="instagram">📸 Instagram</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Niche (optional)</Label>
              <Input placeholder="e.g. AI Tech..." value={rpNiche} onChange={e => setRpNiche(e.target.value)} />
            </div>
          </div>
          <Button className="w-full gap-2" disabled={loading || !rpPrompt.trim()} onClick={onGenerate}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Repurposing...</> : <><RefreshCw className="h-4 w-4" /> Repurpose to All Platforms</>}
          </Button>
        </CardContent>
      </Card>

      {rpResult && (
        <div className="space-y-3">
          <Card className="border-dashed">
            <CardContent className="pt-4 pb-3 flex items-center justify-between">
              <p className="text-sm"><strong>Reach Multiplier:</strong> {rpResult.total_reach_multiplier}</p>
              {rpResult.tip && <p className="text-xs text-muted-foreground">💡 {rpResult.tip}</p>}
            </CardContent>
          </Card>
          {rpResult.variations?.map((v, idx) => (
            <Card key={idx} className="border-green-500/10">
              <CardContent className="pt-4 pb-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="text-xs">
                      {v.platform === 'tiktok' ? '🎵' : v.platform === 'youtube_shorts' ? '📺' : v.platform === 'youtube_long' ? '🎬' : v.platform === 'instagram_reels' ? '📸' : v.platform === 'instagram_post' ? '🖼️' : '🐦'} {v.platform}
                    </Badge>
                    <span className="font-medium text-sm">{v.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px]">{v.aspect_ratio}</Badge>
                    <Badge variant="outline" className="text-[10px]">{v.media_type}</Badge>
                    {v.duration && <Badge variant="outline" className="text-[10px]">{v.duration}</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground flex-1 line-clamp-2">{v.prompt}</p>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => copyToClipboard(v.prompt)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                {v.caption && <p className="text-xs text-muted-foreground italic">{v.caption}</p>}
                {v.adaptation_notes && <p className="text-[10px] text-muted-foreground">📝 {v.adaptation_notes}</p>}
                {v.hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {v.hashtags.map((h, i) => <Badge key={i} variant="outline" className="text-[10px]">{h}</Badge>)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
