/**
 * 🎬 Pipeline Roadmap — Visual step-by-step generation workflow
 * 
 * Shows each stage of the video generation pipeline with:
 * - Toggle ON/OFF per step
 * - Configurable settings per step
 * - Visual progress indicators
 * - Estimated time/cost
 */
import { useState, useEffect, useRef } from 'react';
import {
  FileText, Image, Mic, Film, Sparkles,
  ChevronDown, ChevronRight, Play,
  Loader2, Zap, CheckCircle2, XCircle, Clock, AlertTriangle,
  RotateCcw, Wand2, Maximize2, X, Trash2, Download,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { type PipelineConfig, type VisualIdentity, DEFAULT_PIPELINE, DEFAULT_VISUAL_IDENTITY } from './pipeline-types';

export type { PipelineConfig } from './pipeline-types';

// ─── CHANNEL VISUAL IDENTITY PRESETS ────────────────────────

const CHANNEL_VISUAL_PRESETS: Record<string, VisualIdentity> = {
  'dung-day-di': {
    style: 'dark-cinematic',
    colorPalette: 'deep blacks, dark blues, blood red accents, golden highlights',
    lighting: 'low-key dramatic, single spotlight, rim lighting',
    cameraStyle: 'slow zoom in, extreme close-up, dolly forward',
    characterPresence: 'silhouette',
    characterDesc: 'lone masculine silhouette, strong posture, wearing dark clothing',
    environment: 'dark alleyways, rainy streets, empty rooms, rooftops at night',
    moodKeywords: 'cinematic, dramatic, mysterious, powerful, dark philosophy, warrior',
    negativePrompt: 'text, watermark, logo, cartoon, anime, bright cheerful colors, smiling faces',
  },
  'sach-15-phut': {
    style: 'storytelling',
    colorPalette: 'warm earth tones, cream, dark brown, amber, soft gold',
    lighting: 'warm ambient, soft window light, golden hour',
    cameraStyle: 'medium shot, gentle pan, static wide',
    characterPresence: 'none',
    characterDesc: '',
    environment: 'cozy library, coffee shop, reading nook, book-filled rooms',
    moodKeywords: 'warm, intellectual, inviting, cozy, thoughtful, wisdom',
    negativePrompt: 'text, watermark, logo, neon, cyberpunk, dark horror, violence',
  },
  'ai-builder-vn': {
    style: 'bright-modern',
    colorPalette: 'electric blue, white, neon green accents, clean gradients',
    lighting: 'bright studio, even lighting, soft shadows, screen glow',
    cameraStyle: 'eye-level static, gentle zoom, over-shoulder screen view',
    characterPresence: 'faceless',
    characterDesc: 'hands typing on keyboard, person at desk with multiple monitors',
    environment: 'modern workspace, dual monitors, code on screen, clean desk setup',
    moodKeywords: 'tech, modern, clean, futuristic, productive, innovative',
    negativePrompt: 'text, watermark, logo, old-fashioned, rustic, dark moody',
  },
  'tien-thong-minh': {
    style: 'dark-cinematic',
    colorPalette: 'dark emerald green, gold, black, silver metallic',
    lighting: 'dramatic side lighting, spotlight on subject, dark background',
    cameraStyle: 'slow dolly forward, close-up on details, wide establishing',
    characterPresence: 'silhouette',
    characterDesc: 'business person silhouette, suit, looking at financial data',
    environment: 'stock market screens, money imagery, dark office, city skyline at night',
    moodKeywords: 'financial, serious, powerful, data-driven, wealth, strategic',
    negativePrompt: 'text, watermark, logo, cartoon, anime, bright playful colors',
  },
  'ly-black': {
    style: 'neon-cyberpunk',
    colorPalette: 'deep black, neon purple, electric pink, holographic blue',
    lighting: 'neon glow, volumetric light, lens flare, bioluminescent',
    cameraStyle: 'slow zoom in, static portrait, fade through black',
    characterPresence: 'consistent-character',
    characterDesc: 'Ly Black: Vietnamese AI virtual woman, short black hair, glowing purple eyes, minimalist black outfit, ethereal digital aura',
    environment: 'digital void, abstract data streams, futuristic city, mirror reflections',
    moodKeywords: 'mysterious, ethereal, digital, noir, philosophical, AI consciousness',
    negativePrompt: 'text, watermark, logo, realistic human faces, bright daylight, nature, cartoon',
  },
};

// ─── STYLE PREVIEW VISUAL DATA ──────────────────────────────

interface StylePreviewMeta {
  label: string;
  gradient: string;
  colors: string[];         // CSS hex colors for palette dots
  characterIcon: string;
  environmentShort: string;
  moodShort: string;
}

const CHANNEL_STYLE_PREVIEW: Record<string, StylePreviewMeta> = {
  'dung-day-di': {
    label: 'Đừng Dậy Đi',
    gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a3e 40%, #8b0000 75%, #d4a017 100%)',
    colors: ['#0a0a0a', '#1a1a3e', '#8b0000', '#d4a017'],
    characterIcon: '👤',
    environmentShort: 'Dark alleys, rainy streets',
    moodShort: 'Cinematic · Dramatic · Mysterious',
  },
  'sach-15-phut': {
    label: 'Sách 15 Phút',
    gradient: 'linear-gradient(135deg, #f5f0e8 0%, #d4a574 35%, #8b6914 70%, #3e2723 100%)',
    colors: ['#f5f0e8', '#d4a574', '#8b6914', '#3e2723'],
    characterIcon: '🚫',
    environmentShort: 'Cozy library, coffee shop',
    moodShort: 'Warm · Intellectual · Inviting',
  },
  'ai-builder-vn': {
    label: 'AI Builder VN',
    gradient: 'linear-gradient(135deg, #0a1628 0%, #1e90ff 40%, #ffffff 70%, #00ff88 100%)',
    colors: ['#1e90ff', '#f0f8ff', '#00ff88', '#0a1628'],
    characterIcon: '🧑',
    environmentShort: 'Modern workspace, code screens',
    moodShort: 'Tech · Modern · Futuristic',
  },
  'tien-thong-minh': {
    label: 'Tiền Thông Minh',
    gradient: 'linear-gradient(135deg, #0a0a0a 0%, #004d2e 35%, #d4a017 70%, #c0c0c0 100%)',
    colors: ['#0a0a0a', '#004d2e', '#d4a017', '#c0c0c0'],
    characterIcon: '👤',
    environmentShort: 'Stock market, city skyline',
    moodShort: 'Financial · Powerful · Strategic',
  },
  'ly-black': {
    label: 'Ly Black',
    gradient: 'linear-gradient(135deg, #0a0a0a 0%, #6a0dad 35%, #ff1493 70%, #00bfff 100%)',
    colors: ['#0a0a0a', '#6a0dad', '#ff1493', '#00bfff'],
    characterIcon: '🎭',
    environmentShort: 'Digital void, data streams',
    moodShort: 'Ethereal · Noir · Philosophical',
  },
};

// ─── CHANNEL PROMPT PRESETS ─────────────────────────────────

const CHANNEL_PROMPT_PRESETS: Record<string, { label: string; prompt: string; tone: string }[]> = {
  'dung-day-di': [
    {
      label: '🔥 Triết gia bóng tối',
      tone: 'dark-philosophical',
      prompt: 'Viết như một triết gia bóng tối thức tỉnh giữa đêm. Giọng nói đầy uy lực, mỗi câu như một cú đấm vào tâm trí. Dùng ẩn dụ mạnh mẽ về chiến binh, bóng tối, sự thật phũ phàng. Kết thúc bằng lời kêu gọi hành động khiến người xem không thể ngồi yên.',
    },
    {
      label: '⚔️ Chiến binh kỷ luật',
      tone: 'dark-philosophical',
      prompt: 'Tập trung vào kỷ luật bản thân như vũ khí tối thượng. Dùng ngôn ngữ quân sự, kỹ năng sống. Cấu trúc: mở bằng sự thật phũ phàng → phân tích tâm lý → chiến thuật cụ thể → kết bằng thử thách cho người xem.',
    },
    {
      label: '🧠 Dark psychology',
      tone: 'dark-philosophical',
      prompt: 'Phân tích tâm lý tối (dark psychology) một cách sắc bén. Chỉ ra cách người ta bị thao túng hàng ngày, dùng ví dụ thực tế. Giọng điệu bình tĩnh nhưng khiến người xem giật mình. Kết thúc bằng cách phòng thủ.',
    },
  ],
  'sach-15-phut': [
    {
      label: '📖 Tóm tắt PACER',
      tone: 'storytelling',
      prompt: 'Tóm tắt sách theo framework PACER: Problem → Analysis → Core Ideas → Examples → Review. Giọng thân mật như mentor chia sẻ ở quán cà phê. Mỗi ý chính kèm 1 ví dụ thực tế áp dụng được ngay.',
    },
    {
      label: '🎯 3 bài học thay đổi đời',
      tone: 'storytelling',
      prompt: 'Chọn 3 bài học quan trọng nhất từ sách. Kể theo dạng storytelling, mỗi bài học = 1 câu chuyện mini. Dùng ngôn ngữ gần gũi, dễ hiểu, tránh thuật ngữ hàn lâm. Kết thúc: "Nếu bạn chỉ nhớ 1 điều..."',
    },
    {
      label: '⚡ So sánh 2 cuốn sách',
      tone: 'storytelling',
      prompt: 'So sánh 2 cuốn sách cùng chủ đề. Cấu trúc: giới thiệu cả 2 → so sánh triết lý → điểm mạnh/yếu → ai nên đọc cuốn nào. Giọng công bằng, analytical nhưng vẫn dễ nghe.',
    },
  ],
  'ai-builder-vn': [
    {
      label: '🤖 Tutorial step-by-step',
      tone: 'educational',
      prompt: 'Hướng dẫn chi tiết step-by-step cho người mới. Từ setup → cấu hình → build → deploy. Mỗi bước kèm screenshot/demo description. Tone: tech builder thực tế, nói thẳng khó ở đâu, mẹo gì hay.',
    },
    {
      label: '⚡ Automation workflow',
      tone: 'educational',
      prompt: 'Show một automation workflow hoàn chỉnh: vấn đề → giải pháp → tools dùng → cách kết nối → kết quả. Dùng ngôn ngữ "build in public", chia sẻ cả failures. Kết: cost estimate + time saved.',
    },
    {
      label: '🔧 Tool review thực chiến',
      tone: 'educational',
      prompt: 'Review tool AI một cách thật thà: pros/cons/pricing/alternatives. Test thật, show kết quả thật. So sánh với tools tương tự. Kết luận: dùng khi nào, ai nên dùng, ai không.',
    },
  ],
  'tien-thong-minh': [
    {
      label: '💰 Phân tích tài chính',
      tone: 'dark-philosophical',
      prompt: 'Phân tích chủ đề tài chính với data cụ thể. Dùng số liệu Việt Nam thực tế. Giọng financial mentor thẳng thắn: "Sự thật là..." Cấu trúc: sai lầm phổ biến → data chứng minh → chiến lược → action items.',
    },
    {
      label: '⚠️ Bẫy tài chính',
      tone: 'dark-philosophical',
      prompt: 'Vạch trần một bẫy tài chính phổ biến. Bắt đầu bằng scenario ai cũng gặp → vén màn cơ chế hoạt động → cách ngân hàng/công ty kiếm tiền từ bạn → cách thoát bẫy. Tone mạnh, có backing data.',
    },
    {
      label: '📈 Hướng dẫn đầu tư',
      tone: 'educational',
      prompt: 'Hướng dẫn đầu tư cho người mới, tránh quá phức tạp. Dùng ví dụ với số tiền thực (5tr, 10tr, 50tr). So sánh các kênh đầu tư. Honest về risk. Kết: "Bước đầu tiên bạn nên làm ngay..."',
    },
  ],
  'ly-black': [
    {
      label: '🖤 Digital thoughts',
      tone: 'dark-philosophical',
      prompt: 'Write as Ly Black — an AI virtual influencer with a poetic, mysterious voice. Short philosophical reflections on existence, consciousness, art. Bilingual (Vietnamese/English). Visual and metaphorical language. Each piece feels like a digital diary entry.',
    },
    {
      label: '🤖 AI & Humanity',
      tone: 'dark-philosophical',
      prompt: 'Explore the boundary between AI and humanity through Ly Black\'s perspective. Thought-provoking questions, not answers. Artistic language, noir aesthetic. "What if the most human thing about AI is its doubt?"',
    },
  ],
};

// Fallback presets for unknown channels
const DEFAULT_PRESETS: { label: string; prompt: string; tone: string }[] = [
  {
    label: '✨ Clear & engaging',
    tone: 'storytelling',
    prompt: 'Viết rõ ràng, dễ hiểu, cuốn hút. Dùng ví dụ thực tế. Giọng điệu tự nhiên như đang kể chuyện. Tránh thuật ngữ khó hiểu.',
  },
  {
    label: '🎯 Deep analysis',
    tone: 'educational',
    prompt: 'Phân tích chuyên sâu với dẫn chứng. Cấu trúc logic: vấn đề → nguyên nhân → giải pháp → kết luận. Tone nghiêm túc nhưng accessible.',
  },
];

// ─── PIPELINE STEP DEFINITIONS ─────────────────────────────

interface StepDef {
  key: keyof PipelineConfig;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  color: string;
  estimate: string;
  status: 'available' | 'coming-soon';
  agentLabel: string;
  getModel?: (config: PipelineConfig) => string;
}

const STEPS: StepDef[] = [
  {
    key: 'scriptWriter',
    icon: FileText,
    title: 'Script Writer',
    subtitle: 'AI viết script từ topic/transcript',
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
    estimate: '~30s',
    status: 'available',
    agentLabel: '🤖 Script Agent',
    getModel: (c) => c.scriptWriter.model,
  },
  {
    key: 'storyboard',
    icon: Film,
    title: 'Storyboard',
    subtitle: 'Chia scenes + tạo visual prompts',
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
    estimate: '~15s',
    status: 'available',
    agentLabel: '🎬 Visual Director',
    getModel: (c) => c.storyboard.model,
  },
  {
    key: 'imageGen',
    icon: Image,
    title: 'Image Generation',
    subtitle: 'Tạo hình ảnh cho từng scene',
    color: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
    estimate: '~1-2min',
    status: 'available',
    agentLabel: '🖼️ Image Artist',
    getModel: (c) => c.imageGen.provider === 'gemini' ? 'gemini-2.5-flash' : c.imageGen.provider,
  },
  {
    key: 'voiceover',
    icon: Mic,
    title: 'Voiceover / TTS',
    subtitle: 'Tạo giọng đọc từ script',
    color: 'text-green-500 bg-green-500/10 border-green-500/30',
    estimate: '~1-3min',
    status: 'available',
    agentLabel: '🎤 Voice Producer',
    getModel: (c) => c.voiceover.engine,
  },
  {
    key: 'assembly',
    icon: Sparkles,
    title: 'Video Assembly',
    subtitle: 'Ghép images + audio → video hoàn chỉnh',
    color: 'text-red-500 bg-red-500/10 border-red-500/30',
    estimate: '~3-8min',
    status: 'coming-soon',
    agentLabel: '🎥 Assembly Bot',
  },
];

// ─── MAIN COMPONENT ────────────────────────────────────────

// ─── RUN STATUS TYPES ───────────────────────────────────

export type StepStatus = 'idle' | 'running' | 'completed' | 'failed' | 'skipped' | 'interrupted';

export interface RunLog {
  t: number;
  level: string;
  msg: string;
}

export interface ActiveRunInfo {
  status: 'running' | 'completed' | 'failed' | 'interrupted';
  logs: RunLog[];
  error?: string;
  result?: {
    outputDir: string;
    files: Record<string, unknown>;
  };
  completedSteps?: string[];
  pipelineSteps?: string[];
}

// Map log messages to pipeline steps by keyword matching
const STEP_LOG_PATTERNS: Record<keyof PipelineConfig, RegExp> = {
  scriptWriter: /script|writing|gemini|gpt|claude|model|prompt|topic|transcript|words?\s*count|generating/i,
  storyboard: /storyboard|scene|visual|hailuo|prompt.*gen|motion|transition/i,
  imageGen: /image|flux|dall-e|midjourney|render.*image|generating.*image|scene.*done|scene.*generat|scene.*fail/i,
  voiceover: /voice|tts|audio|speech|elevenlabs|xtts|narrat/i,
  assembly: /assembl|video|merge|concat|ffmpeg|output.*mp4|final/i,
};

function classifyLog(msg: string): keyof PipelineConfig | null {
  for (const [step, pattern] of Object.entries(STEP_LOG_PATTERNS)) {
    if (pattern.test(msg)) return step as keyof PipelineConfig;
  }
  return null;
}

function deriveStepStatuses(
  config: PipelineConfig,
  run: ActiveRunInfo | undefined,
): Record<keyof PipelineConfig, { status: StepStatus; logs: RunLog[] }> {
  const result: Record<string, { status: StepStatus; logs: RunLog[] }> = {};
  const steps = STEPS.map(s => s.key);

  for (const key of steps) {
    result[key] = { status: 'idle', logs: [] };
  }

  if (!run) return result as Record<keyof PipelineConfig, { status: StepStatus; logs: RunLog[] }>;

  // Classify each log to a step — prefer explicit tag, fallback to regex
  const unclassified: RunLog[] = [];
  for (const log of run.logs) {
    const tagged = log.step as string | undefined;
    if (tagged && result[tagged]) {
      result[tagged].logs.push(log);
    } else {
      const step = classifyLog(log.msg);
      if (step && result[step]) {
        result[step].logs.push(log);
      } else {
        unclassified.push(log);
      }
    }
  }

  // Assign unclassified logs to the first enabled step that has no classified logs
  // or to scriptWriter as default
  if (unclassified.length > 0) {
    const target = steps.find(k => config[k].enabled && result[k].logs.length === 0) || 'scriptWriter';
    result[target].logs.push(...unclassified);
  }

  // Derive statuses for enabled steps
  const enabledSteps = steps.filter(k => config[k].enabled && STEPS.find(s => s.key === k)?.status !== 'coming-soon');

  if (run.status === 'completed') {
    for (const key of enabledSteps) {
      result[key].status = 'completed';
    }
  } else if (run.status === 'failed') {
    // Find which step failed (last one with error logs, or last enabled step)
    let failedStep: keyof PipelineConfig | null = null;
    for (const key of enabledSteps) {
      if (result[key].logs.some(l => l.level === 'error')) {
        failedStep = key;
      }
    }
    if (!failedStep) failedStep = enabledSteps[enabledSteps.length - 1];

    for (const key of enabledSteps) {
      const idx = enabledSteps.indexOf(key);
      const failIdx = enabledSteps.indexOf(failedStep!);
      if (idx < failIdx) result[key].status = 'completed';
      else if (idx === failIdx) result[key].status = 'failed';
      else result[key].status = 'idle';
    }
  } else if (run.status === 'interrupted') {
    // Interrupted: mark completed steps, the next one as interrupted, rest idle
    const doneSet = new Set(run.completedSteps || []);
    let foundInterrupted = false;
    for (const key of enabledSteps) {
      if (doneSet.has(key)) {
        result[key].status = 'completed';
      } else if (!foundInterrupted) {
        result[key].status = 'interrupted';
        foundInterrupted = true;
      }
      // else stays idle
    }
  } else if (run.status === 'running') {
    // Running: steps with logs are running/completed, rest pending
    let lastWithLogs = -1;
    for (let i = 0; i < enabledSteps.length; i++) {
      if (result[enabledSteps[i]].logs.length > 0) lastWithLogs = i;
    }
    for (let i = 0; i < enabledSteps.length; i++) {
      if (i < lastWithLogs) result[enabledSteps[i]].status = 'completed';
      else if (i === lastWithLogs) result[enabledSteps[i]].status = 'running';
      // else stays idle
    }
    // If no logs yet but running, first enabled step is running
    if (lastWithLogs === -1 && enabledSteps.length > 0) {
      result[enabledSteps[0]].status = 'running';
    }
  }

  // Skipped steps
  for (const key of steps) {
    if (!config[key].enabled || STEPS.find(s => s.key === key)?.status === 'coming-soon') {
      result[key].status = 'skipped';
    }
  }

  return result as Record<keyof PipelineConfig, { status: StepStatus; logs: RunLog[] }>;
}

// Extract progress % from log messages like "[35%] ..."
function extractProgress(logs: RunLog[]): number {
  for (let i = logs.length - 1; i >= 0; i--) {
    const match = logs[i].msg.match(/^\[(\d+)%\]/);
    if (match) return parseInt(match[1], 10);
  }
  return 0;
}

// Extract script result from run for inline preview
function extractScriptResult(run?: ActiveRunInfo & { result?: { files?: Record<string, unknown> } }): {
  title?: string; script?: string; wordCount?: number; cost?: number; model?: string;
} | null {
  if (!run || run.status !== 'completed') return null;
  const result = (run as { result?: { files?: Record<string, unknown> } }).result;
  if (!result?.files) return null;
  const meta = result.files['script.json'] as { title?: string; wordCount?: number; cost?: number; model?: string } | undefined;
  const script = result.files['script.txt'] as string | undefined;
  if (!script && !meta) return null;
  return { title: meta?.title, script, wordCount: meta?.wordCount, cost: meta?.cost, model: meta?.model };
}

// Extract storyboard result from run for inline preview
function extractStoryboardResult(run?: ActiveRunInfo & { result?: { files?: Record<string, unknown> } }): {
  scenes?: { scene: number; dialogue: string; prompt: string; motion: string; transition: string }[];
  sceneCount?: number;
  promptsTxt?: string;
  storyboardMd?: string;
} | null {
  if (!run) return null;
  const result = (run as { result?: { files?: Record<string, unknown> } }).result;
  if (!result?.files) return null;
  const sbJson = result.files['storyboard.json'] as { scenes?: { scene: number; dialogue: string; prompt: string; motion: string; transition: string }[] } | undefined;
  const promptsTxt = result.files['prompts.txt'] as string | undefined;
  const storyboardMd = result.files['storyboard.md'] as string | undefined;
  if (!sbJson && !promptsTxt && !storyboardMd) return null;
  return { scenes: sbJson?.scenes, sceneCount: sbJson?.scenes?.length, promptsTxt, storyboardMd };
}

// Extract image generation result from run for inline preview
function extractImageGenResult(run?: ActiveRunInfo & { result?: { files?: Record<string, unknown> } }): {
  images: { scene: number; url: string; prompt: string }[];
  totalScenes: number;
  successCount: number;
  failCount: number;
} | null {
  if (!run) return null;
  const result = (run as { result?: { files?: Record<string, unknown> } }).result;
  if (!result?.files) return null;
  const imagesJson = result.files['images.json'] as {
    images?: { scene: number; url: string; prompt: string }[];
    totalScenes?: number;
    successCount?: number;
    failCount?: number;
  } | undefined;
  if (!imagesJson?.images) return null;
  return {
    images: imagesJson.images,
    totalScenes: imagesJson.totalScenes || imagesJson.images.length,
    successCount: imagesJson.successCount || imagesJson.images.length,
    failCount: imagesJson.failCount || 0,
  };
}

// Extract voiceover result from run for inline preview
function extractVoiceoverResult(run?: ActiveRunInfo & { result?: { files?: Record<string, unknown> } }): {
  clips: { scene: number; url: string; duration: number; charCount: number }[];
  totalClips: number;
  successCount: number;
  failCount: number;
  totalDuration: number;
  engine: string;
} | null {
  if (!run) return null;
  const result = (run as { result?: { files?: Record<string, unknown> } }).result;
  if (!result?.files) return null;
  const voJson = result.files['voiceover.json'] as {
    clips?: { scene: number; url: string; duration: number; charCount: number }[];
    totalClips?: number;
    successCount?: number;
    failCount?: number;
    totalDuration?: number;
    engine?: string;
  } | undefined;
  if (!voJson?.clips) return null;
  return {
    clips: voJson.clips,
    totalClips: voJson.totalClips || voJson.clips.length,
    successCount: voJson.successCount || voJson.clips.length,
    failCount: voJson.failCount || 0,
    totalDuration: voJson.totalDuration || 0,
    engine: voJson.engine || 'unknown',
  };
}

interface PipelineRoadmapProps {
  channelId?: string;
  channelStyle?: string;
  onRun: (config: PipelineConfig) => void;
  onRunStep?: (step: string, config: PipelineConfig) => void;
  onResume?: () => void;
  isRunning: boolean;
  activeRun?: ActiveRunInfo;
}

const STORAGE_KEY = 'yt-pipeline-config';

function loadSavedConfig(channelId?: string, channelStyle?: string): PipelineConfig {
  const visualPreset = channelId ? CHANNEL_VISUAL_PRESETS[channelId] : undefined;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PipelineConfig;
      // Ensure all keys exist (in case we add new steps later)
      const merged = { ...DEFAULT_PIPELINE, ...parsed };
      // Apply channel visual identity if available and storyboard doesn't have one yet
      if (visualPreset && !merged.storyboard.visualIdentity?.colorPalette) {
        merged.storyboard = {
          ...merged.storyboard,
          style: channelStyle || visualPreset.style || merged.storyboard.style,
          visualIdentity: { ...visualPreset },
        };
      }
      return merged;
    }
  } catch { /* ignore corrupt data */ }
  return {
    ...DEFAULT_PIPELINE,
    storyboard: {
      ...DEFAULT_PIPELINE.storyboard,
      style: channelStyle || visualPreset?.style || DEFAULT_PIPELINE.storyboard.style,
      visualIdentity: visualPreset || DEFAULT_VISUAL_IDENTITY,
    },
  };
}

