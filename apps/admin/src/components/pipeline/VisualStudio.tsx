import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload, Palette, Film, Wand2,
  Check, Loader2, Layers, LayoutTemplate, Star, StarOff,
} from 'lucide-react';

interface VideoConfig {
  width: number; height: number; fps: number;
  channel_name: string;
  bg_color: string; text_color: string; accent_color: string;
  subtitle_font_size: number; subtitle_margin_bottom: number;
  crf: number; comfyui_timeout: number;
  image_source: 'comfyui' | 'dalle' | 'gradient';
}

interface Props {
  videoConfig: VideoConfig;
  setVideoConfig: React.Dispatch<React.SetStateAction<VideoConfig>>;
}

export interface TemplateConfig {
  bg_color: string;
  text_color: string;
  accent_color: string;
  subtitle_font_size: number;
}

export interface Template {
  id: string;
  name: string;
  desc: string;
  category: 'podcast' | 'general' | 'custom';
  preview: string;
  config: TemplateConfig;
}

const DEFAULT_TEMPLATE_KEY = 'pipeline_default_template';

export const TEMPLATES: Template[] = [
  // ── PODCAST TEMPLATES (chuyên cho video podcast) ──
  {
    id: 'podcast-dark-gold',
    name: 'Podcast Classic',
    desc: 'Tối + vàng gold — chuẩn podcast motivational',
    category: 'podcast',
    preview: 'linear-gradient(135deg, #0a0a0f 0%, #1a1020 50%, #0a0a0f 100%)',
    config: { bg_color: '#0a0a0f', text_color: '#e8e8e8', accent_color: '#c0c0c0', subtitle_font_size: 44 },
  },
  {
    id: 'podcast-deep-blue',
    name: 'Deep Focus',
    desc: 'Xanh đậm — tri thức, chiều sâu, suy ngẫm',
    category: 'podcast',
    preview: 'linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a1628 100%)',
    config: { bg_color: '#0a1628', text_color: '#e0f0ff', accent_color: '#4fc3f7', subtitle_font_size: 42 },
  },
  {
    id: 'podcast-fire',
    name: 'Fire Talk',
    desc: 'Đỏ cam — năng lượng, hành động, khởi nghiệp',
    category: 'podcast',
    preview: 'linear-gradient(135deg, #1a0500 0%, #2d0a00 50%, #1a0500 100%)',
    config: { bg_color: '#1a0500', text_color: '#ff6d00', accent_color: '#ffab40', subtitle_font_size: 46 },
  },
  {
    id: 'podcast-emerald',
    name: 'Growth Mind',
    desc: 'Xanh lá — sức khỏe, phát triển bản thân',
    category: 'podcast',
    preview: 'linear-gradient(135deg, #0a1a0a 0%, #0d2d0d 50%, #0a1a0a 100%)',
    config: { bg_color: '#0a1a0a', text_color: '#69f0ae', accent_color: '#b9f6ca', subtitle_font_size: 42 },
  },
  {
    id: 'podcast-midnight',
    name: 'Midnight Story',
    desc: 'Tím đêm — storytelling, bí ẩn, tâm lý',
    category: 'podcast',
    preview: 'linear-gradient(135deg, #0d0221 0%, #1a0533 50%, #0d0221 100%)',
    config: { bg_color: '#0d0221', text_color: '#ce93d8', accent_color: '#e1bee7', subtitle_font_size: 44 },
  },
  {
    id: 'podcast-minimal',
    name: 'Minimal Pro',
    desc: 'Trắng tối giản — business, chuyên nghiệp',
    category: 'podcast',
    preview: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
    config: { bg_color: '#f5f5f5', text_color: '#1a1a1a', accent_color: '#666666', subtitle_font_size: 40 },
  },
  // ── GENERAL TEMPLATES ──
  {
    id: 'neon-cyber',
    name: 'Neon Cyber',
    desc: 'Tím neon, cyberpunk, tech',
    category: 'general',
    preview: 'linear-gradient(135deg, #0d0221 0%, #1a0533 50%, #2d0a4e 100%)',
    config: { bg_color: '#0d0221', text_color: '#00ffff', accent_color: '#ff00ff', subtitle_font_size: 46 },
  },
  {
    id: 'warm-motivation',
    name: 'Warm Motivation',
    desc: 'Cam ấm, truyền cảm hứng',
    category: 'general',
    preview: 'linear-gradient(135deg, #1a0a00 0%, #2d1a0a 50%, #3d2a1a 100%)',
    config: { bg_color: '#1a0a00', text_color: '#ff8c00', accent_color: '#ffd700', subtitle_font_size: 44 },
  },
  {
    id: 'blood-red',
    name: 'Blood Red',
    desc: 'Đỏ mạnh, drama, shocking',
    category: 'general',
    preview: 'linear-gradient(135deg, #1a0000 0%, #330000 50%, #1a0000 100%)',
    config: { bg_color: '#1a0000', text_color: '#ff1744', accent_color: '#ff8a80', subtitle_font_size: 48 },
  },
];

