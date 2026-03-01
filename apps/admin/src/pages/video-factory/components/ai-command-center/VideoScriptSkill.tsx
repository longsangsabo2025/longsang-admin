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
import { Copy, FileText, Loader2 } from 'lucide-react';
import type { VideoScriptResponse } from '@/services/video-factory.service';

export interface VideoScriptSkillProps {
  scTopic: string;
  setScTopic: (v: string) => void;
  scDuration: string;
  setScDuration: (v: string) => void;
  scStyle: string;
  setScStyle: (v: string) => void;
  scNiche: string;
  setScNiche: (v: string) => void;
  scPlatform: string;
  setScPlatform: (v: string) => void;
  scResult: VideoScriptResponse | null;
  loading: boolean;
  onGenerate: () => void;
  copyToClipboard: (text: string) => void;
}

export const VideoScriptSkill = ({
  scTopic, setScTopic,
  scDuration, setScDuration,
  scStyle, setScStyle,
  scNiche, setScNiche,
  scPlatform, setScPlatform,
  scResult,
  loading,
  onGenerate,
  copyToClipboard,
}: VideoScriptSkillProps) => {
  return (
    <div className="space-y-4">
      <Card className="border-purple-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">✍️ Video Script Writer</CardTitle>
          <CardDescription>Complete scripts with voiceover text, scene-by-scene AI prompts, and SEO metadata</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Topic *</Label>
              <Input placeholder="e.g. How AI is changing filmmaking..." value={scTopic} onChange={e => setScTopic(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Niche (optional)</Label>
              <Input placeholder="e.g. Technology..." value={scNiche} onChange={e => setScNiche(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Duration</Label>
              <Select value={scDuration} onValueChange={setScDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15s">15 seconds</SelectItem>
                  <SelectItem value="30s">30 seconds</SelectItem>
                  <SelectItem value="60s">60 seconds</SelectItem>
                  <SelectItem value="2min">2 minutes</SelectItem>
                  <SelectItem value="5min">5 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Style</Label>
              <Select value={scStyle} onValueChange={setScStyle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="narration">🎙️ Narration</SelectItem>
                  <SelectItem value="tutorial">📚 Tutorial</SelectItem>
                  <SelectItem value="storytelling">📖 Storytelling</SelectItem>
                  <SelectItem value="documentary">🎬 Documentary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Platform</Label>
              <Select value={scPlatform} onValueChange={setScPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">📺 YouTube</SelectItem>
                  <SelectItem value="tiktok">🎵 TikTok</SelectItem>
                  <SelectItem value="instagram">📸 Instagram</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full gap-2" disabled={loading || !scTopic.trim()} onClick={onGenerate}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Writing Script...</> : <><FileText className="h-4 w-4" /> Generate Video Script</>}
          </Button>
        </CardContent>
      </Card>

      {scResult && (
        <div className="space-y-4">
          <Card className="border-purple-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{scResult.title}</CardTitle>
              <CardDescription>{scResult.total_duration} • {scResult.style} • {scResult.scenes?.length || 0} scenes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Full Voiceover */}
              {scResult.voiceover_full_text && (
                <div className="rounded-md bg-purple-500/5 border border-purple-500/20 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-purple-600">🎙️ Full Voiceover Text</p>
                    <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={() => copyToClipboard(scResult.voiceover_full_text)}>
                      <Copy className="h-3 w-3" /> Copy All
                    </Button>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-line">{scResult.voiceover_full_text}</p>
                </div>
              )}

              {/* Scenes */}
              {scResult.scenes?.map((scene) => (
                <div key={scene.scene_number} className="rounded-md bg-muted/40 p-3 space-y-1 border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">Scene {scene.scene_number}</Badge>
                      <Badge variant="outline" className="text-[10px]">{scene.timestamp}</Badge>
                      {scene.transition && <Badge variant="outline" className="text-[10px]">{scene.transition}</Badge>}
                    </div>
                    <Badge variant="outline" className="text-[10px]">{scene.model}</Badge>
                  </div>
                  <p className="text-sm"><strong>Narration:</strong> {scene.narration}</p>
                  <p className="text-xs text-muted-foreground"><strong>Visual:</strong> {scene.visual_description}</p>
                  {scene.text_overlay && <p className="text-xs"><strong>Text overlay:</strong> {scene.text_overlay}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground line-clamp-1 flex-1"><strong>AI Prompt:</strong> {scene.ai_prompt}</p>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => copyToClipboard(scene.ai_prompt)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                {scResult.music_suggestion && (
                  <div className="text-xs"><strong>🎵 Music:</strong> {scResult.music_suggestion}</div>
                )}
                {scResult.thumbnail_prompt && (
                  <div className="flex items-center gap-2 text-xs">
                    <strong>🖼️ Thumbnail Prompt:</strong>
                    <span className="line-clamp-1 flex-1">{scResult.thumbnail_prompt}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => copyToClipboard(scResult.thumbnail_prompt)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              {scResult.seo && (
                <div className="rounded-md bg-muted/30 p-3 text-xs space-y-1">
                  <p><strong>SEO Title:</strong> {scResult.seo.title}</p>
                  <p className="text-muted-foreground line-clamp-2">{scResult.seo.description}</p>
                  {scResult.seo.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {scResult.seo.tags.map((t, i) => <Badge key={i} variant="outline" className="text-[10px]">{t}</Badge>)}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