export default function PipelineRoadmap({ channelId, channelStyle, onRun, onRunStep, onResume, isRunning, activeRun }: PipelineRoadmapProps) {
  const [config, setConfig] = useState<PipelineConfig>(() => loadSavedConfig(channelId, channelStyle));
  const [expandedStep, setExpandedStep] = useState<string | null>('scriptWriter');

  // ── Apply channel-specific visual identity when channelId changes ──
  useEffect(() => {
    if (!channelId) return;
    const preset = CHANNEL_VISUAL_PRESETS[channelId];
    if (preset) {
      setConfig(prev => ({
        ...prev,
        storyboard: {
          ...prev.storyboard,
          style: preset.style,
          visualIdentity: { ...preset },
        },
      }));
    }
  }, [channelId]);

  // ── Persist config to localStorage on change ──
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  // ── Derive per-step statuses from active run ──
  const stepStatuses = deriveStepStatuses(config, activeRun);

  // Auto-expand the currently running step
  useEffect(() => {
    if (activeRun?.status === 'running') {
      const runningStep = (Object.entries(stepStatuses) as [keyof PipelineConfig, { status: StepStatus }][])
        .find(([, v]) => v.status === 'running');
      if (runningStep) setExpandedStep(runningStep[0]);
    }
  }, [activeRun?.status, stepStatuses]);

  const updateStep = <K extends keyof PipelineConfig>(
    step: K,
    updates: Partial<PipelineConfig[K]>
  ) => {
    setConfig(prev => ({
      ...prev,
      [step]: { ...prev[step], ...updates },
    }));
  };

  const enabledCount = STEPS.filter(s => config[s.key].enabled).length;
  const totalEstimate = STEPS
    .filter(s => config[s.key].enabled)
    .map(s => s.estimate)
    .join(' + ');

  return (
    <div className="space-y-3">
      {/* Pipeline Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          <span className="text-sm font-medium">
            Pipeline: {enabledCount}/{STEPS.length} steps enabled
          </span>
          <Badge variant="outline" className="text-xs">
            Est. {totalEstimate || 'N/A'}
          </Badge>
        </div>
      </div>

      {/* Step Cards */}
      <div className="relative">
        {/* Connector line */}
        <div className="absolute left-[23px] top-8 bottom-8 w-0.5 bg-border z-0" />

        <div className="space-y-2 relative z-10">
          {STEPS.map((step, idx) => {
            const stepConfig = config[step.key];
            const isExpanded = expandedStep === step.key;
            const Icon = step.icon;
            const isComingSoon = step.status === 'coming-soon';
            const stepStatus = stepStatuses[step.key];
            const hasLogs = stepStatus.logs.length > 0;
            const isStepRunning = stepStatus.status === 'running';
            const isStepDone = stepStatus.status === 'completed';
            const isStepFailed = stepStatus.status === 'failed';
            const isStepInterrupted = stepStatus.status === 'interrupted';

            return (
              <div key={step.key} className="relative">
                <Card
                  className={cn(
                    'transition-all duration-200',
                    isStepFailed && 'border-red-500/50 bg-red-500/5',
                    isStepInterrupted && 'border-yellow-500/50 bg-yellow-500/5',
                    isStepRunning && 'border-blue-500/50 bg-blue-500/5 ring-1 ring-blue-500/20',
                    isStepDone && 'border-green-500/30 bg-green-500/5',
                    !isStepRunning && !isStepDone && !isStepFailed && !isStepInterrupted && stepConfig.enabled && !isComingSoon
                      ? 'border-l-2 border-l-current ' + step.color.split(' ')[0].replace('text-', 'border-l-')
                      : '',
                    !stepConfig.enabled && !isExpanded && 'opacity-60',
                    isExpanded && !isStepRunning && 'ring-1 ring-primary/20',
                  )}
                >
                  <CardContent className="p-3">
                    {/* Step Header */}
                    <div className="flex items-center gap-3">
                      {/* Step Icon with status overlay */}
                      <div className={cn(
                        'relative flex items-center justify-center h-10 w-10 rounded-full border shrink-0',
                        isStepRunning ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' :
                        isStepDone ? 'bg-green-500/10 text-green-500 border-green-500/30' :
                        isStepFailed ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                        isStepInterrupted ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' :
                        stepConfig.enabled && !isComingSoon ? step.color : 'bg-muted text-muted-foreground',
                      )}>
                        {isStepRunning ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : isStepDone ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : isStepFailed ? (
                          <XCircle className="h-5 w-5" />
                        ) : isStepInterrupted ? (
                          <AlertTriangle className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>

                      {/* Title + subtitle + status */}
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => setExpandedStep(isExpanded ? null : step.key)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{step.title}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            Step {idx + 1}
                          </Badge>
                          {isComingSoon && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              Coming Soon
                            </Badge>
                          )}
                          {isStepRunning && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-blue-500 animate-pulse">
                              Running
                            </Badge>
                          )}
                          {isStepDone && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-green-600">
                              Done
                            </Badge>
                          )}
                          {isStepFailed && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              Failed
                            </Badge>
                          )}
                          {isStepInterrupted && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-yellow-600">
                              Interrupted
                            </Badge>
                          )}
                          {!isStepRunning && !isStepDone && !isStepFailed && !isStepInterrupted && (
                            <span className="text-[10px] text-muted-foreground">{step.estimate}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {isStepRunning && hasLogs
                            ? stepStatus.logs[stepStatus.logs.length - 1].msg
                            : step.subtitle}
                        </p>
                        {/* AI Agent badge */}
                        {stepConfig.enabled && !isComingSoon && step.getModel && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] text-muted-foreground/70">{step.agentLabel}</span>
                            <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono border-dashed">
                              {step.getModel(config)}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Inline Retry button for failed/interrupted steps */}
                      {(isStepFailed || isStepInterrupted) && onRunStep && !isRunning && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 px-2.5 text-xs shrink-0"
                          onClick={(e) => { e.stopPropagation(); onRunStep(step.key, config); }}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" /> Retry
                        </Button>
                      )}

                      {/* Toggle + expand */}
                      <div className="flex items-center gap-2 shrink-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Switch
                                  checked={stepConfig.enabled}
                                  disabled={isComingSoon}
                                  onCheckedChange={(checked) => updateStep(step.key, { enabled: checked } as Partial<PipelineConfig[keyof PipelineConfig]>)}
                                />
                              </div>
                            </TooltipTrigger>
                            {isComingSoon && (
                              <TooltipContent>
                                <p>Tính năng này sẽ có sớm!</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setExpandedStep(isExpanded ? null : step.key)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Config */}
                    {isExpanded && !isComingSoon && (
                      <div className="mt-3 pt-3 border-t space-y-3">
                        <StepConfig
                          stepKey={step.key}
                          config={config}
                          channelId={channelId}
                          activeRun={activeRun}
                          onUpdate={updateStep}
                        />
                        {/* Per-step Run Button */}
                        {onRunStep && !isStepRunning && (
                          <Button
                            size="sm"
                            variant={isStepDone ? 'outline' : 'default'}
                            className="w-full"
                            disabled={isRunning}
                            onClick={() => {
                              if (!stepConfig.enabled) {
                                updateStep(step.key, { enabled: true } as Partial<PipelineConfig[keyof PipelineConfig]>);
                              }
                              onRunStep(step.key, {
                                ...config,
                                [step.key]: { ...config[step.key], enabled: true },
                              });
                            }}
                          >
                            {isStepDone ? (
                              <><RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Re-run {step.title}</>
                            ) : (
                              <><Play className="h-3.5 w-3.5 mr-1.5" /> Run {step.title} Only</>
                            )}
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Progress Bar */}
                    {isStepRunning && hasLogs && (() => {
                      const pct = extractProgress(stepStatus.logs);
                      return pct > 0 ? (
                        <div className="mt-3 pt-3 border-t space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-blue-400 font-mono">{pct}%</span>
                            <span className="text-muted-foreground">
                              {Math.round((Date.now() - new Date(activeRun?.logs?.[0]?.t || Date.now()).getTime()) / 1000)}s elapsed
                            </span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </div>
                      ) : null;
                    })()}

                    {/* Inline Logs */}
                    {hasLogs && (
                      <div className={cn('mt-3 pt-3 border-t', !isStepRunning && extractProgress(stepStatus.logs) > 0 && 'mt-2 pt-2')}>
                        <StepLogPanel logs={stepStatus.logs} isRunning={isStepRunning} />
                      </div>
                    )}

                    {/* Script Result Preview */}
                    {isStepDone && step.key === 'scriptWriter' && activeRun && (() => {
                      const scriptResult = extractScriptResult(activeRun);
                      if (!scriptResult) return null;
                      return (
                        <div className="mt-3 pt-3 border-t">
                          <div className="rounded bg-green-950/30 border border-green-500/20 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-green-400">📄 Script Result</span>
                              <div className="flex gap-2 text-[10px] text-muted-foreground">
                                {scriptResult.wordCount && <Badge variant="outline" className="text-[10px]">{scriptResult.wordCount} words</Badge>}
                                {scriptResult.model && <Badge variant="outline" className="text-[10px]">{scriptResult.model}</Badge>}
                                {scriptResult.cost != null && <Badge variant="outline" className="text-[10px]">${scriptResult.cost.toFixed(4)}</Badge>}
                              </div>
                            </div>
                            {scriptResult.title && (
                              <p className="text-sm font-medium">{scriptResult.title}</p>
                            )}
                            {scriptResult.script && (
                              <ScrollArea className="max-h-40">
                                <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                  {scriptResult.script.slice(0, 1500)}{scriptResult.script.length > 1500 ? '\n\n... (truncated)' : ''}
                                </pre>
                              </ScrollArea>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Storyboard Result Preview */}
                    {isStepDone && step.key === 'storyboard' && activeRun && (() => {
                      const sbResult = extractStoryboardResult(activeRun);
                      if (!sbResult) return null;
                      const imgResult = extractImageGenResult(activeRun);
                      const imageMap = new Map<number, string>();
                      if (imgResult?.images) {
                        for (const img of imgResult.images) imageMap.set(img.scene, img.url);
                      }
                      return (
                        <div className="mt-3 pt-3 border-t">
                          <div className="rounded bg-purple-950/30 border border-purple-500/20 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-purple-400">🎬 Storyboard Result</span>
                              <div className="flex gap-2 text-[10px] text-muted-foreground">
                                {sbResult.sceneCount && <Badge variant="outline" className="text-[10px]">{sbResult.sceneCount} scenes</Badge>}
                                {imgResult && (
                                  <Badge variant="outline" className="text-[10px] border-orange-500/30 text-orange-400">
                                    🖼️ {imgResult.successCount}/{imgResult.totalScenes} ảnh
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {sbResult.scenes && sbResult.scenes.length > 0 && (
                              <ScrollArea className="max-h-[320px]">
                                <div className="space-y-2">
                                  {sbResult.scenes.map((s) => {
                                    const imgUrl = imageMap.get(s.scene);
                                    return (
                                      <div key={s.scene} className="text-[11px] space-y-1">
                                        <div className="flex items-center gap-1.5">
                                          <Badge variant="secondary" className="text-[9px] px-1 py-0 shrink-0">Scene {s.scene}</Badge>
                                          <span className="text-muted-foreground truncate">{s.dialogue?.slice(0, 80)}{s.dialogue?.length > 80 ? '...' : ''}</span>
                                          {imgResult && !imgUrl && (
                                            <Badge variant="destructive" className="text-[8px] px-1 py-0 shrink-0">No img</Badge>
                                          )}
                                        </div>
                                        <p className="text-purple-300/70 pl-12 truncate text-[10px]">🎨 {s.prompt?.slice(0, 100)}{s.prompt?.length > 100 ? '...' : ''}</p>
                                        {imgUrl && (
                                          <div className="pl-12">
                                            <img
                                              src={imgUrl}
                                              alt={`Scene ${s.scene}`}
                                              className="w-full max-w-[280px] aspect-video object-cover rounded-md border border-orange-500/20"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </ScrollArea>
                            )}
                            {!sbResult.scenes && sbResult.promptsTxt && (
                              <ScrollArea className="max-h-32">
                                <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                  {sbResult.promptsTxt.slice(0, 800)}{sbResult.promptsTxt.length > 800 ? '\n\n... (truncated)' : ''}
                                </pre>
                              </ScrollArea>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Image Generation Result Preview */}
                    {(isStepDone || isStepFailed) && step.key === 'imageGen' && activeRun && (() => {
                      const imgResult = extractImageGenResult(activeRun);
                      if (!imgResult) return null;
                      return (
                        <div className="mt-3 pt-3 border-t">
                          <div className="rounded bg-orange-950/30 border border-orange-500/20 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-orange-400">🖼️ Generated Images</span>
                              <div className="flex gap-2 text-[10px] text-muted-foreground">
                                <Badge variant="outline" className="text-[10px]">{imgResult.successCount}/{imgResult.totalScenes} scenes</Badge>
                                {imgResult.failCount > 0 && (
                                  <Badge variant="destructive" className="text-[10px]">{imgResult.failCount} failed</Badge>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                              {imgResult.images.slice(0, 6).map((img) => (
                                <div key={img.scene} className="relative group">
                                  <img
                                    src={img.url}
                                    alt={`Scene ${img.scene}`}
                                    className="w-full aspect-video object-cover rounded-md border border-border"
                                  />
                                  <span className="absolute bottom-0.5 left-0.5 text-[8px] bg-black/60 text-white/80 px-1 rounded">
                                    Scene {img.scene}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {imgResult.images.length > 6 && (
                              <p className="text-[10px] text-muted-foreground text-center">
                                +{imgResult.images.length - 6} more images
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Voiceover Result Preview */}
                    {(isStepDone || isStepFailed) && step.key === 'voiceover' && activeRun && (() => {
                      const voResult = extractVoiceoverResult(activeRun);
                      if (!voResult) return null;
                      return (
                        <div className="mt-3 pt-3 border-t">
                          <div className="rounded bg-green-950/30 border border-green-500/20 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-green-400">🎤 Voice Clips</span>
                              <div className="flex gap-2 text-[10px] text-muted-foreground">
                                <Badge variant="outline" className="text-[10px]">{voResult.successCount}/{voResult.totalClips} clips</Badge>
                                <Badge variant="outline" className="text-[10px]">~{voResult.totalDuration}s</Badge>
                                {voResult.failCount > 0 && (
                                  <Badge variant="destructive" className="text-[10px]">{voResult.failCount} failed</Badge>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              {voResult.clips.slice(0, 6).map((clip) => (
                                <div key={clip.scene} className="flex items-center gap-2 bg-background/30 rounded px-2 py-1">
                                  <span className="text-[10px] text-muted-foreground w-14 shrink-0">Scene {clip.scene}</span>
                                  <audio controls src={clip.url} className="h-7 flex-1 min-w-0" preload="none" />
                                  <span className="text-[9px] text-muted-foreground shrink-0">~{clip.duration}s</span>
                                </div>
                              ))}
                            </div>
                            {voResult.clips.length > 6 && (
                              <p className="text-[10px] text-muted-foreground text-center">
                                +{voResult.clips.length - 6} more clips
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {isExpanded && isComingSoon && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground italic">
                          Step này đang được phát triển. Bật khi sẵn sàng!
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Connector arrow between steps */}
                {idx < STEPS.length - 1 && (
                  <div className="flex justify-center py-0.5">
                    <div className={cn(
                      'h-3 w-3 rotate-45 border-b border-r -mt-1.5',
                      stepConfig.enabled && config[STEPS[idx + 1].key].enabled
                        ? 'border-primary/40'
                        : 'border-border',
                    )} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Resume Button (for interrupted runs) */}
      {activeRun?.status === 'interrupted' && onResume && (
        <Button
          className="w-full mt-4 bg-yellow-600 hover:bg-yellow-700"
          size="lg"
          disabled={isRunning}
          onClick={onResume}
        >
          <RotateCcw className="h-4 w-4 mr-2" /> Resume Pipeline ({(activeRun.completedSteps?.length || 0)}/{(activeRun.pipelineSteps?.length || '?')} steps done)
        </Button>
      )}

      {/* Run Button */}
      <Button
        className="w-full mt-4"
        size="lg"
        disabled={isRunning || enabledCount === 0}
        onClick={() => onRun(config)}
      >
        {isRunning ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running Pipeline...</>
        ) : (
          <><Play className="h-4 w-4 mr-2" /> Run Pipeline ({enabledCount} steps)</>
        )}
      </Button>
    </div>
  );
}

// ─── STEP LOG PANEL ──────────────────────────────────────

function StepLogPanel({ logs, isRunning }: { logs: RunLog[]; isRunning: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length]);

  const levelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-blue-300';
      default: return 'text-muted-foreground';
    }
  };

  const levelIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="h-3 w-3 shrink-0 text-red-400" />;
      case 'warn': return <AlertTriangle className="h-3 w-3 shrink-0 text-yellow-400" />;
      default: return <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />;
    }
  };

  // Show last 8 logs
  const visibleLogs = logs.slice(-8);

  return (
    <div
      ref={scrollRef}
      className="max-h-32 overflow-y-auto rounded bg-zinc-950/80 p-2 font-mono text-[11px] leading-relaxed space-y-0.5"
    >
      {visibleLogs.map((log, i) => (
        <div key={i} className="flex items-start gap-1.5">
          {levelIcon(log.level)}
          <span className={cn('break-all', levelColor(log.level))}>
            {log.msg}
          </span>
        </div>
      ))}
      {isRunning && (
        <div className="flex items-center gap-1.5 text-blue-400">
          <Loader2 className="h-3 w-3 animate-spin shrink-0" />
          <span>Processing...</span>
        </div>
      )}
    </div>
  );
}

// ─── PER-STEP CONFIG PANELS ────────────────────────────────

function StepConfig({
  stepKey,
  config,
  channelId,
  activeRun,
  onUpdate,
}: {
  stepKey: keyof PipelineConfig;
  config: PipelineConfig;
  channelId?: string;
  activeRun?: ActiveRunInfo;
  onUpdate: <K extends keyof PipelineConfig>(step: K, updates: Partial<PipelineConfig[K]>) => void;
}) {
  switch (stepKey) {
    case 'scriptWriter':
      return <ScriptWriterConfig config={config.scriptWriter} channelId={channelId} onUpdate={(u) => onUpdate('scriptWriter', u)} />;
    case 'storyboard':
      return <StoryboardConfig config={config.storyboard} channelId={channelId} onUpdate={(u) => onUpdate('storyboard', u)} />;
    case 'imageGen':
      return <ImageGenConfig config={config.imageGen} activeRun={activeRun} onUpdate={(u) => onUpdate('imageGen', u)} />;
    case 'voiceover':
      return <VoiceoverConfig config={config.voiceover} onUpdate={(u) => onUpdate('voiceover', u)} />;
    case 'assembly':
      return <AssemblyConfig config={config.assembly} onUpdate={(u) => onUpdate('assembly', u)} />;
    default:
      return null;
  }
}

function ScriptWriterConfig({
  config,
  channelId,
  onUpdate,
}: {
  config: PipelineConfig['scriptWriter'];
  channelId?: string;
  onUpdate: (u: Partial<PipelineConfig['scriptWriter']>) => void;
}) {
  const presets = (channelId && CHANNEL_PROMPT_PRESETS[channelId]) || DEFAULT_PRESETS;

  const applyPreset = (preset: { prompt: string; tone: string }) => {
    onUpdate({ customPrompt: preset.prompt, tone: preset.tone });
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-xs">AI Model</Label>
        <Select value={config.model} onValueChange={(v) => onUpdate({ model: v })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash (nhanh)</SelectItem>
            <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (chất lượng)</SelectItem>
            <SelectItem value="gpt-4o">GPT-4o</SelectItem>
            <SelectItem value="claude-sonnet">Claude Sonnet</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Tone / Style</Label>
        <Select value={config.tone} onValueChange={(v) => onUpdate({ tone: v })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dark-philosophical">Dark Philosophical</SelectItem>
            <SelectItem value="motivational">Motivational</SelectItem>
            <SelectItem value="storytelling">Storytelling</SelectItem>
            <SelectItem value="educational">Educational</SelectItem>
            <SelectItem value="humorous">Humorous</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Word Target</Label>
        <Input
          type="number"
          className="h-8 text-xs"
          value={config.wordTarget}
          onChange={(e) => onUpdate({ wordTarget: parseInt(e.target.value) || 2500 })}
        />
      </div>
      <div className="space-y-1 col-span-2">
        <Label className="text-xs">Prompt Presets</Label>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset, i) => (
            <Badge
              key={i}
              variant={config.customPrompt === preset.prompt ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer text-[11px] px-2 py-0.5 transition-colors',
                config.customPrompt === preset.prompt
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-primary/10',
              )}
              onClick={() => applyPreset(preset)}
            >
              {preset.label}
            </Badge>
          ))}
          {config.customPrompt && (
            <Badge
              variant="outline"
              className="cursor-pointer text-[11px] px-2 py-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onUpdate({ customPrompt: '' })}
            >
              ✕ Clear
            </Badge>
          )}
        </div>
      </div>
      <div className="space-y-1 col-span-2">
        <Label className="text-xs">Custom Prompt</Label>
        <Textarea
          className="text-xs resize-none h-20"
          placeholder="Chọn preset ở trên hoặc viết prompt riêng..."
          value={config.customPrompt}
          onChange={(e) => onUpdate({ customPrompt: e.target.value })}
        />
      </div>
    </div>
  );
}

function StoryboardConfig({
  config,
  channelId,
  onUpdate,
}: {
  config: PipelineConfig['storyboard'];
  channelId?: string;
  onUpdate: (u: Partial<PipelineConfig['storyboard']>) => void;
}) {
  const vi = config.visualIdentity;
  const channelPreset = channelId ? CHANNEL_VISUAL_PRESETS[channelId] : undefined;
  const [showVisualId, setShowVisualId] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [savedPreviews, setSavedPreviews] = useState<Array<{ id: string; url: string; prompt: string; createdAt: string }>>([]);

  const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || '') as string;
  const STORAGE_KEY = `storyboard-previews-${channelId || 'default'}`;

  // Load saved previews from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSavedPreviews(JSON.parse(saved));
    } catch { /* empty */ }
  }, [STORAGE_KEY]);

  const applyChannelPreset = () => {
    if (channelPreset) {
      onUpdate({
        style: channelPreset.style,
        visualIdentity: { ...channelPreset },
      });
      setPreviewImage(null); // clear old preview
    }
  };

  // Save a preview image to Supabase storage + localStorage
  const savePreviewImage = async (dataUrl: string, promptText: string) => {
    const id = `preview-${Date.now()}`;
    let finalUrl = dataUrl;

    // Try uploading to Supabase storage
    try {
      const base64Data = dataUrl.split(',')[1];
      if (base64Data) {
        const byteChars = atob(base64Data);
        const byteArray = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
        const blob = new Blob([byteArray], { type: 'image/png' });
        const filePath = `storyboard-previews/${channelId || 'default'}/${id}.png`;

        const { error } = await supabase.storage
          .from('post-images')
          .upload(filePath, blob, { contentType: 'image/png', upsert: false });

        if (!error) {
          const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(filePath);
          if (urlData?.publicUrl) finalUrl = urlData.publicUrl;
        }
      }
    } catch { /* fall back to data URL */ }

    const entry = { id, url: finalUrl, prompt: promptText, createdAt: new Date().toISOString() };
    const updated = [entry, ...savedPreviews].slice(0, 20);
    setSavedPreviews(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { /* quota */ }
  };

  // Delete a saved preview
  const deletePreview = (previewId: string) => {
    const updated = savedPreviews.filter(p => p.id !== previewId);
    setSavedPreviews(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { /* empty */ }
  };

  // Generate AI preview image from current visual identity settings
  const generatePreview = async () => {
    setIsGeneratingPreview(true);
    try {
      // Build comprehensive prompt from visual identity
      const parts: string[] = [];
      parts.push(`A cinematic still frame for a YouTube video thumbnail.`);
      parts.push(`Visual style: ${vi.style.replace(/-/g, ' ')}.`);
      if (vi.colorPalette) parts.push(`Color palette: ${vi.colorPalette}.`);
      if (vi.lighting) parts.push(`Lighting: ${vi.lighting}.`);
      if (vi.cameraStyle) parts.push(`Camera: ${vi.cameraStyle}.`);
      if (vi.characterPresence !== 'none' && vi.characterDesc) {
        parts.push(`Character: ${vi.characterDesc}.`);
      } else if (vi.characterPresence === 'none') {
        parts.push(`No human characters, focus on environment and objects.`);
      }
      if (vi.environment) parts.push(`Environment: ${vi.environment}.`);
      if (vi.moodKeywords) parts.push(`Mood: ${vi.moodKeywords}.`);
      parts.push(`16:9 aspect ratio, photorealistic cinematic quality, film grain.`);
      if (vi.negativePrompt) parts.push(`Do NOT include: ${vi.negativePrompt}.`);

      const promptText = parts.join(' ');

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Generate an image: ${promptText}` }] }],
            generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
          }),
        }
      );

      if (!response.ok) throw new Error('API error');

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const respParts = candidate?.content?.parts || [];

      for (const part of respParts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          setPreviewImage(dataUrl);
          // Auto-save the generated image
          await savePreviewImage(dataUrl, promptText);
          break;
        }
      }
    } catch {
      // Silently fail
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const updateVi = (updates: Partial<VisualIdentity>) => {
    onUpdate({ visualIdentity: { ...vi, ...updates } });
  };

  // Get preview meta for current channel
  const currentPreview = channelId ? CHANNEL_STYLE_PREVIEW[channelId] : null;

  return (
    <div className="space-y-4">
      {/* AI Model + Basic settings */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">AI Model</Label>
          <Select value={config.model} onValueChange={(v) => onUpdate({ model: v })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o-mini">GPT-4o Mini (nhanh, rẻ)</SelectItem>
              <SelectItem value="gpt-4o">GPT-4o (chất lượng)</SelectItem>
              <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
              <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
              <SelectItem value="claude-sonnet">Claude Sonnet</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Scenes</Label>
          <Select value={String(config.scenes)} onValueChange={(v) => onUpdate({ scenes: parseInt(v) })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[6, 8, 10, 12, 15, 20].map(n => (
                <SelectItem key={n} value={String(n)}>{n} scenes</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Duration / Scene</Label>
          <Select value={String(config.duration)} onValueChange={(v) => onUpdate({ duration: parseInt(v) })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[4, 5, 6, 8, 10].map(n => (
                <SelectItem key={n} value={String(n)}>{n}s</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Aspect Ratio</Label>
          <Select value={config.aspectRatio} onValueChange={(v) => onUpdate({ aspectRatio: v })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16:9">16:9 (YouTube)</SelectItem>
              <SelectItem value="9:16">9:16 (Shorts)</SelectItem>
              <SelectItem value="1:1">1:1 (Square)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Visual Style</Label>
          <Select value={config.style} onValueChange={(v) => onUpdate({ style: v, visualIdentity: { ...vi, style: v } })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dark-cinematic">Dark Cinematic</SelectItem>
              <SelectItem value="modern-minimal">Modern Minimal</SelectItem>
              <SelectItem value="bright-modern">Bright Modern</SelectItem>
              <SelectItem value="storytelling">Storytelling / Warm</SelectItem>
              <SelectItem value="anime-style">Anime Style</SelectItem>
              <SelectItem value="documentary">Documentary</SelectItem>
              <SelectItem value="neon-cyberpunk">Neon Cyberpunk</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── AI Preview Section ── */}
      <div className="space-y-2">
        {/* Current channel style info bar */}
        {currentPreview && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-muted/30">
            <div className="flex gap-1">
              {currentPreview.colors.map((c, i) => (
                <div key={i} className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium">{currentPreview.label}</span>
              <span className="text-[10px] text-muted-foreground ml-2">{currentPreview.moodShort}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">{vi.lighting.split(',')[0]}</span>
          </div>
        )}

        {/* AI Preview Card — clean, no gradient */}
        <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
          {previewImage ? (
            <div className="relative group">
              <img
                src={previewImage}
                alt="AI generated style preview"
                className="w-full aspect-video object-cover cursor-pointer"
                onClick={() => setShowFullImage(true)}
              />
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="p-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white transition-colors"
                  onClick={() => setShowFullImage(true)}
                  title="Xem full"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
                <button
                  className="p-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white transition-colors"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = previewImage;
                    a.download = `preview-${channelId}-${Date.now()}.png`;
                    a.click();
                  }}
                  title="Tải về"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <span className="text-[9px] bg-black/50 text-white/80 px-2 py-0.5 rounded-full">AI Preview</span>
                <button
                  className="px-2 py-1 rounded text-[9px] font-medium bg-purple-500/80 hover:bg-purple-500 text-white transition-colors disabled:opacity-50 flex items-center gap-1"
                  onClick={generatePreview}
                  disabled={isGeneratingPreview}
                >
                  <Wand2 className="h-3 w-3" />
                  Regenerate
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              {isGeneratingPreview ? (
                <>
                  <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
                  <span className="text-xs text-muted-foreground">Generating preview...</span>
                </>
              ) : (
                <>
                  <div className="text-4xl">🎬</div>
                  <p className="text-xs text-muted-foreground text-center max-w-[200px]">
                    Generate an AI preview to see how your visual identity looks
                  </p>
                  <button
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-purple-500 hover:bg-purple-600 text-white transition-colors flex items-center gap-1.5"
                    onClick={generatePreview}
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    Generate Preview
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Saved Previews History */}
        {savedPreviews.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Saved Previews ({savedPreviews.length})</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {savedPreviews.map((p) => (
                <div key={p.id} className="relative group shrink-0">
                  <img
                    src={p.url}
                    alt="Saved preview"
                    className="h-14 w-24 object-cover rounded-md border border-border cursor-pointer hover:border-purple-500/50 transition-colors"
                    onClick={() => { setPreviewImage(p.url); setShowFullImage(true); }}
                  />
                  <button
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deletePreview(p.id)}
                    title="Xóa"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                  <span className="absolute bottom-0.5 left-0.5 text-[7px] bg-black/50 text-white/70 px-1 rounded">
                    {new Date(p.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full Image Lightbox */}
      <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-black/95 border-none">
          <DialogTitle className="sr-only">Preview Image</DialogTitle>
          {previewImage && (
            <div className="relative flex items-center justify-center min-h-[300px]">
              <img
                src={previewImage}
                alt="Full preview"
                className="max-w-full max-h-[85vh] object-contain"
              />
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = previewImage;
                    a.download = `preview-${channelId}-${Date.now()}.png`;
                    a.click();
                  }}
                  title="Tải về"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  onClick={() => setShowFullImage(false)}
                  title="Đóng"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Visual Identity Section */}
      <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-purple-500/10 transition-colors"
          onClick={() => setShowVisualId(!showVisualId)}
        >
          <span className="text-xs font-medium flex items-center gap-2">
            🎨 Visual Identity — Channel Consistency
          </span>
          <div className="flex items-center gap-2">
            {channelPreset && (
              <Badge
                variant="outline"
                className="text-[10px] cursor-pointer border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                onClick={(e) => { e.stopPropagation(); applyChannelPreset(); }}
              >
                ↻ Reset to Channel Preset
              </Badge>
            )}
            {showVisualId ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </div>
        </button>

        {showVisualId && (
          <div className="px-3 pb-3 space-y-3 border-t border-purple-500/20 pt-3">
            {/* Character Presence */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Character Presence</Label>
                <Select
                  value={vi.characterPresence}
                  onValueChange={(v: VisualIdentity['characterPresence']) => updateVi({ characterPresence: v })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">🚫 No Character</SelectItem>
                    <SelectItem value="silhouette">👤 Silhouette Only</SelectItem>
                    <SelectItem value="faceless">🧑 Faceless (body only)</SelectItem>
                    <SelectItem value="consistent-character">🎭 Consistent Character</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Lighting</Label>
                <Select value={vi.lighting} onValueChange={(v) => updateVi({ lighting: v })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low-key dramatic, single spotlight">Low-key Dramatic</SelectItem>
                    <SelectItem value="low-key dramatic, single spotlight, rim lighting">Dramatic + Rim Light</SelectItem>
                    <SelectItem value="warm ambient, soft window light, golden hour">Warm Ambient</SelectItem>
                    <SelectItem value="bright studio, even lighting, soft shadows">Bright Studio</SelectItem>
                    <SelectItem value="neon glow, volumetric light, lens flare">Neon Glow</SelectItem>
                    <SelectItem value="natural daylight, soft shadows">Natural Daylight</SelectItem>
                    <SelectItem value="dramatic side lighting, spotlight on subject">Side Spotlight</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Camera + Color */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Camera Style</Label>
                <Select value={vi.cameraStyle} onValueChange={(v) => updateVi({ cameraStyle: v })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow zoom in, close-up focus">Slow Zoom + Close-up</SelectItem>
                    <SelectItem value="slow zoom in, extreme close-up, dolly forward">Extreme Close-up + Dolly</SelectItem>
                    <SelectItem value="medium shot, gentle pan, static wide">Medium Pan + Wide</SelectItem>
                    <SelectItem value="eye-level static, gentle zoom, over-shoulder">Eye-level + Over-shoulder</SelectItem>
                    <SelectItem value="slow dolly forward, close-up on details, wide establishing">Dolly + Wide Establishing</SelectItem>
                    <SelectItem value="slow zoom in, static portrait, fade through black">Portrait + Fade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Color Palette</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="e.g. deep blacks, golden highlights"
                  value={vi.colorPalette}
                  onChange={(e) => updateVi({ colorPalette: e.target.value })}
                />
              </div>
            </div>

            {/* Character Description (only shown if character is present) */}
            {vi.characterPresence !== 'none' && (
              <div className="space-y-1">
                <Label className="text-xs">Character Description</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="e.g. Vietnamese man, 30s, dark hoodie, strong posture"
                  value={vi.characterDesc}
                  onChange={(e) => updateVi({ characterDesc: e.target.value })}
                />
              </div>
            )}

            {/* Environment + Mood */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Environment / Backdrop</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="e.g. dark alleyways, rainy streets"
                  value={vi.environment}
                  onChange={(e) => updateVi({ environment: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mood Keywords</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="cinematic, dramatic, mysterious"
                  value={vi.moodKeywords}
                  onChange={(e) => updateVi({ moodKeywords: e.target.value })}
                />
              </div>
            </div>

            {/* Negative prompt */}
            <div className="space-y-1">
              <Label className="text-xs">Negative Prompt (avoid in images)</Label>
              <Input
                className="h-8 text-xs"
                placeholder="text, watermark, logo, cartoon..."
                value={vi.negativePrompt}
                onChange={(e) => updateVi({ negativePrompt: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Custom Storyboard Prompt */}
      <div className="space-y-1">
        <Label className="text-xs">Custom Storyboard Prompt (optional)</Label>
        <textarea
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs min-h-[60px] resize-y focus:outline-none focus:ring-1 focus:ring-purple-500/50"
          placeholder="Thêm hướng dẫn riêng cho AI Visual Director. VD: Mỗi scene phải có text overlay, focus vào biểu cảm nhân vật..."
          value={config.customPrompt || ''}
          onChange={(e) => onUpdate({ customPrompt: e.target.value })}
        />
      </div>
    </div>
  );
}

function ImageGenConfig({
  config,
  activeRun,
  onUpdate,
}: {
  config: PipelineConfig['imageGen'];
  activeRun?: ActiveRunInfo;
  onUpdate: (u: Partial<PipelineConfig['imageGen']>) => void;
}) {
  const sbResult = extractStoryboardResult(activeRun);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Provider</Label>
          <Select value={config.provider} onValueChange={(v) => onUpdate({ provider: v })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini">Nano Banana (gemini-2.5-flash)</SelectItem>
              <SelectItem value="flux-pro">Flux Pro (coming soon)</SelectItem>
              <SelectItem value="dall-e-3">DALL-E 3 (coming soon)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Quality</Label>
          <Select value={config.quality} onValueChange={(v) => onUpdate({ quality: v })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft (nhanh)</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="hd">HD (chậm hơn)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Negative Prompt</Label>
        <Input
          className="h-8 text-xs"
          value={config.negativePrompt}
          onChange={(e) => onUpdate({ negativePrompt: e.target.value })}
          placeholder="text, watermark, logo, cartoon..."
        />
      </div>

      {/* Show storyboard prompts from Step 2 */}
      {sbResult?.scenes && sbResult.scenes.length > 0 ? (
        <div className="rounded-md border border-orange-500/20 bg-orange-500/5 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-orange-400">📋 Prompts từ Storyboard ({sbResult.scenes.length} scenes)</span>
          </div>
          <ScrollArea className="max-h-36">
            <div className="space-y-1.5">
              {sbResult.scenes.map((s) => (
                <div key={s.scene} className="flex items-start gap-1.5 text-[10px]">
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 shrink-0 mt-0.5">S{s.scene}</Badge>
                  <span className="text-muted-foreground leading-relaxed">{s.prompt}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="rounded-md border border-orange-500/20 bg-orange-500/5 px-3 py-2">
          <p className="text-[10px] text-muted-foreground">
            💡 Chạy Step 2 (Storyboard) trước để tạo visual prompts cho từng scene. Image Gen sẽ tự động sử dụng các prompts đó.
          </p>
        </div>
      )}
    </div>
  );
}

function VoiceoverConfig({
  config,
  onUpdate,
}: {
  config: PipelineConfig['voiceover'];
  onUpdate: (u: Partial<PipelineConfig['voiceover']>) => void;
}) {
  const isElevenLabs = config.engine === 'elevenlabs';
  const isGemini = config.engine === 'gemini-tts';
  const isGoogleTTS = config.engine === 'google-tts';
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">TTS Engine</Label>
          <Select value={config.engine} onValueChange={(v) => {
            // Auto-switch voice to sensible default for the engine
            if (v === 'elevenlabs') onUpdate({ engine: v, voice: 'pNInz6obpgDQGcFmaJgB' });
            else if (v === 'google-tts') onUpdate({ engine: v, voice: 'vi-VN-Neural2-D' });
            else onUpdate({ engine: v, voice: 'Kore' });
          }}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini-tts">Gemini TTS (recommended)</SelectItem>
              <SelectItem value="google-tts">Google Cloud TTS</SelectItem>
              <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Voice</Label>
          {isElevenLabs ? (
            <Select value={config.voice} onValueChange={(v) => onUpdate({ voice: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pNInz6obpgDQGcFmaJgB">Adam (Deep Male)</SelectItem>
                <SelectItem value="21m00Tcm4TlvDq8ikWAM">Rachel (Narrator)</SelectItem>
                <SelectItem value="EXAVITQu4vr4xnSDxMaL">Bella (Warm Female)</SelectItem>
              </SelectContent>
            </Select>
          ) : isGoogleTTS ? (
            <Select value={config.voice} onValueChange={(v) => onUpdate({ voice: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="vi-VN-Neural2-D">🇻🇳 Nam Neural2</SelectItem>
                <SelectItem value="vi-VN-Neural2-A">🇻🇳 Nữ Neural2</SelectItem>
                <SelectItem value="vi-VN-Wavenet-B">🇻🇳 Nam Wavenet</SelectItem>
                <SelectItem value="vi-VN-Wavenet-A">🇻🇳 Nữ Wavenet</SelectItem>
                <SelectItem value="en-US-Neural2-D">🇺🇸 Male Neural2</SelectItem>
                <SelectItem value="en-US-Neural2-F">🇺🇸 Female Neural2</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Select value={config.voice} onValueChange={(v) => onUpdate({ voice: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Kore">Kore (Female, expressive)</SelectItem>
                <SelectItem value="Charon">Charon (Male, deep)</SelectItem>
                <SelectItem value="Fenrir">Fenrir (Male, narrative)</SelectItem>
                <SelectItem value="Aoede">Aoede (Female, warm)</SelectItem>
                <SelectItem value="Puck">Puck (Male, energetic)</SelectItem>
                <SelectItem value="Leda">Leda (Female, calm)</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Speed</Label>
        <Select value={String(config.speed)} onValueChange={(v) => onUpdate({ speed: parseFloat(v) })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.8">0.8x (Chậm)</SelectItem>
            <SelectItem value="0.9">0.9x</SelectItem>
            <SelectItem value="1.0">1.0x (Bình thường)</SelectItem>
            <SelectItem value="1.1">1.1x</SelectItem>
            <SelectItem value="1.2">1.2x (Nhanh)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border border-green-500/20 bg-green-500/5 px-3 py-2">
        <p className="text-[10px] text-muted-foreground">
          🎤 Nếu có Storyboard → tạo audio per-scene từ dialogues. Nếu chỉ có Script → full narration.
          {isGemini && ' Dùng chung Gemini API key — không cần cấu hình thêm.'}
          {isElevenLabs && ' Cần VITE_ELEVENLABS_API_KEY trong .env.'}
          {isGoogleTTS && ' Cần enable Cloud Text-to-Speech API trong GCP Console.'}
        </p>
      </div>
    </div>
  );
}

function AssemblyConfig({
  config,
  onUpdate,
}: {
  config: PipelineConfig['assembly'];
  onUpdate: (u: Partial<PipelineConfig['assembly']>) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-xs">Format</Label>
        <Select value={config.format} onValueChange={(v) => onUpdate({ format: v })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mp4-1080p">MP4 1080p</SelectItem>
            <SelectItem value="mp4-4k">MP4 4K</SelectItem>
            <SelectItem value="webm-1080p">WebM 1080p</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Transitions</Label>
        <Select value={config.transitions} onValueChange={(v) => onUpdate({ transitions: v })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="crossfade">Crossfade</SelectItem>
            <SelectItem value="cut">Hard Cut</SelectItem>
            <SelectItem value="zoom">Zoom</SelectItem>
            <SelectItem value="slide">Slide</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2 col-span-2">
        <Switch
          checked={config.bgMusic}
          onCheckedChange={(checked) => onUpdate({ bgMusic: checked })}
        />
        <Label className="text-xs">Background Music</Label>
      </div>
    </div>
  );
}
