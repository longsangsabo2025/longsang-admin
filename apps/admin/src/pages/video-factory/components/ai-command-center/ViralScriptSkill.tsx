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
import { Copy, Flame, Loader2 } from 'lucide-react';
import type { ViralScriptsResponse } from '@/services/video-factory.service';

export interface ViralScriptSkillProps {
  vsNiche: string;
  setVsNiche: (v: string) => void;
  vsPlatform: string;
  setVsPlatform: (v: string) => void;
  vsTopic: string;
  setVsTopic: (v: string) => void;
  vsCount: number;
  setVsCount: (v: number) => void;
  vsResult: ViralScriptsResponse | null;
  loading: boolean;
  onGenerate: () => void;
  copyToClipboard: (text: string) => void;
}

export const ViralScriptSkill = ({
  vsNiche, setVsNiche,
  vsPlatform, setVsPlatform,
  vsTopic, setVsTopic,
  vsCount, setVsCount,
  vsResult,
  loading,
  onGenerate,
  copyToClipboard,
}: ViralScriptSkillProps) => {
  return (
    <div className="space-y-4">
      <Card className="border-red-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">🎬 Viral Scriptwriter</CardTitle>
          <CardDescription>Generate complete viral video scripts with hooks, scenes, CTAs, and AI prompts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2 space-y-1">
              <Label className="text-xs">Niche *</Label>
              <Input placeholder="e.g. AI Facts, Motivation, Real Estate..." value={vsNiche} onChange={e => setVsNiche(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Platform</Label>
              <Select value={vsPlatform} onValueChange={setVsPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiktok">🎵 TikTok</SelectItem>
                  <SelectItem value="youtube">📺 YouTube</SelectItem>
                  <SelectItem value="instagram">📸 Instagram</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Scripts #</Label>
              <Input type="number" min={1} max={10} value={vsCount} onChange={e => setVsCount(parseInt(e.target.value) || 3)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Topic (optional — leave empty for AI to decide)</Label>
            <Input placeholder="e.g. Mind-blowing AI predictions for 2026..." value={vsTopic} onChange={e => setVsTopic(e.target.value)} />
          </div>
          <Button className="w-full gap-2" disabled={loading || !vsNiche.trim()} onClick={onGenerate}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating Scripts...</> : <><Flame className="h-4 w-4" /> Generate Viral Scripts</>}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {vsResult && (
        <div className="space-y-4">
          <Card className="border-dashed">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{vsResult.series_name}</p>
                  <p className="text-sm text-muted-foreground">{vsResult.strategy_summary}</p>
                </div>
                <Badge>{vsResult.scripts?.length || 0} scripts</Badge>
              </div>
            </CardContent>
          </Card>

          {vsResult.scripts?.map((script, idx) => (
            <Card key={idx} className="border-red-500/10">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-lg">📹</span> {script.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{script.estimated_duration}</Badge>
                    <Badge className={`text-xs ${(script.viral_score || 0) >= 8 ? 'bg-red-600' : 'bg-orange-500'}`}>
                      🔥 {script.viral_score}/10
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Hook */}
                <div className="rounded-md bg-red-500/5 border border-red-500/20 p-3">
                  <p className="text-xs font-semibold text-red-600 mb-1">🪝 HOOK (0-3s)</p>
                  <p className="text-sm font-medium">{script.hook_text}</p>
                  {script.hook_visual && (
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">Visual Prompt</Badge>
                      <p className="text-xs text-muted-foreground line-clamp-2">{script.hook_visual}</p>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => copyToClipboard(script.hook_visual)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Scenes */}
                {script.scenes?.map((scene, sIdx) => (
                  <div key={sIdx} className="rounded-md bg-muted/40 p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-[10px]">{scene.timestamp}</Badge>
                      {scene.recommended_model && <Badge variant="outline" className="text-[10px]">{scene.recommended_model}</Badge>}
                    </div>
                    <p className="text-sm">{scene.narration}</p>
                    {scene.visual_prompt && (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground line-clamp-1 flex-1">{scene.visual_prompt}</p>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => copyToClipboard(scene.visual_prompt)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                {/* CTA + Caption */}
                <div className="flex items-center justify-between pt-2 border-t text-sm">
                  <span><strong>CTA:</strong> {script.cta}</span>
                  <span className="text-xs text-muted-foreground italic">{script.viral_reason}</span>
                </div>
                {script.caption && (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground flex-1 line-clamp-1">{script.caption}</p>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(script.caption)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {vsResult.posting_tips && vsResult.posting_tips.length > 0 && (
            <Card className="border-dashed">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs font-semibold mb-2">💡 Posting Tips</p>
                <div className="space-y-1">
                  {vsResult.posting_tips.map((tip, i) => (
                    <p key={i} className="text-xs text-muted-foreground">• {tip}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