const BG_PROMPTS = [
  { label: 'Cavern Mystery', prompt: 'A vast dimly lit cavern with a single figure silhouetted, gazing into a glowing abyss. Bioluminescent particles, cinematic lighting, dark moody atmosphere' },
  { label: 'City Night', prompt: 'Aerial view of a futuristic city at night with neon lights and rain, cyberpunk atmosphere, dark blue and purple tones, cinematic' },
  { label: 'Mountain Dawn', prompt: 'Person standing on mountain peak at golden hour, dramatic clouds below, warm orange and gold tones, inspirational, cinematic wide shot' },
  { label: 'Abstract Dark', prompt: 'Abstract dark background with flowing gold particles and light trails, deep navy blue, minimalist, elegant, perfect for podcast overlay' },
  { label: 'Library Wisdom', prompt: 'Grand ancient library with towering bookshelves, warm candlelight, dust particles in light beams, atmospheric, knowledge and wisdom' },
  { label: 'Space Nebula', prompt: 'Deep space nebula with vibrant purple and blue colors, stars, cosmic dust, dark background, ethereal and vast' },
  { label: 'Studio Mic', prompt: 'Professional podcast studio with a single condenser microphone in dramatic spotlight, dark background, bokeh lights, intimate recording atmosphere' },
  { label: 'Coffee Think', prompt: 'Steam rising from a coffee cup on a desk near a rainy window at night, warm indoor lighting, contemplative mood, cinematic close-up' },
];

