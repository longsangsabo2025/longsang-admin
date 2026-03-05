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
  RotateCcw,
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
import { cn } from '@/lib/utils';
import { type PipelineConfig, DEFAULT_PIPELINE } from './pipeline-types';

export type { PipelineConfig } from './pipeline-types';

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
  },
  {
    key: 'storyboard',
    icon: Film,
    title: 'Storyboard',
    subtitle: 'Chia scenes + tạo visual prompts',
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
    estimate: '~15s',
    status: 'available',
  },
  {
    key: 'imageGen',
    icon: Image,
    title: 'Image Generation',
    subtitle: 'Tạo hình ảnh cho từng scene',
    color: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
    estimate: '~2-5min',
    status: 'coming-soon',
  },
  {
    key: 'voiceover',
    icon: Mic,
    title: 'Voiceover / TTS',
    subtitle: 'Tạo giọng đọc từ script',
    color: 'text-green-500 bg-green-500/10 border-green-500/30',
    estimate: '~1-3min',
    status: 'coming-soon',
  },
  {
    key: 'assembly',
    icon: Sparkles,
    title: 'Video Assembly',
    subtitle: 'Ghép images + audio → video hoàn chỉnh',
    color: 'text-red-500 bg-red-500/10 border-red-500/30',
    estimate: '~3-8min',
    status: 'coming-soon',
  },
];

// ─── MAIN COMPONENT ────────────────────────────────────────

// ─── RUN STATUS TYPES ───────────────────────────────────

export type StepStatus = 'idle' | 'running' | 'completed' | 'failed' | 'skipped';

export interface RunLog {
  t: number;
  level: string;
  msg: string;
}

export interface ActiveRunInfo {
  status: 'running' | 'completed' | 'failed';
  logs: RunLog[];
  error?: string;
  result?: {
    outputDir: string;
    files: Record<string, unknown>;
  };
}

// Map log messages to pipeline steps by keyword matching
const STEP_LOG_PATTERNS: Record<keyof PipelineConfig, RegExp> = {
  scriptWriter: /script|writing|gemini|gpt|claude|model|prompt|topic|transcript|words?\s*count|generating/i,
  storyboard: /storyboard|scene|visual|hailuo|prompt.*gen|motion|transition/i,
  imageGen: /image|flux|dall-e|midjourney|render.*image|generating.*image/i,
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

  // Classify each log to a step
  const unclassified: RunLog[] = [];
  for (const log of run.logs) {
    const step = classifyLog(log.msg);
    if (step && result[step]) {
      result[step].logs.push(log);
    } else {
      unclassified.push(log);
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
  if (!run || run.status !== 'completed') return null;
  const result = (run as { result?: { files?: Record<string, unknown> } }).result;
  if (!result?.files) return null;
  const sbJson = result.files['storyboard.json'] as { scenes?: { scene: number; dialogue: string; prompt: string; motion: string; transition: string }[] } | undefined;
  const promptsTxt = result.files['prompts.txt'] as string | undefined;
  const storyboardMd = result.files['storyboard.md'] as string | undefined;
  if (!sbJson && !promptsTxt && !storyboardMd) return null;
  return { scenes: sbJson?.scenes, sceneCount: sbJson?.scenes?.length, promptsTxt, storyboardMd };
}

interface PipelineRoadmapProps {
  channelId?: string;
  channelStyle?: string;
  onRun: (config: PipelineConfig) => void;
  onRunStep?: (step: string, config: PipelineConfig) => void;
  isRunning: boolean;
  activeRun?: ActiveRunInfo;
}

const STORAGE_KEY = 'yt-pipeline-config';

function loadSavedConfig(channelStyle?: string): PipelineConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PipelineConfig;
      // Ensure all keys exist (in case we add new steps later)
      return { ...DEFAULT_PIPELINE, ...parsed };
    }
  } catch { /* ignore corrupt data */ }
  return {
    ...DEFAULT_PIPELINE,
    storyboard: {
      ...DEFAULT_PIPELINE.storyboard,
      style: channelStyle || DEFAULT_PIPELINE.storyboard.style,
    },
  };
}

