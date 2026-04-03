/**
 * 🚀 BatchPanel — AI topic suggestion + selection + queued batch execution
 *
 * Flow: AI suggests 30-50 topics → User selects → Queued pipeline runs
 * Output: Script TTS-ready + storyboard images per topic
 */

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock,
  Filter,
  Layers,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  Square,
  Trash2,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  type BatchJob,
  cancelBatch,
  deleteBatchJob,
  getBatchJobs,
  hydrateBatchJobs,
  launchBatch,
  onBatchUpdate,
  pauseBatch,
  resumeBatch,
  retryFailed,
  retryItem,
} from '@/services/pipeline/batch-queue';
import { getLibrarySize, rebuildLibraryFromRuns } from '@/services/pipeline/image-library';
import { getRun } from '@/services/pipeline/run-tracker';
import {
  type SuggestTopicsRequest,
  suggestTopics,
  type TopicSuggestion,
} from '@/services/pipeline/topic-suggestion.agent';
import type { PipelineConfig } from './pipeline-types';

interface BatchPanelProps {
  channelId: string;
  channelName: string;
  categories: string[];
  sampleTopics: string[];
  style?: string;
  tone?: string;
  playlist?: string;
  pipelineConfig: PipelineConfig;
  existingTopics?: string[];
  onRunIdClick?: (runId: string) => void;
}