export function VisualStudio({ videoConfig, setVideoConfig }: Props) {
  const [studioTab, setStudioTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [defaultTemplate, setDefaultTemplate] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [bgUrl, setBgUrl] = useState('');
  const [bgPrompt, setBgPrompt] = useState(BG_PROMPTS[0].prompt);
  const [generating, setGenerating] = useState(false);
  const [thumbnailText, setThumbnailText] = useState('BÍ MẬT GIẤC NGỦ');
  const [templateFilter, setTemplateFilter] = useState<'all' | 'podcast' | 'general'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(DEFAULT_TEMPLATE_KEY);
    if (saved) {
      setDefaultTemplate(saved);
      const tpl = TEMPLATES.find(t => t.id === saved);
      if (tpl) {
        setSelectedTemplate(saved);
        setVideoConfig(v => ({ ...v, ...tpl.config }));
      }
    }
  }, [setVideoConfig]);

  const applyTemplate = (tpl: Template) => {
    setSelectedTemplate(tpl.id);
    setVideoConfig(v => ({ ...v, ...tpl.config }));
  };

  const toggleDefault = (tplId: string) => {
    if (defaultTemplate === tplId) {
      setDefaultTemplate(null);
      localStorage.removeItem(DEFAULT_TEMPLATE_KEY);
    } else {
      setDefaultTemplate(tplId);
      localStorage.setItem(DEFAULT_TEMPLATE_KEY, tplId);
    }
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setThumbnailUrl(URL.createObjectURL(file));
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setBgUrl(URL.createObjectURL(file));
  };

  const generateImage = async (type: 'thumbnail' | 'background') => {
    setGenerating(true);
    try {
      const prompt = type === 'thumbnail'
        ? `YouTube thumbnail: ${thumbnailText}, bold Vietnamese text overlay, eye-catching, 1280x720, high contrast`
        : bgPrompt;
      const res = await fetch('/api/youtube-crew/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type, width: type === 'thumbnail' ? 1280 : 1920, height: type === 'thumbnail' ? 720 : 1080 }),
      });
      if (res.ok) {
        const data = await res.json();
        if (type === 'thumbnail') setThumbnailUrl(data.url || data.path);
        else setBgUrl(data.url || data.path);
      }
    } catch (e) { console.error('Generate failed:', e); }
    finally { setGenerating(false); }
  };

  const filteredTemplates = TEMPLATES.filter(t =>
    templateFilter === 'all' ? true : t.category === templateFilter
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Palette className="h-5 w-5" /> Visual Studio
        </h2>
        <div className="flex items-center gap-2">
          {defaultTemplate && (
            <Badge variant="secondary" className="gap-1">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              Default: {TEMPLATES.find(t => t.id === defaultTemplate)?.name}
            </Badge>
          )}
          <Badge variant="outline">{videoConfig.width}x{videoConfig.height} @ {videoConfig.fps}fps</Badge>
        </div>
      </div>

      <Tabs value={studioTab} onValueChange={setStudioTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates" className="gap-1"><LayoutTemplate className="h-4 w-4" />Templates</TabsTrigger>
          <TabsTrigger value="thumbnail" className="gap-1"><Wand2 className="h-4 w-4" />Thumbnail</TabsTrigger>
          <TabsTrigger value="background" className="gap-1"><Layers className="h-4 w-4" />Background</TabsTrigger>
          <TabsTrigger value="layout" className="gap-1"><Film className="h-4 w-4" />Layout</TabsTrigger>
        </TabsList>

        {/* ── TEMPLATES ── */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Click = apply. Star = set as default for all new runs.</p>
            <div className="flex border rounded-md overflow-hidden">
              {(['all', 'podcast', 'general'] as const).map(f => (
                <button key={f} className={`px-3 py-1.5 text-xs ${templateFilter === f ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                  onClick={() => setTemplateFilter(f)}>
                  {f === 'all' ? 'All' : f === 'podcast' ? 'Podcast' : 'General'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {filteredTemplates.map(tpl => {
              const isDefault = defaultTemplate === tpl.id;
              const isSelected = selectedTemplate === tpl.id;
              return (
                <Card key={tpl.id}
                  className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 ${isSelected ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => applyTemplate(tpl)}>
                  <div className="h-36 rounded-t-lg relative overflow-hidden" style={{ background: tpl.preview }}>
                    {/* Podcast-style preview with waveform */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      {tpl.category === 'podcast' && (
                        <div className="flex items-end gap-[2px] h-6 mb-2 opacity-60">
                          {Array.from({ length: 20 }).map((_, i) => (
                            <div key={i} className="w-[3px] rounded-full"
                              style={{
                                height: `${8 + Math.sin(i * 0.7) * 14 + Math.random() * 6}px`,
                                background: tpl.config.text_color,
                              }} />
                          ))}
                        </div>
                      )}
                      <p className="text-sm font-bold" style={{ color: tpl.config.text_color }}>
                        {videoConfig.channel_name}
                      </p>
                      <p className="text-[10px] mt-1 px-2 py-0.5 rounded bg-black/30" style={{ color: tpl.config.accent_color }}>
                        "Phụ đề preview ở đây"
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                    <button
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                      onClick={e => { e.stopPropagation(); toggleDefault(tpl.id); }}>
                      {isDefault
                        ? <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        : <StarOff className="h-4 w-4 text-white/60" />}
                    </button>
                    {tpl.category === 'podcast' && (
                      <Badge className="absolute bottom-2 left-2 text-[9px] h-4 bg-blue-600/80">PODCAST</Badge>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{tpl.name}</p>
                      {isDefault && <Badge variant="outline" className="text-[9px] h-4 text-yellow-600 border-yellow-600">DEFAULT</Badge>}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{tpl.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ── THUMBNAIL EDITOR ── */}
        <TabsContent value="thumbnail" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Thumbnail Preview</CardTitle>
                  <CardDescription className="text-xs">1280x720 — ảnh đầu tiên viewer thấy</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video rounded-lg border overflow-hidden relative"
                    style={{ background: thumbnailUrl ? `url(${thumbnailUrl}) center/cover` : videoConfig.bg_color }}>
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                      <p className="text-2xl font-black text-white drop-shadow-lg text-center px-4 leading-tight"
                        style={{ color: videoConfig.text_color, textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>
                        {thumbnailText}
                      </p>
                      <p className="text-xs mt-2 font-bold px-3 py-1 rounded"
                        style={{ background: videoConfig.text_color, color: videoConfig.bg_color }}>
                        {videoConfig.channel_name}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Edit Thumbnail</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Thumbnail Text</Label>
                    <Input className="mt-1" value={thumbnailText}
                      onChange={e => setThumbnailText(e.target.value)}
                      placeholder="BÍ MẬT GIẤC NGỦ" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 gap-1" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4" /> Upload ảnh
                    </Button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} />
                    <Button variant="outline" className="flex-1 gap-1" disabled={generating} onClick={() => generateImage('thumbnail')}>
                      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                      AI Generate
                    </Button>
                  </div>
                  <div>
                    <Label className="text-xs">Hoặc nhập URL ảnh</Label>
                    <Input className="mt-1 text-xs" placeholder="https://..." value={thumbnailUrl}
                      onChange={e => setThumbnailUrl(e.target.value)} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── BACKGROUND EDITOR ── */}
        <TabsContent value="background" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Background Preview</CardTitle>
                  <CardDescription className="text-xs">1920x1080 — nền video chính</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video rounded-lg border overflow-hidden relative"
                    style={{ background: bgUrl ? `url(${bgUrl}) center/cover` : videoConfig.bg_color }}>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-center">
                        <p className="text-lg font-bold" style={{ color: videoConfig.text_color }}>{videoConfig.channel_name}</p>
                        {/* Waveform visualizer */}
                        <div className="flex items-end justify-center gap-[2px] h-8 mt-3 opacity-50">
                          {Array.from({ length: 30 }).map((_, i) => (
                            <div key={i} className="w-[3px] rounded-full transition-all"
                              style={{
                                height: `${6 + Math.sin(i * 0.5) * 18 + Math.random() * 8}px`,
                                background: videoConfig.text_color,
                              }} />
                          ))}
                        </div>
                        <p className="mt-4 text-sm px-8 leading-relaxed"
                          style={{ color: videoConfig.accent_color,
                            fontSize: `${Math.max(10, videoConfig.subtitle_font_size * 0.3)}px` }}>
                          "Phụ đề hiện ở đây với font size {videoConfig.subtitle_font_size}px"
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Background Source</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Image Source</Label>
                    <select className="w-full mt-1 text-sm border rounded-md p-2 bg-background"
                      value={videoConfig.image_source}
                      onChange={e => setVideoConfig(v => ({ ...v, image_source: e.target.value as VideoConfig['image_source'] }))}>
                      <option value="comfyui">ComfyUI FLUX.1 (local, free, best)</option>
                      <option value="dalle">DALL-E 3 ($0.04/image)</option>
                      <option value="gradient">Gradient (free, no AI)</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 gap-1" onClick={() => bgFileRef.current?.click()}>
                      <Upload className="h-4 w-4" /> Upload ảnh nền
                    </Button>
                    <input ref={bgFileRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
                    <Button variant="outline" className="flex-1 gap-1" disabled={generating} onClick={() => generateImage('background')}>
                      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                      AI Generate
                    </Button>
                  </div>
                  <div>
                    <Label className="text-xs">AI Prompt</Label>
                    <Textarea className="mt-1 text-xs min-h-[80px]" value={bgPrompt}
                      onChange={e => setBgPrompt(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Quick Prompts</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {BG_PROMPTS.map(p => (
                        <Button key={p.label} variant="outline" size="sm" className="text-[10px] h-6"
                          onClick={() => setBgPrompt(p.prompt)}>{p.label}</Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Hoặc nhập URL</Label>
                    <Input className="mt-1 text-xs" placeholder="https://..." value={bgUrl}
                      onChange={e => setBgUrl(e.target.value)} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── LAYOUT CONFIG ── */}
        <TabsContent value="layout" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Video Settings</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Width</Label>
                    <Input type="number" className="mt-1 text-sm" value={videoConfig.width}
                      onChange={e => setVideoConfig(v => ({ ...v, width: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Height</Label>
                    <Input type="number" className="mt-1 text-sm" value={videoConfig.height}
                      onChange={e => setVideoConfig(v => ({ ...v, height: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <Label className="text-xs">FPS</Label>
                    <Input type="number" className="mt-1 text-sm" value={videoConfig.fps}
                      onChange={e => setVideoConfig(v => ({ ...v, fps: Number(e.target.value) }))} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Channel Name</Label>
                  <Input className="mt-1 text-sm" value={videoConfig.channel_name}
                    onChange={e => setVideoConfig(v => ({ ...v, channel_name: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Quality (CRF): {videoConfig.crf}</Label>
                  <Slider className="mt-2" min={15} max={30} step={1}
                    value={[videoConfig.crf]} onValueChange={v => setVideoConfig(c => ({ ...c, crf: v[0] }))} />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {videoConfig.crf <= 18 ? 'Very High quality — large file' : videoConfig.crf <= 23 ? 'Good balance — recommended' : 'Compressed — fast upload'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs">ComfyUI Timeout: {videoConfig.comfyui_timeout}s</Label>
                  <Slider className="mt-2" min={10} max={120} step={5}
                    value={[videoConfig.comfyui_timeout]} onValueChange={v => setVideoConfig(c => ({ ...c, comfyui_timeout: v[0] }))} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Colors & Subtitles</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { key: 'bg_color', label: 'Background' },
                    { key: 'text_color', label: 'Text' },
                    { key: 'accent_color', label: 'Accent' },
                  ] as const).map(c => (
                    <div key={c.key}>
                      <Label className="text-xs">{c.label}</Label>
                      <div className="flex gap-1 mt-1">
                        <input type="color" value={videoConfig[c.key]}
                          onChange={e => setVideoConfig(v => ({ ...v, [c.key]: e.target.value }))}
                          className="w-8 h-8 rounded border cursor-pointer" />
                        <Input className="text-[10px] flex-1" value={videoConfig[c.key]}
                          onChange={e => setVideoConfig(v => ({ ...v, [c.key]: e.target.value }))} />
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <Label className="text-xs">Subtitle Size: {videoConfig.subtitle_font_size}px</Label>
                  <Slider className="mt-2" min={24} max={72} step={2}
                    value={[videoConfig.subtitle_font_size]}
                    onValueChange={v => setVideoConfig(c => ({ ...c, subtitle_font_size: v[0] }))} />
                </div>
                <div>
                  <Label className="text-xs">Subtitle Bottom: {videoConfig.subtitle_margin_bottom}px</Label>
                  <Slider className="mt-2" min={20} max={200} step={10}
                    value={[videoConfig.subtitle_margin_bottom]}
                    onValueChange={v => setVideoConfig(c => ({ ...c, subtitle_margin_bottom: v[0] }))} />
                </div>

                <div className="p-4 rounded-lg border relative overflow-hidden" style={{ background: videoConfig.bg_color, minHeight: 120 }}>
                  <p className="text-center text-sm font-bold" style={{ color: videoConfig.text_color }}>
                    {videoConfig.channel_name}
                  </p>
                  <div className="flex items-end justify-center gap-[2px] h-6 mt-2 opacity-40">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} className="w-[2px] rounded-full"
                        style={{ height: `${4 + Math.sin(i * 0.6) * 12}px`, background: videoConfig.text_color }} />
                    ))}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 text-center"
                    style={{ paddingBottom: `${videoConfig.subtitle_margin_bottom * 0.2}px` }}>
                    <span className="px-3 py-1 rounded bg-black/60"
                      style={{ color: '#fff', fontSize: `${Math.max(10, videoConfig.subtitle_font_size * 0.3)}px` }}>
                      Phụ đề ở đây
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
