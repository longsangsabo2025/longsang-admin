import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Hash, Loader2 } from 'lucide-react';
import type { SEOMetadataResponse } from '@/services/video-factory.service';

export interface SEOMetadataSkillProps {
  seoDesc: string;
  setSeoDesc: (v: string) => void;
  seoNiche: string;
  setSeoNiche: (v: string) => void;
  seoPlatforms: string[];
  setSeoPlatforms: (v: string[] | ((prev: string[]) => string[])) => void;
  seoPrompt: string;
  setSeoPrompt: (v: string) => void;
  seoResult: SEOMetadataResponse | null;
  loading: boolean;
  onGenerate: () => void;
  copyToClipboard: (text: string) => void;
}

export const SEOMetadataSkill = ({
  seoDesc, setSeoDesc,
  seoNiche, setSeoNiche,
  seoPlatforms, setSeoPlatforms,
  seoPrompt, setSeoPrompt,
  seoResult,
  loading,
  onGenerate,
  copyToClipboard,
}: SEOMetadataSkillProps) => {
  return (
    <div className="space-y-4">
      <Card className="border-cyan-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">🏷️ SEO & Caption Generator</CardTitle>
          <CardDescription>Generate optimized titles, descriptions, hashtags, and captions for any content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Content Description *</Label>
              <Textarea placeholder="Describe your video/image content..." value={seoDesc} onChange={e => setSeoDesc(e.target.value)} className="min-h-[60px]" />
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Niche *</Label>
                <Input placeholder="e.g. AI Technology..." value={seoNiche} onChange={e => setSeoNiche(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Existing Prompt (optional)</Label>
                <Input placeholder="The AI prompt used to generate..." value={seoPrompt} onChange={e => setSeoPrompt(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {['tiktok', 'youtube', 'instagram', 'twitter'].map(p => (
              <Button
                key={p} size="sm" variant={seoPlatforms.includes(p) ? 'default' : 'outline'} className="text-xs gap-1"
                onClick={() => setSeoPlatforms((prev: string[]) => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
              >
                {p === 'tiktok' ? '🎵' : p === 'youtube' ? '📺' : p === 'instagram' ? '📸' : '🐦'} {p}
              </Button>
            ))}
          </div>
          <Button className="w-full gap-2" disabled={loading || !seoDesc.trim() || !seoNiche.trim()} onClick={onGenerate}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating SEO...</> : <><Hash className="h-4 w-4" /> Generate SEO & Captions</>}
          </Button>
        </CardContent>
      </Card>

      {seoResult && (
        <div className="space-y-3">
          {/* Score */}
          <Card className="border-dashed">
            <CardContent className="pt-4 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">SEO Score</p>
                <Badge className={`${(seoResult.seo_score || 0) >= 80 ? 'bg-green-600' : 'bg-orange-500'}`}>
                  {seoResult.seo_score}/100
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Titles */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">📝 Title Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {seoResult.titles?.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30 border">
                  <div>
                    <p className="text-sm font-medium">{t.text}</p>
                    <Badge variant="outline" className="text-[10px] mt-1">{t.style}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(t.text)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Descriptions */}
          {seoResult.descriptions && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">📄 Descriptions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(seoResult.descriptions).map(([platform, desc]) => (
                  <div key={platform} className="p-2 rounded bg-muted/30 border">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-[10px]">{platform}</Badge>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(desc)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Hashtags */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm"># Hashtags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {seoResult.hashtags?.primary && (
                <div>
                  <Label className="text-xs text-muted-foreground">Primary</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {seoResult.hashtags.primary.map((h, i) => <Badge key={i} className="text-[10px]">{h}</Badge>)}
                  </div>
                </div>
              )}
              {seoResult.hashtags?.trending && (
                <div>
                  <Label className="text-xs text-muted-foreground">Trending</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {seoResult.hashtags.trending.map((h, i) => <Badge key={i} variant="destructive" className="text-[10px]">{h}</Badge>)}
                  </div>
                </div>
              )}
              {seoResult.hashtags?.per_platform && Object.entries(seoResult.hashtags.per_platform).map(([platform, tags]) => (
                <div key={platform}>
                  <Label className="text-xs text-muted-foreground">{platform}</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tags.map((h: string, i: number) => <Badge key={i} variant="outline" className="text-[10px]">{h}</Badge>)}
                    <Button variant="ghost" size="sm" className="h-5 text-[10px] gap-1" onClick={() => copyToClipboard(tags.join(' '))}>
                      <Copy className="h-3 w-3" /> Copy all
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Hooks + CTAs */}
          <div className="grid md:grid-cols-2 gap-3">
            {seoResult.hooks?.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">🪝 Hook Options</CardTitle></CardHeader>
                <CardContent className="space-y-1">
                  {seoResult.hooks.map((h, i) => (
                    <div key={i} className="flex items-center justify-between p-1.5 text-xs rounded bg-muted/30">
                      <span>{h}</span>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => copyToClipboard(h)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {seoResult.cta_options?.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">📣 CTA Options</CardTitle></CardHeader>
                <CardContent className="space-y-1">
                  {seoResult.cta_options.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-1.5 text-xs rounded bg-muted/30">
                      <span>{c}</span>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => copyToClipboard(c)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {seoResult.tips?.length > 0 && (
            <Card className="border-dashed">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs font-semibold mb-2">💡 Optimization Tips</p>
                {seoResult.tips.map((t, i) => <p key={i} className="text-xs text-muted-foreground">• {t}</p>)}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
