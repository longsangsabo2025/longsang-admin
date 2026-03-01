/**
 * Pipeline Stage Manager
 * View, review, and fine-tune each pipeline stage output
 * 
 * Features:
 * - Stage-by-stage output viewer with expandable content
 * - Cost & token breakdown per stage
 * - Model/temperature/maxTokens configuration per agent
 * - Script editor for manual review before TTS
 * - Audio preview player
 * - Quality metrics (word count, section coverage, voice DNA compliance)
 */
import { useState, useEffect, useRef } from 'react';
import { usePipelineRunDetail } from '@/hooks/usePipelineData';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  ChevronDown,
  ChevronRight,
  Settings2,
  Play,
  FileText,
  BarChart3,
  Clock,
  DollarSign,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Download,
  RefreshCw,
  Eye,
  Edit3,
  Mic,
  Film,
  Search,
  Brain,
  Pen,
  Upload,
  SkipForward,
} from 'lucide-react';

interface StageResult {
  name: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  output?: string;
  tokens?: { input: number; output: number };
  cost?: number;
  durationMs?: number;
  model?: string;
}

interface AgentConfig {
  id: string;
  name: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

const STAGE_ICONS: Record<string, React.ReactNode> = {
  'harvester': <Search className="h-4 w-4" />,
  'brain-curator': <Brain className="h-4 w-4" />,
  'script-writer': <Pen className="h-4 w-4" />,
  'voice-producer': <Mic className="h-4 w-4" />,
  'visual-director': <Eye className="h-4 w-4" />,
  'video-assembler': <Film className="h-4 w-4" />,
  'publisher': <Upload className="h-4 w-4" />,
};

const STAGE_NAMES: Record<string, string> = {
  'harvester': 'Harvest Content',
  'brain-curator': 'Brain Curation',
  'script-writer': 'Script Writing',
  'voice-producer': 'Voice Production',
  'visual-director': 'Visual Direction',
  'video-assembler': 'Video Assembly',
  'publisher': 'Publishing',
};

const AVAILABLE_MODELS = [
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', cost: '$0.10/1M in' },
  { value: 'gemini-2.5-flash-preview-04-17', label: 'Gemini 2.5 Flash', cost: '$0.15/1M in' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', cost: '$0.15/1M in' },
  { value: 'gpt-4o', label: 'GPT-4o', cost: '$2.50/1M in' },
];

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600 dark:bg-gray-800',
  running: 'bg-blue-100 text-blue-700 dark:bg-blue-900',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900',
  skipped: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900',
};

function ScriptQualityMetrics({ output }: { output: string }) {
  if (!output) return null;

  let parsed: { stats?: { totalWords?: number; sectionCount?: number; estimatedMinutes?: string } } = {};
  try { parsed = JSON.parse(output); } catch { /* not JSON */ }

  const wordCount = parsed.stats?.totalWords || output.split(/\s+/).length;
  const sectionCount = parsed.stats?.sectionCount || 0;
  const minutes = parsed.stats?.estimatedMinutes || (wordCount / 150).toFixed(1);
  const minTarget = 1800;
  const wordProgress = Math.min(100, (wordCount / minTarget) * 100);

  const voiceDNAPatterns = [
    'bánh xe hamster', 'ma trận', 'lò xay thịt', 'nô lệ tài chính',
    'Đứng dậy đi', 'Sự thật phũ phàng', 'phần nổi của tảng băng',
  ];
  const dnaHits = voiceDNAPatterns.filter(p => output.toLowerCase().includes(p.toLowerCase())).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Words</span>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${wordCount >= minTarget ? 'text-green-600' : 'text-yellow-600'}`}>
            {wordCount.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">/ {minTarget}</span>
        </div>
        <Progress value={wordProgress} className="h-1.5" />
      </div>
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Duration</span>
        <span className="text-lg font-bold block">~{minutes} min</span>
      </div>
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Sections</span>
        <span className="text-lg font-bold block">{sectionCount}/7</span>
      </div>
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Voice DNA</span>
        <span className={`text-lg font-bold block ${dnaHits >= 3 ? 'text-green-600' : 'text-yellow-600'}`}>
          {dnaHits}/{voiceDNAPatterns.length}
        </span>
      </div>
    </div>
  );
}

function StageCard({ stage, index, isExpanded, onToggle, pipelineId, onAction }: {
  stage: StageResult;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  pipelineId?: string;
  onAction?: () => void;
}) {
  const [showConfig, setShowConfig] = useState(false);
  const [editedOutput, setEditedOutput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const icon = STAGE_ICONS[stage.agentId] || <Zap className="h-4 w-4" />;
  const stageName = STAGE_NAMES[stage.agentId] || stage.name;
  const statusStyle = STATUS_STYLES[stage.status] || STATUS_STYLES.pending;

  const isScriptStage = stage.agentId === 'script-writer';
  const isAudioStage = stage.agentId === 'voice-producer';
  const isVideoStage = stage.agentId === 'video-assembler';
  const isJsonStage = !isAudioStage && !isVideoStage;
  const isFailed = stage.status === 'failed';

  const saveAndContinue = async (fromNext: boolean) => {
    if (!pipelineId) return;
    setSaving(true);
    setActionMsg('');
    try {
      const res = await fetch('/api/youtube-crew/stage-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipelineId,
          stageIndex: index,
          output: editedOutput,
          continueFromNext: fromNext,
        }),
      });
      if (res.ok) {
        setActionMsg(fromNext ? 'Saved! Pipeline continuing from next stage...' : 'Output saved to checkpoint.');
        setIsEditing(false);
        onAction?.();
      } else {
        setActionMsg('Save failed: ' + (await res.text()));
      }
    } catch (e) { setActionMsg('Error: ' + String(e)); }
    finally { setSaving(false); }
  };

  const rerunStage = async () => {
    if (!pipelineId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/youtube-crew/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipelineId, fromStage: index }),
      });
      if (res.ok) { setActionMsg('Re-running stage...'); onAction?.(); }
      else setActionMsg('Failed: ' + (await res.text()));
    } catch (e) { setActionMsg('Error: ' + String(e)); }
    finally { setSaving(false); }
  };

  const skipStage = async () => {
    if (!pipelineId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/youtube-crew/stage-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipelineId,
          stageIndex: index,
          output: editedOutput || stage.output || '{"skipped": true}',
          continueFromNext: true,
          skip: true,
        }),
      });
      if (res.ok) { setActionMsg('Stage skipped. Continuing...'); onAction?.(); }
    } catch (e) { setActionMsg('Error: ' + String(e)); }
    finally { setSaving(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pipelineId) return;
    setSaving(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pipelineId', pipelineId);
    formData.append('stageIndex', String(index));
    formData.append('stageAgent', stage.agentId);
    try {
      const res = await fetch('/api/youtube-crew/stage-upload', {
        method: 'POST', body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setActionMsg(`Uploaded: ${data.filename}. Ready to continue.`);
        setEditedOutput(JSON.stringify(data.output, null, 2));
        onAction?.();
      }
    } catch (e) { setActionMsg('Upload error: ' + String(e)); }
    finally { setSaving(false); }
  };

  return (
    <Card className={`transition-all ${stage.status === 'running' ? 'ring-2 ring-blue-500' : ''} ${isFailed ? 'ring-1 ring-red-500/50' : ''}`}>
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="text-xs font-mono w-5">{index + 1}</span>
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>

        <div className="flex items-center gap-2 flex-1">
          {icon}
          <span className="font-medium text-sm">{stageName}</span>
          <Badge className={`text-[10px] ${statusStyle}`}>
            {stage.status === 'running' && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
            {stage.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
            {stage.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
            {stage.status}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {stage.model && <span className="hidden md:inline">{stage.model}</span>}
          {stage.tokens && (
            <span className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              {(stage.tokens.input + stage.tokens.output).toLocaleString()}
            </span>
          )}
          {stage.cost !== undefined && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />${stage.cost.toFixed(4)}
            </span>
          )}
          {stage.durationMs !== undefined && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />{(stage.durationMs / 1000).toFixed(1)}s
            </span>
          )}
        </div>

        <Button variant="ghost" size="sm"
          onClick={(e) => { e.stopPropagation(); setShowConfig(!showConfig); }}>
          <Settings2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Expanded: Output Viewer + Manual Override */}
      {isExpanded && (
        <CardContent className="pt-0 border-t">
          {isScriptStage && stage.output && <ScriptQualityMetrics output={stage.output} />}

          {/* Action Bar — Manual Override Controls */}
          <div className="flex items-center gap-2 mt-3 mb-2 p-2 bg-muted/30 rounded-lg">
            <span className="text-xs font-medium text-muted-foreground mr-auto">Manual Override:</span>

            {isJsonStage && (
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                onClick={() => { setIsEditing(!isEditing); if (!isEditing) setEditedOutput(stage.output || ''); }}>
                <Edit3 className="h-3 w-3" />{isEditing ? 'Cancel Edit' : 'Edit Output'}
              </Button>
            )}

            {(isAudioStage || isVideoStage) && (
              <>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                  onClick={() => fileRef.current?.click()}>
                  <Upload className="h-3 w-3" />
                  {isAudioStage ? 'Upload Audio' : 'Upload Video'}
                </Button>
                <input ref={fileRef} type="file" className="hidden"
                  accept={isAudioStage ? 'audio/*' : 'video/*'}
                  onChange={handleFileUpload} />
              </>
            )}

            <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
              disabled={saving} onClick={rerunStage}>
              <RefreshCw className="h-3 w-3" />Re-run
            </Button>

            {isFailed && (
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-yellow-500/50 text-yellow-600"
                disabled={saving} onClick={skipStage}>
                <SkipForward className="h-3 w-3" />Skip & Continue
              </Button>
            )}

            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>

          {actionMsg && (
            <div className={`text-xs px-3 py-1.5 rounded mb-2 ${actionMsg.includes('Error') || actionMsg.includes('fail') ? 'bg-red-500/10 text-red-600' : 'bg-green-500/10 text-green-600'}`}>
              {actionMsg}
            </div>
          )}

          {/* Output Content */}
          {stage.output && (
            <div className="mt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Output</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm"
                    onClick={() => navigator.clipboard.writeText(stage.output || '')}>
                    <Copy className="h-3 w-3 mr-1" />Copy
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-3 w-3 mr-1" />Export
                  </Button>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <Textarea value={editedOutput} onChange={(e) => setEditedOutput(e.target.value)}
                    className="min-h-[400px] font-mono text-xs" />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button variant="outline" size="sm" disabled={saving}
                      onClick={() => saveAndContinue(false)}>
                      {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                      Save Only
                    </Button>
                    <Button size="sm" disabled={saving}
                      onClick={() => saveAndContinue(true)}>
                      {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                      Save & Continue Pipeline
                    </Button>
                  </div>
                </div>
              ) : (
                <pre className="bg-muted/50 rounded-lg p-4 text-xs font-mono max-h-[500px] overflow-auto whitespace-pre-wrap">
                  {stage.output.length > 5000
                    ? stage.output.substring(0, 5000) + '\n\n... (truncated)'
                    : stage.output}
                </pre>
              )}
            </div>
          )}

          {/* No output yet — allow manual input */}
          {!stage.output && (isFailed || stage.status === 'pending') && (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-muted-foreground">Stage chưa có output. Bạn có thể nhập thủ công hoặc upload file:</p>
              <Textarea value={editedOutput} onChange={(e) => setEditedOutput(e.target.value)}
                placeholder="Paste JSON output here, or upload a file above..."
                className="min-h-[200px] font-mono text-xs" />
              <div className="flex justify-end gap-2">
                <Button size="sm" disabled={saving || !editedOutput.trim()}
                  onClick={() => saveAndContinue(true)}>
                  {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                  Inject & Continue Pipeline
                </Button>
              </div>
            </div>
          )}

          {/* Audio Player */}
          {isAudioStage && stage.output && (
            <div className="mt-3"><AudioPreview output={stage.output} /></div>
          )}
        </CardContent>
      )}

      {showConfig && (
        <CardContent className="pt-0 border-t bg-muted/30">
          <AgentConfigPanel agentId={stage.agentId} currentModel={stage.model} />
        </CardContent>
      )}
    </Card>
  );
}

function AudioPreview({ output }: { output: string }) {
  let audioData: { finalAudio?: string; audioPaths?: string[] } = {};
  try { audioData = JSON.parse(output); } catch { return null; }

  if (audioData.finalAudio) {
    return (
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <Mic className="h-5 w-5 text-blue-500" />
        <div className="flex-1">
          <p className="text-sm font-medium">Final Audio</p>
          <p className="text-xs text-muted-foreground">{audioData.finalAudio}</p>
        </div>
        <Button variant="outline" size="sm">
          <Play className="h-3 w-3 mr-1" />
          Play
        </Button>
      </div>
    );
  }

  return null;
}

function AgentConfigPanel({ agentId, currentModel }: { agentId: string; currentModel?: string }) {
  const [model, setModel] = useState(currentModel || 'gemini-2.0-flash');
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState(4096);

  const configs: Record<string, { temp: number; tokens: number }> = {
    'harvester': { temp: 0.3, tokens: 4096 },
    'brain-curator': { temp: 0.5, tokens: 4096 },
    'script-writer': { temp: 0.85, tokens: 16384 },
    'voice-producer': { temp: 0.3, tokens: 1024 },
    'visual-director': { temp: 0.7, tokens: 4096 },
    'video-assembler': { temp: 0.3, tokens: 1024 },
    'publisher': { temp: 0.5, tokens: 4096 },
  };

  const defaultConfig = configs[agentId] || { temp: 0.7, tokens: 4096 };

  return (
    <div className="space-y-4 py-3">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Settings2 className="h-4 w-4" />
        Agent Configuration — {STAGE_NAMES[agentId]}
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium">Model</label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_MODELS.map(m => (
                <SelectItem key={m.value} value={m.value}>
                  <span>{m.label}</span>
                  <span className="text-muted-foreground ml-2">{m.cost}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium">
            Temperature: {temperature[0].toFixed(2)}
          </label>
          <Slider
            value={temperature}
            onValueChange={setTemperature}
            min={0}
            max={1}
            step={0.05}
            className="mt-2"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Precise (0)</span>
            <span>Default ({defaultConfig.temp})</span>
            <span>Creative (1)</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium">Max Tokens: {maxTokens.toLocaleString()}</label>
          <Slider
            value={[maxTokens]}
            onValueChange={([v]) => setMaxTokens(v)}
            min={512}
            max={32768}
            step={512}
            className="mt-2"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm">
          Reset to Default
        </Button>
        <Button size="sm">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Save Config
        </Button>
      </div>
    </div>
  );
}

interface Props {
  runId?: string;
  onClose?: () => void;
}

export function PipelineStageManager({ runId, onClose }: Props) {
  const { run, loading, refresh } = usePipelineRunDetail(runId);
  const [expandedStages, setExpandedStages] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!runId) return;
    const channel = supabase
      .channel(`pipeline-checkpoint-${runId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pipeline_checkpoints',
        filter: `pipeline_id=eq.${runId}`,
      }, () => {
        refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [runId, refresh]);

  const toggleStage = (index: number) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const expandAll = () => {
    if (run) {
      setExpandedStages(new Set(run.stages.map((_, i) => i)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pipeline Stage Manager
          </h2>
          {run && (
            <p className="text-sm text-muted-foreground mt-1">
              Run: <code className="font-mono">{run.pipelineId}</code>
              {' · '}
              <span>{new Date(run.startedAt).toLocaleString('vi-VN')}</span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            <Eye className="h-4 w-4 mr-1" />
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Bar */}
      {run && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Status</div>
            <div className="text-lg font-bold capitalize">{run.status}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Total Cost</div>
            <div className="text-lg font-bold text-green-600">${run.totalCost.toFixed(4)}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Duration</div>
            <div className="text-lg font-bold">{(run.totalDurationMs / 1000).toFixed(1)}s</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Stages</div>
            <div className="text-lg font-bold">
              {run.stages.filter(s => s.status === 'completed').length}/{run.stages.length}
            </div>
          </Card>
        </div>
      )}

      {/* Pipeline Progress Bar */}
      {run && (
        <div className="flex gap-1 items-center">
          {run.stages.map((stage, i) => {
            const colors: Record<string, string> = {
              completed: 'bg-green-500',
              running: 'bg-blue-500 animate-pulse',
              failed: 'bg-red-500',
              skipped: 'bg-yellow-500',
              pending: 'bg-gray-300 dark:bg-gray-700',
            };
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className={`h-2 w-full rounded-full ${colors[stage.status] || colors.pending}`} />
                <span className="text-[9px] text-muted-foreground truncate max-w-full">
                  {STAGE_NAMES[stage.agentId]?.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Stage Cards */}
      {run ? (
        <div className="space-y-2">
          {run.stages.map((stage, index) => (
            <StageCard
              key={index}
              stage={stage}
              index={index}
              isExpanded={expandedStages.has(index)}
              onToggle={() => toggleStage(index)}
              pipelineId={run.pipelineId}
              onAction={refresh}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground">No pipeline run selected.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Trigger a new run or select from history.
          </p>
        </Card>
      )}
    </div>
  );
}

export default PipelineStageManager;
