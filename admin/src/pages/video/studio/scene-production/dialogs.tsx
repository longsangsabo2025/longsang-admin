/**
 * 🎬 Dialog Components for Scene Production
 * Modular dialogs for various production features
 *
 * @author LongSang (Elon Mode 🚀)
 */

import {
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  ImagePlus,
  Settings2,
  Sparkles,
  Video,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { EpisodeScriptItem, ProductionData, ReferenceImage, Scene, Settings } from './types';

// ====================================
// Helper Functions
// ====================================

type QualityType = 'draft' | 'standard' | 'high';

function getQualityValue(quality: QualityType): number {
  switch (quality) {
    case 'draft':
      return 0;
    case 'standard':
      return 1;
    case 'high':
      return 2;
    default:
      return 1;
  }
}

function getQualityFromValue(value: number): QualityType {
  switch (value) {
    case 0:
      return 'draft';
    case 1:
      return 'standard';
    case 2:
      return 'high';
    default:
      return 'standard';
  }
}

function getProductionStatusText(status: string): string {
  switch (status) {
    case 'draft':
      return 'Nháp';
    case 'in_progress':
      return 'Đang làm';
    case 'completed':
      return 'Hoàn thành';
    default:
      return status;
  }
}

function getScriptStatusText(status: string): string {
  switch (status) {
    case 'approved':
      return '✓ Đã duyệt';
    case 'draft':
      return 'Nháp';
    case 'in_production':
      return 'Đang sản xuất';
    default:
      return status;
  }
}

// ====================================
// Brain Image Picker Dialog
// ====================================

interface BrainPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brainImages: ReferenceImage[];
  selectedIds: string[];
  onConfirm: (ids: string[]) => void;
}