export default function BatchPanel({
  channelId,
  channelName,
  categories,
  sampleTopics,
  style,
  tone,
  playlist,
  pipelineConfig,
  existingTopics,
  onRunIdClick,
}: BatchPanelProps) {
  const { toast } = useToast();

  // ─── Topic Suggestion State ───
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [suggesting, setSuggesting] = useState(false);
  const [customContext, setCustomContext] = useState('');
  const [topicCount, setTopicCount] = useState(40);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // ─── Batch Execution State ───
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
  const [concurrency, setConcurrency] = useState(2);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  // ─── Manual Topics ───
  const [manualMode, setManualMode] = useState(false);
  const [manualTopics, setManualTopics] = useState('');

  // ─── Batch item filters ───
  const [batchItemFilter, setBatchItemFilter] = useState<
    'all' | 'completed' | 'failed' | 'running' | 'queued'
  >('all');
  const [batchItemSearch, setBatchItemSearch] = useState('');

  const isFirstLoad = useRef(true);

  // Hydrate batch jobs on mount + rebuild image library index
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      const jobs = hydrateBatchJobs();
      setBatchJobs(jobs.filter((j) => j.channelId === channelId));

      // Build image library from all completed runs for reuse
      const indexed = rebuildLibraryFromRuns();
      if (indexed > 0) {
        console.log(
          `[BatchPanel] 📚 Image library: indexed ${indexed} new images (total: ${getLibrarySize()})`
        );
      }
    }
  }, [channelId]);

  // Subscribe to batch updates
  useEffect(() => {
    return onBatchUpdate((job) => {
      setBatchJobs((prev) => {
        const idx = prev.findIndex((j) => j.id === job.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...job };
          return next;
        }
        return [...prev, { ...job }];
      });
    });
  }, []);

  // ─── AI Topic Suggestion ───
  const handleSuggest = useCallback(async () => {
    setSuggesting(true);
    try {
      const req: SuggestTopicsRequest = {
        channelId,
        channelName,
        categories,
        tone,
        style,
        sampleTopics,
        existingTopics,
        count: topicCount,
        customContext: customContext.trim() || undefined,
        playlist: playlist || undefined,
      };
      const result = await suggestTopics(req);
      setSuggestions(result.topics);
      setSelectedIds(new Set());
      setFilterCategory(null);
      toast({
        title: `✨ ${result.topics.length} topics đề xuất`,
        description: `Model: ${result.model}`,
      });
    } catch (err) {
      toast({
        title: 'Lỗi đề xuất topic',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setSuggesting(false);
    }
  }, [
    channelId,
    channelName,
    categories,
    tone,
    style,
    sampleTopics,
    existingTopics,
    topicCount,
    customContext,
    playlist,
    toast,
  ]);

  // ─── Selection helpers ───
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredTopics.map((t) => t.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // ─── Filtering ───
  const allCategories = useMemo(() => {
    const cats = new Set(suggestions.map((s) => s.category));
    return Array.from(cats).sort();
  }, [suggestions]);

  const filteredTopics = useMemo(() => {
    let result = suggestions;
    if (filterCategory) {
      result = result.filter((t) => t.category === filterCategory);
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      result = result.filter(
        (t) => t.topic.toLowerCase().includes(q) || t.hook.toLowerCase().includes(q)
      );
    }
    return result;
  }, [suggestions, filterCategory, searchFilter]);

  // ─── Launch Batch ───
  const handleLaunchBatch = () => {
    let topics: string[];

    if (manualMode) {
      topics = manualTopics
        .split('\n')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    } else {
      topics = suggestions.filter((s) => selectedIds.has(s.id)).map((s) => s.topic);
    }

    if (topics.length === 0) {
      toast({
        title: 'Chưa chọn topic',
        description: manualMode ? 'Nhập topic vào ô bên trên' : 'Chọn ít nhất 1 topic từ danh sách',
        variant: 'destructive',
      });
      return;
    }

    // Build base request from pipeline config — script + storyboard + images only
    // Batch mode uses 50 scenes per topic for comprehensive visual coverage
    const BATCH_SCENES = 50;
    const baseRequest: Omit<import('@/services/pipeline/types').GenerateRequest, 'topic'> = {
      channelId,
      scenes: BATCH_SCENES,
      duration: pipelineConfig.storyboard.duration,
      style: pipelineConfig.storyboard.style,
      scriptOnly: false,
      storyboardOnly: false,
      model: pipelineConfig.scriptWriter.model,
      storyboardModel: pipelineConfig.storyboard.model,
      tone: pipelineConfig.scriptWriter.tone,
      customPrompt: pipelineConfig.scriptWriter.customPrompt || undefined,
      storyboardPrompt: pipelineConfig.storyboard.customPrompt || undefined,
      wordTarget: pipelineConfig.scriptWriter.wordTarget,
      aspectRatio: pipelineConfig.storyboard.aspectRatio,
      visualIdentity: pipelineConfig.storyboard.visualIdentity,
      imageGenEnabled: pipelineConfig.imageGen.enabled,
      imageGenProvider: pipelineConfig.imageGen.provider,
      imageGenQuality: pipelineConfig.imageGen.quality,
      // No voiceover — user will use ElevenLabs manually
      voiceoverEnabled: false,
      // No assembly — no video rendering needed
      assemblyEnabled: false,
      playlist: playlist || undefined,
    };

    const job = launchBatch(topics, baseRequest, concurrency);
    setExpandedJob(job.id);

    toast({
      title: `🚀 Batch đã khởi chạy: ${topics.length} topics`,
      description: `Concurrency: ${concurrency} | ${BATCH_SCENES} images/topic | Mode: Script + Images`,
    });

    // Clear selection after launch
    if (!manualMode) {
      setSelectedIds(new Set());
    } else {
      setManualTopics('');
    }
  };

  // ─── Batch Stats ───
  const getJobStats = (job: BatchJob) => {
    const completed = job.items.filter((i) => i.status === 'completed').length;
    const failed = job.items.filter((i) => i.status === 'failed').length;
    const running = job.items.filter((i) => i.status === 'running').length;
    const queued = job.items.filter((i) => i.status === 'queued').length;
    const total = job.items.length;
    const progress = total > 0 ? ((completed + failed) / total) * 100 : 0;
    return { completed, failed, running, queued, total, progress };
  };

  // ─── Get script/images from run results ───
  const getRunOutput = (runId: string) => {
    const run = getRun(runId);
    if (!run?.result?.files) return null;
    const scriptTxt = run.result.files['script.txt'] as string | undefined;
    const imagesJson = run.result.files['images.json'] as
      | { images?: { scene: number; url: string; prompt: string }[]; successCount?: number }
      | undefined;
    return { scriptTxt, imagesJson, run };
  };

  return (
    <div className="space-y-4">
      {/* ─── MODE TOGGLE ─── */}
      <div className="flex items-center gap-2">
        <Button
          variant={!manualMode ? 'default' : 'outline'}
          size="sm"
          className="gap-1"
          onClick={() => setManualMode(false)}
        >
          <Sparkles className="h-3 w-3" />
          AI Đề xuất
        </Button>
        <Button
          variant={manualMode ? 'default' : 'outline'}
          size="sm"
          className="gap-1"
          onClick={() => setManualMode(true)}
        >
          <Layers className="h-3 w-3" />
          Nhập thủ công
        </Button>
      </div>

      {/* ─── AI TOPIC SUGGESTION ─── */}
      {!manualMode && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                AI Đề xuất Topics
              </CardTitle>
              <div className="flex items-center gap-2">
                <Label className="text-[10px] text-muted-foreground">Số lượng:</Label>
                <Input
                  type="number"
                  min={10}
                  max={60}
                  value={topicCount}
                  onChange={(e) => setTopicCount(Number(e.target.value))}
                  className="h-6 w-16 text-xs"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Gợi ý thêm cho AI (không bắt buộc)... VD: tập trung vào chủ đề stoicism, hoặc theo trend gần đây"
              className="resize-none h-16 text-xs"
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
            />
            <Button
              onClick={handleSuggest}
              disabled={suggesting}
              size="sm"
              className="w-full gap-2"
            >
              {suggesting ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  AI đang nghĩ...
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" />
                  Đề xuất {topicCount} topics
                </>
              )}
            </Button>

            {/* ─── TOPIC LIST ─── */}
            {suggestions.length > 0 && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">
                      {selectedIds.size}/{suggestions.length} đã chọn
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 text-[10px] px-2"
                      onClick={selectAll}
                    >
                      Chọn tất cả
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 text-[10px] px-2"
                      onClick={deselectAll}
                    >
                      Bỏ chọn
                    </Button>
                  </div>
                  <Input
                    placeholder="Tìm topic..."
                    className="h-6 w-40 text-xs"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                  />
                </div>

                {/* Category filter */}
                <div className="flex flex-wrap gap-1">
                  <Badge
                    variant={filterCategory === null ? 'default' : 'outline'}
                    className="cursor-pointer text-[10px]"
                    onClick={() => setFilterCategory(null)}
                  >
                    Tất cả ({suggestions.length})
                  </Badge>
                  {allCategories.map((cat) => {
                    const count = suggestions.filter((s) => s.category === cat).length;
                    return (
                      <Badge
                        key={cat}
                        variant={filterCategory === cat ? 'default' : 'outline'}
                        className="cursor-pointer text-[10px]"
                        onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                      >
                        {cat} ({count})
                      </Badge>
                    );
                  })}
                </div>

                {/* Topic list */}
                <ScrollArea className="h-100 border rounded-md">
                  <div className="p-2 space-y-1">
                    {filteredTopics.map((topic, idx) => (
                      <div
                        key={topic.id}
                        className={`flex items-start gap-2 p-2 rounded cursor-pointer hover:bg-muted/80 transition-colors ${
                          selectedIds.has(topic.id) ? 'bg-primary/10 border border-primary/30' : ''
                        }`}
                        onClick={() => toggleSelect(topic.id)}
                      >
                        <Checkbox checked={selectedIds.has(topic.id)} className="mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium leading-snug">
                            <span className="text-muted-foreground mr-1">{idx + 1}.</span>
                            {topic.topic}
                          </p>
                          {topic.hook && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 italic">
                              Hook: &quot;{topic.hook}&quot;
                            </p>
                          )}
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary" className="text-[9px]">
                              {topic.category}
                            </Badge>
                            <span className="text-[9px] text-muted-foreground">
                              ~{topic.estimatedMinutes} phút
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── MANUAL TOPIC INPUT ─── */}
      {manualMode && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Nhập Topics Thủ Công
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder={
                'Mỗi dòng = 1 topic\n\nVí dụ:\nKỷ luật bản thân — Vũ khí mạnh nhất trên đời\nBí mật não bộ — Tại sao bạn luôn trì hoãn\nTâm lý tối — 5 cách người ta đang thao túng bạn'
              }
              className="resize-none h-48 text-sm font-mono"
              value={manualTopics}
              onChange={(e) => setManualTopics(e.target.value)}
            />
            <span className="text-[10px] text-muted-foreground">
              {manualTopics.split('\n').filter((t) => t.trim()).length} topics
            </span>
          </CardContent>
        </Card>
      )}

      {/* ─── LAUNCH CONTROLS ─── */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-xs">Chạy đồng thời:</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={concurrency}
                  onChange={(e) => setConcurrency(Number(e.target.value))}
                  className="h-7 w-14 text-xs"
                />
              </div>
              <Badge variant="outline" className="text-[10px]">
                Output: Script + Images
              </Badge>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              {manualMode
                ? `${manualTopics.split('\n').filter((t) => t.trim()).length} topics`
                : `${selectedIds.size} topics đã chọn`}
            </Badge>
          </div>

          <div className="text-[10px] text-muted-foreground bg-muted/50 rounded p-2">
            <strong>Output mỗi topic:</strong> Script (~{pipelineConfig.scriptWriter.wordTarget} từ
            ≈ 8 phút audio) + Storyboard ({pipelineConfig.storyboard.scenes} scenes)
            {pipelineConfig.imageGen.enabled && ' + Images'}
            <br />
            <strong>Voice:</strong> Thủ công trên ElevenLabs (không chạy TTS tự động)
          </div>

          <Button
            onClick={handleLaunchBatch}
            size="sm"
            className="w-full gap-2"
            disabled={
              manualMode
                ? manualTopics.split('\n').filter((t) => t.trim()).length === 0
                : selectedIds.size === 0
            }
          >
            <Zap className="h-3 w-3" />🚀 Khởi chạy Batch Pipeline
          </Button>
        </CardContent>
      </Card>

      {/* ─── BATCH JOBS DASHBOARD ─── */}
      {batchJobs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Batch Jobs ({batchJobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {batchJobs
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((job) => {
                const stats = getJobStats(job);
                const isExpanded = expandedJob === job.id;

                return (
                  <div key={job.id} className="border rounded-lg overflow-hidden">
                    {/* Job header */}
                    <div
                      className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3 shrink-0" />
                      ) : (
                        <ChevronRight className="h-3 w-3 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{stats.total} topics</span>
                          <BatchStatusBadge status={job.status} />
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(job.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <Progress value={stats.progress} className="h-1.5 mt-1" />
                        <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                          <span className="text-green-500">✓ {stats.completed}</span>
                          {stats.failed > 0 && (
                            <span className="text-red-500">✗ {stats.failed}</span>
                          )}
                          {stats.running > 0 && (
                            <span className="text-blue-500">◉ {stats.running}</span>
                          )}
                          {stats.queued > 0 && <span>⏳ {stats.queued}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {job.status === 'running' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              pauseBatch(job.id);
                            }}
                          >
                            <Pause className="h-3 w-3" />
                          </Button>
                        )}
                        {job.status === 'paused' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              resumeBatch(job.id);
                            }}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        )}
                        {(job.status === 'running' || job.status === 'paused') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelBatch(job.id);
                            }}
                          >
                            <Square className="h-3 w-3" />
                          </Button>
                        )}
                        {(job.status === 'completed' || job.status === 'cancelled') &&
                          stats.failed > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-orange-500"
                              title="Retry failed"
                              onClick={(e) => {
                                e.stopPropagation();
                                retryFailed(job.id);
                              }}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          )}
                        {(job.status === 'completed' || job.status === 'cancelled') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteBatchJob(job.id);
                              setBatchJobs((prev) => prev.filter((j) => j.id !== job.id));
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Expanded items */}
                    {isExpanded && (
                      <div className="border-t">
                        {/* Status filter + search */}
                        <div className="px-3 py-2 flex items-center gap-2 border-b bg-muted/30">
                          <Filter className="h-3 w-3 text-muted-foreground shrink-0" />
                          {(['all', 'completed', 'failed', 'running', 'queued'] as const).map(
                            (f) => {
                              const count =
                                f === 'all'
                                  ? job.items.length
                                  : job.items.filter((i) => i.status === f).length;
                              if (f !== 'all' && count === 0) return null;
                              const colors: Record<string, string> = {
                                all: '',
                                completed: 'text-green-500',
                                failed: 'text-red-500',
                                running: 'text-blue-500',
                                queued: 'text-muted-foreground',
                              };
                              return (
                                <button
                                  key={f}
                                  onClick={() => setBatchItemFilter(f)}
                                  className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                                    batchItemFilter === f
                                      ? 'bg-primary/20 text-primary font-medium'
                                      : `hover:bg-muted ${colors[f] || ''}`
                                  }`}
                                >
                                  {f === 'all'
                                    ? 'Tất cả'
                                    : f === 'completed'
                                      ? '✓'
                                      : f === 'failed'
                                        ? '✗'
                                        : f === 'running'
                                          ? '◉'
                                          : '⏳'}{' '}
                                  {count}
                                </button>
                              );
                            }
                          )}
                          <div className="flex-1" />
                          <div className="relative">
                            <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-muted-foreground" />
                            <Input
                              placeholder="Tìm topic..."
                              value={batchItemSearch}
                              onChange={(e) => setBatchItemSearch(e.target.value)}
                              className="h-5 w-36 text-[10px] pl-5"
                            />
                          </div>
                        </div>
                        <ScrollArea className="max-h-[70vh]">
                          <div className="divide-y">
                            {job.items
                              .filter((item) => {
                                if (batchItemFilter !== 'all' && item.status !== batchItemFilter)
                                  return false;
                                if (batchItemSearch.trim()) {
                                  return item.topic
                                    .toLowerCase()
                                    .includes(batchItemSearch.toLowerCase());
                                }
                                return true;
                              })
                              .map((item) => {
                                const originalIdx = job.items.indexOf(item);
                                return (
                                  <BatchItemRow
                                    key={item.id}
                                    item={item}
                                    index={originalIdx}
                                    jobId={job.id}
                                    onRunClick={onRunIdClick}
                                    onRetryItem={(jId, iId) => retryItem(jId, iId)}
                                    getRunOutput={getRunOutput}
                                  />
                                );
                              })}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Sub-components ───

function BatchStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'running':
      return (
        <Badge className="text-[9px] bg-blue-500/20 text-blue-400 border-blue-500/30">
          <Loader2 className="h-2 w-2 mr-1 animate-spin" />
          Running
        </Badge>
      );
    case 'completed':
      return (
        <Badge className="text-[9px] bg-green-500/20 text-green-400 border-green-500/30">
          <CheckCircle2 className="h-2 w-2 mr-1" />
          Done
        </Badge>
      );
    case 'paused':
      return (
        <Badge className="text-[9px] bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          <Pause className="h-2 w-2 mr-1" />
          Paused
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge className="text-[9px] bg-red-500/20 text-red-400 border-red-500/30">
          <Square className="h-2 w-2 mr-1" />
          Cancelled
        </Badge>
      );
    default:
      return <Badge className="text-[9px]">{status}</Badge>;
  }
}

function BatchItemRow({
  item,
  index,
  jobId,
  onRunClick,
  onRetryItem,
  getRunOutput,
}: {
  item: import('@/services/pipeline/batch-queue').BatchItem;
  index: number;
  jobId: string;
  onRunClick?: (runId: string) => void;
  onRetryItem: (jobId: string, itemId: string) => void;
  getRunOutput: (runId: string) => {
    scriptTxt: string | undefined;
    imagesJson:
      | { images?: { scene: number; url: string; prompt: string }[]; successCount?: number }
      | undefined;
    run: import('@/services/pipeline/types').GenerationRun;
  } | null;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const output = item.runId ? getRunOutput(item.runId) : null;

  const statusIcon = {
    queued: <Clock className="h-3 w-3 text-muted-foreground" />,
    running: <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />,
    completed: <CheckCircle2 className="h-3 w-3 text-green-500" />,
    failed: <AlertCircle className="h-3 w-3 text-red-500" />,
    skipped: <CircleDot className="h-3 w-3 text-muted-foreground" />,
  };

  return (
    <div className="px-3 py-2">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        {statusIcon[item.status]}
        <span className="text-[10px] text-muted-foreground w-5">{index + 1}.</span>
        <span className="text-xs flex-1 truncate">{item.topic}</span>
        {item.status === 'completed' && output && (
          <div className="flex gap-1">
            {output.scriptTxt && (
              <Badge variant="outline" className="text-[9px] text-green-500 border-green-500/30">
                Script ✓
              </Badge>
            )}
            {output.imagesJson?.successCount && output.imagesJson.successCount > 0 && (
              <Badge variant="outline" className="text-[9px] text-blue-500 border-blue-500/30">
                {output.imagesJson.successCount} imgs
              </Badge>
            )}
          </div>
        )}
        {item.status === 'failed' && (
          <span className="text-[9px] text-red-400 truncate max-w-50">{item.error}</span>
        )}
        {(item.status === 'failed' || item.status === 'skipped') && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 text-[9px] px-2 text-orange-500"
            title="Retry"
            onClick={(e) => {
              e.stopPropagation();
              onRetryItem(jobId, item.id);
            }}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
        {item.runId && onRunClick && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 text-[9px] px-2 text-primary"
            onClick={(e) => {
              e.stopPropagation();
              onRunClick(item.runId!);
            }}
          >
            Xem →
          </Button>
        )}
      </div>

      {/* Expanded details: script preview + image thumbnails */}
      {showDetails && output && (
        <div className="mt-2 ml-7 space-y-2">
          {output.scriptTxt && (
            <div className="rounded bg-muted/50 p-2">
              <p className="text-[10px] font-medium mb-1">📝 Script Preview:</p>
              <p className="text-[10px] text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                {output.scriptTxt.substring(0, 500)}...
              </p>
              <p className="text-[9px] text-muted-foreground mt-1">
                {output.scriptTxt.split(/\s+/).length} từ ≈{' '}
                {Math.round(output.scriptTxt.split(/\s+/).length / 190)} phút
              </p>
            </div>
          )}
          {output.imagesJson?.images && output.imagesJson.images.length > 0 && (
            <div className="rounded bg-muted/50 p-2">
              <p className="text-[10px] font-medium mb-1">
                🖼️ Images ({output.imagesJson.images.length}):
              </p>
              <div className="grid grid-cols-6 gap-1">
                {output.imagesJson.images.slice(0, 12).map((img) => (
                  <div key={img.scene} className="aspect-video rounded overflow-hidden bg-black">
                    <img
                      src={img.url}
                      alt={`Scene ${img.scene}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