export default function PipelineRoadmap({ channelId, channelStyle, onRun, onRunStep, isRunning, activeRun }: PipelineRoadmapProps) {
  const [config, setConfig] = useState<PipelineConfig>(() => loadSavedConfig(channelStyle));
  const [expandedStep, setExpandedStep] = useState<string | null>('scriptWriter');

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

            return (
              <div key={step.key} className="relative">
                <Card
                  className={cn(
                    'transition-all duration-200',
                    isStepFailed && 'border-red-500/50 bg-red-500/5',
                    isStepRunning && 'border-blue-500/50 bg-blue-500/5 ring-1 ring-blue-500/20',
                    isStepDone && 'border-green-500/30 bg-green-500/5',
                    !isStepRunning && !isStepDone && !isStepFailed && stepConfig.enabled && !isComingSoon
                      ? 'border-l-2 border-l-current ' + step.color.split(' ')[0].replace('text-', 'border-l-')
                      : '',
                    !stepConfig.enabled && 'opacity-60',
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
                        stepConfig.enabled && !isComingSoon ? step.color : 'bg-muted text-muted-foreground',
                      )}>
                        {isStepRunning ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : isStepDone ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : isStepFailed ? (
                          <XCircle className="h-5 w-5" />
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
                          {!isStepRunning && !isStepDone && !isStepFailed && (
                            <span className="text-[10px] text-muted-foreground">{step.estimate}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {isStepRunning && hasLogs
                            ? stepStatus.logs[stepStatus.logs.length - 1].msg
                            : step.subtitle}
                        </p>
                      </div>

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
                    {isExpanded && stepConfig.enabled && !isComingSoon && (
                      <div className="mt-3 pt-3 border-t space-y-3">
                        <StepConfig
                          stepKey={step.key}
                          config={config}
                          channelId={channelId}
                          onUpdate={updateStep}
                        />
                        {/* Per-step Run Button */}
                        {onRunStep && !isStepRunning && (
                          <Button
                            size="sm"
                            variant={isStepDone ? 'outline' : 'default'}
                            className="w-full"
                            disabled={isRunning}
                            onClick={() => onRunStep(step.key, config)}
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
                      return (
                        <div className="mt-3 pt-3 border-t">
                          <div className="rounded bg-purple-950/30 border border-purple-500/20 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-purple-400">🎬 Storyboard Result</span>
                              <div className="flex gap-2 text-[10px] text-muted-foreground">
                                {sbResult.sceneCount && <Badge variant="outline" className="text-[10px]">{sbResult.sceneCount} scenes</Badge>}
                              </div>
                            </div>
                            {sbResult.scenes && sbResult.scenes.length > 0 && (
                              <ScrollArea className="max-h-40">
                                <div className="space-y-1.5">
                                  {sbResult.scenes.slice(0, 4).map((s) => (
                                    <div key={s.scene} className="text-[11px] space-y-0.5">
                                      <div className="flex items-center gap-1.5">
                                        <Badge variant="secondary" className="text-[9px] px-1 py-0 shrink-0">Scene {s.scene}</Badge>
                                        <span className="text-muted-foreground truncate">{s.dialogue?.slice(0, 80)}{s.dialogue?.length > 80 ? '...' : ''}</span>
                                      </div>
                                      <p className="text-purple-300/70 pl-12 truncate text-[10px]">🎨 {s.prompt?.slice(0, 100)}{s.prompt?.length > 100 ? '...' : ''}</p>
                                    </div>
                                  ))}
                                  {sbResult.scenes.length > 4 && (
                                    <p className="text-[10px] text-muted-foreground pl-12">... +{sbResult.scenes.length - 4} more scenes</p>
                                  )}
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
  onUpdate,
}: {
  stepKey: keyof PipelineConfig;
  config: PipelineConfig;
  channelId?: string;
  onUpdate: <K extends keyof PipelineConfig>(step: K, updates: Partial<PipelineConfig[K]>) => void;
}) {
  switch (stepKey) {
    case 'scriptWriter':
      return <ScriptWriterConfig config={config.scriptWriter} channelId={channelId} onUpdate={(u) => onUpdate('scriptWriter', u)} />;
    case 'storyboard':
      return <StoryboardConfig config={config.storyboard} onUpdate={(u) => onUpdate('storyboard', u)} />;
    case 'imageGen':
      return <ImageGenConfig config={config.imageGen} onUpdate={(u) => onUpdate('imageGen', u)} />;
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
  onUpdate,
}: {
  config: PipelineConfig['storyboard'];
  onUpdate: (u: Partial<PipelineConfig['storyboard']>) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
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
        <Label className="text-xs">Visual Style</Label>
        <Select value={config.style} onValueChange={(v) => onUpdate({ style: v })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dark-cinematic">Dark Cinematic</SelectItem>
            <SelectItem value="modern-minimal">Modern Minimal</SelectItem>
            <SelectItem value="anime-style">Anime Style</SelectItem>
            <SelectItem value="documentary">Documentary</SelectItem>
            <SelectItem value="neon-cyberpunk">Neon Cyberpunk</SelectItem>
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
    </div>
  );
}

function ImageGenConfig({
  config,
  onUpdate,
}: {
  config: PipelineConfig['imageGen'];
  onUpdate: (u: Partial<PipelineConfig['imageGen']>) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-xs">Provider</Label>
        <Select value={config.provider} onValueChange={(v) => onUpdate({ provider: v })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hailuo-2.3">Hailuo 2.3</SelectItem>
            <SelectItem value="flux-pro">Flux Pro</SelectItem>
            <SelectItem value="dall-e-3">DALL-E 3</SelectItem>
            <SelectItem value="midjourney">Midjourney API</SelectItem>
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
      <div className="space-y-1 col-span-2">
        <Label className="text-xs">Negative Prompt</Label>
        <Input
          className="h-8 text-xs"
          value={config.negativePrompt}
          onChange={(e) => onUpdate({ negativePrompt: e.target.value })}
        />
      </div>
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
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-xs">TTS Engine</Label>
        <Select value={config.engine} onValueChange={(v) => onUpdate({ engine: v })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
            <SelectItem value="google-tts">Google TTS</SelectItem>
            <SelectItem value="openai-tts">OpenAI TTS</SelectItem>
            <SelectItem value="xtts-v2">XTTS v2 (local)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Voice</Label>
        <Select value={config.voice} onValueChange={(v) => onUpdate({ voice: v })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default-vi">Default Vietnamese</SelectItem>
            <SelectItem value="deep-male-vi">Deep Male (VI)</SelectItem>
            <SelectItem value="narrator-en">Narrator (EN)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Speed</Label>
        <Select value={String(config.speed)} onValueChange={(v) => onUpdate({ speed: parseFloat(v) })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.8">0.8x (Chậm)</SelectItem>
            <SelectItem value="1.0">1.0x (Bình thường)</SelectItem>
            <SelectItem value="1.2">1.2x (Nhanh)</SelectItem>
          </SelectContent>
        </Select>
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