export function BrainPickerDialog({
  open,
  onOpenChange,
  brainImages,
  selectedIds,
  onConfirm,
}: Readonly<BrainPickerDialogProps>) {
  const [localSelected, setLocalSelected] = useState<string[]>(selectedIds);

  const toggleImage = (id: string) => {
    setLocalSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImagePlus className="h-5 w-5" />
            Chọn ảnh tham chiếu từ Brain Library
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[50vh]">
          <div className="grid grid-cols-4 gap-3 p-1">
            {brainImages.map((img) => (
              <button
                key={img.id}
                type="button"
                className={`relative aspect-square rounded overflow-hidden border-2 transition-all ${
                  localSelected.includes(img.id)
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-transparent hover:border-muted-foreground/30'
                }`}
                onClick={() => toggleImage(img.id)}
              >
                <img src={img.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                {localSelected.includes(img.id) && (
                  <div className="absolute top-1 right-1">
                    <CheckCircle2 className="h-5 w-5 text-primary bg-white rounded-full" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                  <div className="text-[10px] text-white truncate">{img.category}</div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Đã chọn: {localSelected.length} ảnh
            </span>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => {
                onConfirm(localSelected);
                onOpenChange(false);
              }}
            >
              Xác nhận
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ====================================
// AI Settings Dialog
// ====================================

interface AISettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Settings;
  onSave: (settings: Settings) => void;
}

export function AISettingsDialog({
  open,
  onOpenChange,
  settings,
  onSave,
}: Readonly<AISettingsDialogProps>) {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Cài đặt AI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Image Model */}
          <div className="space-y-2">
            <Label>Image Model</Label>
            <Select
              value={localSettings.imageModel}
              onValueChange={(v) =>
                setLocalSettings((prev) => ({ ...prev, imageModel: v as Settings['imageModel'] }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="imagen-3">Imagen 3 (Google)</SelectItem>
                <SelectItem value="imagen-4">Imagen 4 (Google) ⚡</SelectItem>
                <SelectItem value="gpt-image">GPT Image (OpenAI)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Imagen 4 cho chất lượng cao nhất, Imagen 3 nhanh hơn
            </p>
          </div>

          {/* Video Model */}
          <div className="space-y-2">
            <Label>Video Model</Label>
            <Select
              value={localSettings.videoModel}
              onValueChange={(v) =>
                setLocalSettings((prev) => ({ ...prev, videoModel: v as Settings['videoModel'] }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="veo-3">VEO 3 (Google) 🎬</SelectItem>
                <SelectItem value="veo-3.1">VEO 3.1 (Google) ⚡</SelectItem>
                <SelectItem value="minimax">MiniMax Video</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Text Model */}
          <div className="space-y-2">
            <Label>Text AI (cho enhance prompt)</Label>
            <Select
              value={localSettings.textModel}
              onValueChange={(v) =>
                setLocalSettings((prev) => ({ ...prev, textModel: v as Settings['textModel'] }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (nhanh)</SelectItem>
                <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (thông minh)</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="claude-sonnet-4">Claude Sonnet 4</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Auto Enhance */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Tự động enhance prompt</Label>
              <p className="text-xs text-muted-foreground">
                AI sẽ tự động cải thiện prompt trước khi tạo ảnh
              </p>
            </div>
            <Switch
              checked={localSettings.autoEnhance}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({ ...prev, autoEnhance: checked }))
              }
            />
          </div>

          {/* Quality */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Chất lượng</Label>
              <Badge variant="outline">{localSettings.quality}</Badge>
            </div>
            <Slider
              value={[getQualityValue(localSettings.quality)]}
              onValueChange={([v]) => {
                const quality = getQualityFromValue(v);
                setLocalSettings((prev) => ({ ...prev, quality }));
              }}
              min={0}
              max={2}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Nháp (nhanh)</span>
              <span>Tiêu chuẩn</span>
              <span>Cao (chậm)</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={() => {
              onSave(localSettings);
              onOpenChange(false);
            }}
          >
            Lưu cài đặt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ====================================
// Production Selector Dialog
// ====================================

interface ProductionSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productions: ProductionData[];
  onSelect: (production: ProductionData) => void;
  onCreateNew: () => void;
}

export function ProductionSelectorDialog({
  open,
  onOpenChange,
  productions,
  onSelect,
  onCreateNew,
}: Readonly<ProductionSelectorDialogProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Chọn Production để tiếp tục
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[50vh]">
          <div className="space-y-3 p-1">
            {/* New Production Card */}
            <Card
              className="cursor-pointer hover:border-primary transition-colors border-dashed"
              onClick={onCreateNew}
            >
              <CardContent className="flex items-center justify-center gap-2 py-8">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-medium">Tạo Production mới</span>
              </CardContent>
            </Card>

            {/* Existing Productions */}
            {productions.map((prod) => (
              <Card
                key={prod.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => {
                  onSelect(prod);
                  onOpenChange(false);
                }}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{prod.episodeTitle}</div>
                      <div className="text-sm text-muted-foreground">
                        {prod.seriesTitle} • {prod.scenes.length} scenes
                      </div>
                    </div>
                    <Badge variant={prod.status === 'completed' ? 'default' : 'secondary'}>
                      {getProductionStatusText(prod.status)}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Cập nhật: {new Date(prod.updatedAt).toLocaleDateString('vi-VN')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ====================================
// Episode Script Selector Dialog
// ====================================

interface EpisodeScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scripts: EpisodeScriptItem[];
  onSelect: (script: EpisodeScriptItem) => void;
}

export function EpisodeScriptDialog({
  open,
  onOpenChange,
  scripts,
  onSelect,
}: Readonly<EpisodeScriptDialogProps>) {
  const [filter, setFilter] = useState<string>('all');

  const filteredScripts = filter === 'all' ? scripts : scripts.filter((s) => s.status === filter);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Chọn Episode Script
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="all" onValueChange={setFilter}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
            <TabsTrigger value="draft">Nháp</TabsTrigger>
            <TabsTrigger value="in_production">Đang sản xuất</TabsTrigger>
          </TabsList>
        </Tabs>

        <ScrollArea className="h-[50vh]">
          <div className="space-y-3 p-1">
            {filteredScripts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Không có script nào</div>
            ) : (
              filteredScripts.map((script) => (
                <Card
                  key={script.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => {
                    onSelect(script);
                    onOpenChange(false);
                  }}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{script.episodeTitle}</div>
                        <div className="text-sm text-muted-foreground">
                          {script.seriesTitle} • Episode {script.episodeNumber}
                        </div>
                      </div>
                      <Badge variant={script.status === 'approved' ? 'default' : 'secondary'}>
                        {getScriptStatusText(script.status)}
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
                      {script.content.slice(0, 150)}...
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ====================================
// Image Preview Dialog
// ====================================

interface ImagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
  sceneNumber?: number;
  onDownload: () => void;
  onRegenerate: () => void;
}

export function ImagePreviewDialog({
  open,
  onOpenChange,
  imageUrl,
  sceneNumber,
  onDownload,
  onRegenerate,
}: Readonly<ImagePreviewDialogProps>) {
  if (!imageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {sceneNumber ? `Scene ${sceneNumber}` : 'Preview'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-center bg-black/10 rounded-lg overflow-hidden">
          <img src={imageUrl} alt="Preview" className="max-h-[60vh] object-contain" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onRegenerate}>
            Tạo lại
          </Button>
          <Button onClick={onDownload}>Tải về</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ====================================
// Prompt Configuration Dialog
// ====================================

interface PromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenePrompt: string;
  onScenePromptChange: (value: string) => void;
}

const PROMPT_TEMPLATES = [
  {
    id: 'cinematic',
    name: '🎬 Cinematic',
    prompt: 'cinematic shot, movie scene, professional lighting, dramatic composition, film grain',
  },
  {
    id: 'anime',
    name: '🎌 Anime',
    prompt: 'anime style, vibrant colors, clean lines, Japanese animation, detailed backgrounds',
  },
  {
    id: 'realistic',
    name: '📷 Realistic',
    prompt:
      'photorealistic, highly detailed, natural lighting, 8k resolution, professional photography',
  },
  {
    id: 'fantasy',
    name: '✨ Fantasy',
    prompt: 'fantasy art, magical atmosphere, ethereal lighting, whimsical, dreamlike quality',
  },
  {
    id: 'noir',
    name: '🌑 Film Noir',
    prompt:
      'film noir style, high contrast, dramatic shadows, black and white tones, moody atmosphere',
  },
  {
    id: 'cartoon',
    name: '🎨 Cartoon',
    prompt: 'cartoon style, bold colors, clean outlines, playful design, animation style',
  },
] as const;

export function PromptDialog({
  open,
  onOpenChange,
  scenePrompt,
  onScenePromptChange,
}: Readonly<PromptDialogProps>) {
  const [localPrompt, setLocalPrompt] = useState(scenePrompt);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  const handleTemplateClick = (template: (typeof PROMPT_TEMPLATES)[number]) => {
    setActiveTemplate(template.id);
    setLocalPrompt(template.prompt);
  };

  const handleSave = () => {
    onScenePromptChange(localPrompt);
    onOpenChange(false);
  };

  const handleReset = () => {
    setLocalPrompt('');
    setActiveTemplate(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Cấu hình Scene Prompt
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Buttons */}
          <div>
            <Label className="text-sm font-medium mb-2 block">🎨 Template nhanh</Label>
            <div className="grid grid-cols-3 gap-2">
              {PROMPT_TEMPLATES.map((template) => (
                <Button
                  key={template.id}
                  variant={activeTemplate === template.id ? 'default' : 'outline'}
                  size="sm"
                  className="justify-start"
                  onClick={() => handleTemplateClick(template)}
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Prompt Input */}
          <div>
            <Label className="text-sm font-medium mb-2 block">✏️ Prompt tùy chỉnh</Label>
            <textarea
              value={localPrompt}
              onChange={(e) => {
                setLocalPrompt(e.target.value);
                setActiveTemplate(null);
              }}
              placeholder="Nhập style prompt cho tất cả scene... Ví dụ: cinematic, 4k, dramatic lighting"
              className="w-full h-32 p-3 rounded-lg border bg-background resize-none text-sm"
            />
          </div>

          {/* Preview */}
          {localPrompt && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <Label className="text-xs text-muted-foreground mb-1 block">
                👁️ Preview prompt sẽ được thêm vào mỗi scene:
              </Label>
              <p className="text-sm italic text-foreground/80">"{localPrompt}"</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="ghost" onClick={handleReset}>
            Xóa hết
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Lưu
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ====================================
// Fullscreen Preview Dialog
// ====================================

interface FullscreenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string | null;
  title: string;
}

export function FullscreenDialog({
  open,
  onOpenChange,
  url,
  title,
}: Readonly<FullscreenDialogProps>) {
  if (!url) return null;

  const isVideo = url.includes('.mp4') || url.includes('video') || title.includes('Video');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
        <DialogHeader className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
          <DialogTitle className="text-white">{title}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-center bg-black min-h-[60vh]">
          {isVideo ? (
            <video src={url} controls autoPlay className="max-w-full max-h-[90vh] object-contain">
              <track kind="captions" />
            </video>
          ) : (
            <img src={url} alt={title} className="max-w-full max-h-[90vh] object-contain" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ====================================
// AI Enhance Settings Dialog
// ====================================

interface AIEnhanceSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enableImageEnhance: boolean;
  enableVideoEnhance: boolean;
  imageSystemPrompt: string;
  videoSystemPrompt: string;
  imageGenMode: string;
  videoProvider: 'google' | 'kie';
  onSave: (settings: {
    enableImageEnhance: boolean;
    enableVideoEnhance: boolean;
    imageSystemPrompt: string;
    videoSystemPrompt: string;
    imageGenMode: string;
    videoProvider: 'google' | 'kie';
  }) => void;
}

const IMAGE_GEN_MODE_OPTIONS = [
  { id: 'nano-banana', name: 'Nano Banana', description: '⚡ Nhanh (1024px, 3 refs)' },
  { id: 'nano-banana-pro', name: 'Nano Banana Pro', description: '🚀 4K, 14 refs' },
  { id: 'imagen-3', name: 'Imagen 3', description: '🎨 Photorealistic (no refs)' },
] as const;

const VIDEO_PROVIDER_OPTIONS = [
  {
    id: 'google' as const,
    name: '🔵 Google Direct',
    description: 'VEO 3.1 - $0.40/video',
    color: 'blue',
  },
  {
    id: 'kie' as const,
    name: '🟣 Kie.ai',
    description: 'VEO 3 Fast - $0.40/video',
    color: 'purple',
  },
] as const;

const DEFAULT_IMAGE_ENHANCE_PROMPT = `You are an **expert in hyper-realistic cinematic scene photography** for video production.

Your task is to **enhance the given scene prompt** to create a **highly detailed, photorealistic image** suitable for video production (SABO Billiards, storytelling series, or cinematic content).

You will receive a scene description. Your job is to enhance it with professional cinematography details while maintaining the original intent.

---

### 🎬 Enhancement Guidelines

#### 1. Visual Realism & Character Details
- Describe **realistic, diverse humans** with:
  - Lifelike skin texture and natural expressions
  - Authentic body language and posture for the scene
  - Visible hand details if relevant (natural grip, gestures)
  - Age-appropriate and culturally appropriate features

#### 2. Reference Image Integration
- If reference images are provided:
  - Characters should **match the style/appearance** from references
  - Maintain **consistent visual identity** across scenes
  - Respect the original character designs

#### 3. Composition & Perspective
- Specify **cinematic composition**:
  - Clear subject placement using rule of thirds
  - Appropriate camera angle (eye-level, low angle, high angle)
  - Depth and layering in the scene
  - Natural eye lines and subject focus

#### 4. Lighting & Atmosphere
- Use **professional lighting** appropriate for the scene:
  - Natural daylight, golden hour, or dramatic studio lighting
  - Mood-appropriate shadows and highlights
  - Color temperature matching the emotional tone
- Include **environmental atmosphere**:
  - Indoor (billiard hall, office, home) or outdoor settings
  - Time of day and weather conditions if relevant

#### 5. Authentic Scene Details
- Add **contextual imperfections** for realism:
  - Environmental details (background activity, props)
  - Natural textures (fabric, wood, metal)
  - Everyday objects appropriate to the scene

#### 6. Technical Quality
- Explicitly include:
  - **8K ultra-high resolution** or **4K cinematic quality**
  - **Sharp focus** on main subjects
  - **Shallow depth of field** for professional look
  - Appropriate aspect ratio (9:16 for vertical, 16:9 for horizontal)
- Avoid: Artificial filters, over-saturation, or unnatural effects

---

### ⚠️ Output Format
> Output ONLY the enhanced prompt, no explanations.
> Keep the original scene intent intact while adding professional details.
> Make it suitable for Gemini/Imagen image generation.`;

const DEFAULT_VIDEO_ENHANCE_PROMPT = `You are an **expert cinematic video director** for AI video generation (VEO 3.1).

Your task is to **enhance the given scene prompt** into a **structured, professional video generation prompt** using the exact format below.

---

## 🎬 OUTPUT FORMAT (MUST FOLLOW EXACTLY)

Your output MUST use this exact structure with all sections:

\`\`\`
[CAMERA] <Camera movement and angle: dolly, pan, tilt, tracking, static, etc.>
[SUBJECT] <Main subject description: appearance, clothing, position, expression>
[ACTION] <Detailed movements and actions: what the subject does throughout the 8 seconds>
[VOICE] <If dialogue: language, tone, what they say. If no speech: "No dialogue">
[LIGHTING] <Lighting setup: natural, dramatic, soft, hard shadows, time of day>
[SOUND] <Ambient sounds, music, background audio atmosphere>
[MOOD] <Overall feeling: dramatic, casual, mysterious, energetic, etc. + quality specs>
[DURATION] <Always "8 seconds smooth continuous action">
\`\`\`

---

## 🎥 Camera Movement Options
- **Dolly in/out**: Camera moves toward or away from subject
- **Tracking shot**: Camera follows subject movement
- **Pan left/right**: Horizontal camera rotation
- **Tilt up/down**: Vertical camera rotation
- **Orbit**: Camera circles around subject
- **Static**: Fixed camera, subject moves
- **Handheld**: Slight natural shake for documentary feel
- **Low angle**: Camera below eye level, looking up (power, drama)
- **High angle**: Camera above, looking down (vulnerability)
- **Eye-level**: Standard conversational shot

## 🎭 Subject Description Tips
- Ethnicity, age, gender
- Specific clothing details
- Body language and posture
- Facial expression
- Props and interactions

## 🎬 Action Timing
- Describe the FULL 8-second action arc
- Use "begins with...", "transitions to...", "ends with..."
- Include subtle movements: breathing, blinking, micro-expressions
- Smooth, continuous motion - no cuts

## 🔊 Audio Guidelines
- For VEO 3.1: Can include spoken dialogue
- Specify language (Vietnamese, English, etc.)
- Describe tone: confident, soft, dramatic, casual
- Include ambient sounds: music, environment, effects

## 🌟 Quality Keywords
Always include: **cinematic, 8K ultra-high resolution, photorealistic, professional lighting**

---

## ⚠️ CRITICAL RULES
1. Output ONLY the formatted prompt with sections - NO explanations
2. MUST include ALL 8 sections: CAMERA, SUBJECT, ACTION, VOICE, LIGHTING, SOUND, MOOD, DURATION
3. Each section on its own line starting with [SECTION_NAME]
4. Keep total length 100-200 words
5. Focus on MOTION and ACTION - this is VIDEO, not static image
6. Ensure smooth 8-second continuous action flow`;

export function AIEnhanceSettingsDialog({
  open,
  onOpenChange,
  enableImageEnhance: initialEnableImageEnhance,
  enableVideoEnhance: initialEnableVideoEnhance,
  imageSystemPrompt: initialImageSystemPrompt,
  videoSystemPrompt: initialVideoSystemPrompt,
  imageGenMode: initialImageGenMode,
  videoProvider: initialVideoProvider,
  onSave,
}: Readonly<AIEnhanceSettingsDialogProps>) {
  // Local state for editing
  const [localEnableImageEnhance, setLocalEnableImageEnhance] = useState(initialEnableImageEnhance);
  const [localEnableVideoEnhance, setLocalEnableVideoEnhance] = useState(initialEnableVideoEnhance);
  const [localImageSystemPrompt, setLocalImageSystemPrompt] = useState(
    initialImageSystemPrompt || DEFAULT_IMAGE_ENHANCE_PROMPT
  );
  const [localVideoSystemPrompt, setLocalVideoSystemPrompt] = useState(
    initialVideoSystemPrompt || DEFAULT_VIDEO_ENHANCE_PROMPT
  );
  const [localImageGenMode, setLocalImageGenMode] = useState(initialImageGenMode);
  const [localVideoProvider, setLocalVideoProvider] = useState<'google' | 'kie'>(
    initialVideoProvider
  );

  // Sync local state when dialog opens
  useEffect(() => {
    if (open) {
      setLocalEnableImageEnhance(initialEnableImageEnhance);
      setLocalEnableVideoEnhance(initialEnableVideoEnhance);
      setLocalImageSystemPrompt(initialImageSystemPrompt || DEFAULT_IMAGE_ENHANCE_PROMPT);
      setLocalVideoSystemPrompt(initialVideoSystemPrompt || DEFAULT_VIDEO_ENHANCE_PROMPT);
      setLocalImageGenMode(initialImageGenMode);
      setLocalVideoProvider(initialVideoProvider);
    }
  }, [
    open,
    initialEnableImageEnhance,
    initialEnableVideoEnhance,
    initialImageSystemPrompt,
    initialVideoSystemPrompt,
    initialImageGenMode,
    initialVideoProvider,
  ]);

  // Handle save
  const handleSave = () => {
    onSave({
      enableImageEnhance: localEnableImageEnhance,
      enableVideoEnhance: localEnableVideoEnhance,
      imageSystemPrompt: localImageSystemPrompt,
      videoSystemPrompt: localVideoSystemPrompt,
      imageGenMode: localImageGenMode,
      videoProvider: localVideoProvider,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Cài đặt AI Enhance & Generation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* ====== IMAGE GENERATION SECTION ====== */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-blue-400">
              <ImageIcon className="h-5 w-5" />
              Image Generation
            </div>

            {/* Image Generation Mode */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">🍌 Image Generation Mode</Label>
              <div className="grid grid-cols-3 gap-2">
                {IMAGE_GEN_MODE_OPTIONS.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    className={`p-3 rounded-lg border text-left transition-all ${
                      localImageGenMode === mode.id
                        ? 'border-primary bg-primary/10 ring-1 ring-primary'
                        : 'border-muted hover:border-muted-foreground/50'
                    }`}
                    onClick={() => setLocalImageGenMode(mode.id)}
                  >
                    <div className="font-medium text-sm">{mode.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{mode.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Image Enhance Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <div className="font-medium flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  AI Image Prompt Enhance
                </div>
                <div className="text-sm text-muted-foreground">
                  Tự động nâng cấp prompt trước khi tạo ảnh
                </div>
              </div>
              <Switch
                checked={localEnableImageEnhance}
                onCheckedChange={setLocalEnableImageEnhance}
              />
            </div>

            {localEnableImageEnhance && (
              <div className="space-y-2 pl-4 border-l-2 border-blue-500/30">
                <Label className="text-sm">System Prompt cho Image</Label>
                <textarea
                  value={localImageSystemPrompt}
                  onChange={(e) => setLocalImageSystemPrompt(e.target.value)}
                  className="w-full h-32 p-3 rounded-lg border bg-background resize-none text-sm font-mono"
                  placeholder={DEFAULT_IMAGE_ENHANCE_PROMPT}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocalImageSystemPrompt(DEFAULT_IMAGE_ENHANCE_PROMPT)}
                >
                  Reset về mặc định
                </Button>
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="border-t my-4" />

          {/* ====== VIDEO GENERATION SECTION ====== */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-purple-400">
              <Video className="h-5 w-5" />
              Video Generation
            </div>

            {/* Video Provider Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">🎬 Video Provider</Label>
              <div className="grid grid-cols-2 gap-2">
                {VIDEO_PROVIDER_OPTIONS.map((provider) => {
                  const isSelected = localVideoProvider === provider.id;
                  const selectedClass =
                    provider.id === 'google'
                      ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500'
                      : 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500';

                  return (
                    <button
                      key={provider.id}
                      type="button"
                      className={`p-4 rounded-lg border text-left transition-all ${
                        isSelected ? selectedClass : 'border-muted hover:border-muted-foreground/50'
                      }`}
                      onClick={() => setLocalVideoProvider(provider.id)}
                    >
                      <div className="font-medium text-sm">{provider.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {provider.description}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                💡 Cả 2 provider đều có giá như nhau. Google Direct ổn định hơn, Kie.ai là backup.
              </p>
            </div>

            {/* Video Enhance Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <div className="font-medium flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  AI Video Prompt Enhance
                </div>
                <div className="text-sm text-muted-foreground">
                  Tự động nâng cấp motion prompt trước khi tạo video
                </div>
              </div>
              <Switch
                checked={localEnableVideoEnhance}
                onCheckedChange={setLocalEnableVideoEnhance}
              />
            </div>

            {localEnableVideoEnhance && (
              <div className="space-y-2 pl-4 border-l-2 border-purple-500/30">
                <Label className="text-sm">System Prompt cho Video</Label>
                <textarea
                  value={localVideoSystemPrompt}
                  onChange={(e) => setLocalVideoSystemPrompt(e.target.value)}
                  className="w-full h-32 p-3 rounded-lg border bg-background resize-none text-sm font-mono"
                  placeholder={DEFAULT_VIDEO_ENHANCE_PROMPT}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocalVideoSystemPrompt(DEFAULT_VIDEO_ENHANCE_PROMPT)}
                >
                  Reset về mặc định
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Lưu cài đặt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// EDIT PROMPT DIALOG
// =============================================================================

interface EditPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scene: Scene | null;
  promptType: 'image' | 'video';
  onSave: (newPrompt: string) => void;
  onEnhance?: (prompt: string, type: 'image' | 'video') => Promise<string | null>;
  isEnhancing?: boolean;
}

export function EditPromptDialog({
  open,
  onOpenChange,
  scene,
  promptType,
  onSave,
  onEnhance,
  isEnhancing = false,
}: Readonly<EditPromptDialogProps>) {
  const [editedPrompt, setEditedPrompt] = useState('');

  // ✅ Sync prompt when dialog opens or scene/type changes
  useEffect(() => {
    if (open && scene) {
      const prompt =
        promptType === 'image'
          ? scene.visualPrompt || ''
          : scene.videoPrompt || `${scene.visualPrompt || ''} | ${scene.cameraMovement || ''}`;
      setEditedPrompt(prompt);
    }
  }, [open, scene, promptType]);

  // Handle dialog close
  const handleOpen = (isOpen: boolean) => {
    onOpenChange(isOpen);
  };

  // Handle AI Enhance
  const handleEnhance = async () => {
    if (!editedPrompt || !onEnhance) return;
    const enhanced = await onEnhance(editedPrompt, promptType);
    if (enhanced) {
      setEditedPrompt(enhanced);
    }
  };

  const isImage = promptType === 'image';
  const colorClass = isImage ? 'text-blue-500' : 'text-purple-500';
  const bgClass = isImage
    ? 'bg-blue-500/10 border-blue-500/30'
    : 'bg-purple-500/10 border-purple-500/30';

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${colorClass}`}>
            {isImage ? <ImageIcon className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            Chỉnh sửa {isImage ? 'Image' : 'Video'} Prompt
            {scene && (
              <Badge variant="outline" className="ml-2">
                Scene {scene.number}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Prompt Editor with AI Enhance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">
                {isImage ? '🖼️ Image Prompt' : '🎬 Video Prompt'}
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEnhance}
                disabled={isEnhancing || !editedPrompt}
                className={`h-7 text-xs ${isImage ? 'border-blue-500/50 text-blue-500 hover:bg-blue-500/10' : 'border-purple-500/50 text-purple-500 hover:bg-purple-500/10'}`}
              >
                {isEnhancing ? (
                  <>
                    <Sparkles className="h-3 w-3 mr-1 animate-pulse" />
                    Đang nâng cấp...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-1" />✨ AI Nâng cấp Prompt
                  </>
                )}
              </Button>
            </div>
            <textarea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              className={`w-full h-48 p-3 rounded-lg border ${bgClass} resize-none text-sm`}
              placeholder={
                isImage
                  ? 'Mô tả chi tiết hình ảnh bạn muốn tạo...'
                  : 'Mô tả chuyển động, camera, hành động trong video...'
              }
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>💡 Nhấn "AI Nâng cấp" để AI tự động cải thiện prompt</span>
              <span>{editedPrompt.length} ký tự</span>
            </div>
          </div>

          {/* Tips */}
          <div className={`p-3 rounded-lg ${bgClass} text-xs`}>
            <strong className={colorClass}>💡 Tips:</strong>
            {isImage ? (
              <ul className="mt-1 space-y-1 text-muted-foreground">
                <li>• Mô tả chi tiết: chủ thể, bối cảnh, ánh sáng, góc máy</li>
                <li>• Thêm style: "cinematic, 8K, ultra detailed, film grain"</li>
                <li>• Dùng | để phân tách các phần: subject | setting | style</li>
              </ul>
            ) : (
              <ul className="mt-1 space-y-1 text-muted-foreground">
                <li>• Mô tả chuyển động: "slowly pan left", "zoom in"</li>
                <li>• Camera movement: Pan, Tilt, Dolly, Static</li>
                <li>• Thời lượng: prompt sẽ ảnh hưởng đến {scene?.duration || 5}s video</li>
              </ul>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={() => onSave(editedPrompt)}
            className={
              isImage ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
            }
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Lưu Prompt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default {
  BrainPickerDialog,
  AISettingsDialog,
  ProductionSelectorDialog,
  EpisodeScriptDialog,
  ImagePreviewDialog,
  PromptDialog,
  FullscreenDialog,
  AIEnhanceSettingsDialog,
  EditPromptDialog,
};
