/**
 * ⚙️ NodeConfigPanel — Right panel for editing selected node's config
 *
 * Includes Scene Calculator for script-writer (full pipeline) and storyboard nodes.
 */
import type { Node } from '@xyflow/react';
import type { PipelineNodeData } from '@/services/pipeline/pipeline-builder-types';

interface NodeConfigPanelProps {
  selectedNode: Node | null;
  onUpdateConfig: (nodeId: string, config: Record<string, unknown>) => void;
  onDeleteNode: (nodeId: string) => void;
}

// Config field definitions per node type
type FieldType = 'text' | 'number' | 'select' | 'textarea' | 'toggle';
interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
}
const CONFIG_FIELDS: Record<string, FieldDef[]> = {
  'topic-input': [
    {
      key: 'topic',
      label: 'Topic',
      type: 'text',
      placeholder: 'VD: Tại sao 90% người giàu thức dậy lúc 5h sáng',
    },
    { key: 'channelId', label: 'Channel ID', type: 'text' },
  ],
  'transcript-input': [
    { key: 'transcriptId', label: 'Transcript ID', type: 'text' },
    { key: 'query', label: 'Search Query', type: 'text' },
  ],
  'batch-input': [{ key: 'staggerMs', label: 'Stagger (ms)', type: 'number' }],
  'script-writer': [
    { key: 'fullPipelineMode', label: '⚡ Full Pipeline (Script + Storyboard)', type: 'toggle' },
    {
      key: 'model',
      label: 'Model',
      type: 'select',
      options: [
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-2.0-flash',
        'gpt-4o',
        'gpt-4o-mini',
        'claude-3.5-sonnet',
      ],
    },
    {
      key: 'tone',
      label: 'Tone',
      type: 'select',
      options: ['dark-philosophical', 'storytelling', 'punchy-hook', 'educational', 'motivational'],
    },
    { key: 'wordTarget', label: 'Word Target', type: 'number' },
    {
      key: 'scenes',
      label: 'Scenes',
      type: 'select',
      options: ['8', '10', '12', '15', '20', '25', '30', '40', '50', '60', '80', '100'],
    },
    {
      key: 'duration',
      label: 'Duration (s/scene)',
      type: 'select',
      options: ['3', '4', '5', '6', '7', '8', '10', '12', '15'],
    },
    {
      key: 'style',
      label: 'Visual Style',
      type: 'select',
      options: [
        'dark-cinematic',
        'storytelling',
        'bright-modern',
        'neon-cyberpunk',
        'minimal-clean',
        'vintage-film',
      ],
    },
    {
      key: 'customPrompt',
      label: 'Custom Prompt',
      type: 'textarea',
      placeholder: 'Nhập prompt tuỳ chỉnh...',
    },
  ],
  storyboard: [
    {
      key: 'model',
      label: 'Model',
      type: 'select',
      options: [
        'gpt-4o-mini',
        'gpt-4o',
        'gemini-2.0-flash',
        'gemini-2.5-flash',
        'claude-3.5-sonnet',
      ],
    },
    {
      key: 'scenes',
      label: 'Scenes',
      type: 'select',
      options: ['8', '10', '12', '15', '20', '25', '30', '40', '50', '60', '80', '100'],
    },
    {
      key: 'duration',
      label: 'Duration (s/scene)',
      type: 'select',
      options: ['3', '4', '5', '6', '7', '8', '10', '12', '15'],
    },
    {
      key: 'style',
      label: 'Visual Style',
      type: 'select',
      options: [
        'dark-cinematic',
        'storytelling',
        'bright-modern',
        'neon-cyberpunk',
        'minimal-clean',
        'vintage-film',
      ],
    },
    { key: 'aspectRatio', label: 'Aspect Ratio', type: 'select', options: ['16:9', '9:16', '1:1'] },
  ],
  'image-gen': [
    {
      key: 'provider',
      label: 'Provider',
      type: 'select',
      options: ['gemini', 'flux', 'dall-e', 'comfy'],
    },
    { key: 'quality', label: 'Quality', type: 'select', options: ['standard', 'high', 'ultra'] },
  ],
  voiceover: [
    {
      key: 'engine',
      label: 'Engine',
      type: 'select',
      options: ['gemini-tts', 'elevenlabs', 'edge-tts', 'fish-speech'],
    },
    { key: 'voice', label: 'Voice', type: 'text' },
    { key: 'speed', label: 'Speed', type: 'number' },
  ],
  assembly: [
    {
      key: 'format',
      label: 'Format',
      type: 'select',
      options: ['mp4-1080p', 'mp4-1080p-vertical', 'webm-vp9'],
    },
    {
      key: 'transitions',
      label: 'Transitions',
      type: 'select',
      options: ['crossfade', 'fade', 'cut', 'whip-pan'],
    },
    { key: 'fps', label: 'FPS', type: 'select', options: ['24', '30', '60'] },
  ],
  'script-cleaner': [
    { key: 'removeHeadings', label: 'Remove Headings', type: 'select', options: ['true', 'false'] },
    { key: 'removeNotes', label: 'Remove Notes', type: 'select', options: ['true', 'false'] },
  ],
  'prompt-enhancer': [
    {
      key: 'enhanceLevel',
      label: 'Enhance Level',
      type: 'select',
      options: ['low', 'medium', 'high'],
    },
  ],
  condition: [
    { key: 'field', label: 'Field', type: 'text' },
    {
      key: 'operator',
      label: 'Operator',
      type: 'select',
      options: ['>', '<', '==', '!=', '>=', '<='],
    },
    { key: 'value', label: 'Value', type: 'text' },
  ],
  merge: [
    {
      key: 'strategy',
      label: 'Merge Strategy',
      type: 'select',
      options: ['wait-all', 'first-wins', 'concat'],
    },
  ],
  delay: [{ key: 'delayMs', label: 'Delay (ms)', type: 'number' }],
  'file-export': [
    {
      key: 'exportFormat',
      label: 'Format',
      type: 'select',
      options: ['json', 'mp4', 'mp3', 'zip', 'txt'],
    },
    { key: 'filename', label: 'Filename', type: 'text' },
  ],
  'youtube-upload': [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Mô tả video...' },
    {
      key: 'privacy',
      label: 'Privacy',
      type: 'select',
      options: ['private', 'unlisted', 'public'],
    },
  ],
};

export function NodeConfigPanel({
  selectedNode,
  onUpdateConfig,
  onDeleteNode,
}: NodeConfigPanelProps) {
  if (!selectedNode) {
    return (
      <div className="w-[260px] border-l border-border bg-card/50 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-2xl mb-2">⚙️</p>
          <p className="text-xs">Click vào node để chỉnh sửa</p>
        </div>
      </div>
    );
  }

  const data = selectedNode.data as unknown as PipelineNodeData;
  const isFullPipeline = data.type === 'script-writer' && Boolean(data.config.fullPipelineMode);
  // For script-writer without full-pipeline, hide scene/duration/style fields
  const fields = (CONFIG_FIELDS[data.type] || []).filter((field) => {
    if (data.type === 'script-writer' && !isFullPipeline) {
      return !['scenes', 'duration', 'style'].includes(field.key);
    }
    return true;
  });

  const updateField = (key: string, value: unknown) => {
    onUpdateConfig(selectedNode.id, { ...data.config, [key]: value });
  };

  // Scene Calculator for script-writer (full pipeline) or storyboard
  const showSceneCalc =
    (data.type === 'script-writer' && isFullPipeline) || data.type === 'storyboard';
  const wordTarget = Number(data.config.wordTarget) || 2500;
  const scenes = Number(data.config.scenes) || 12;
  const duration = Number(data.config.duration) || 6;
  const estAudioSec = Math.round((wordTarget / 250) * 60);
  const estMinutes = Math.round(wordTarget / 250);
  const recommendedScenes = Math.max(8, Math.round(estAudioSec / duration));
  const currentCoverage = scenes * duration;
  const mismatch = Math.abs(currentCoverage - estAudioSec) > estAudioSec * 0.2;

  return (
    <div className="w-[260px] border-l border-border bg-card/50 overflow-y-auto">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xl">{data.icon}</span>
          <div>
            <div className="text-sm font-semibold text-foreground">{data.label}</div>
            <div className="text-[10px] text-muted-foreground capitalize">
              {data.category} · {data.type}
            </div>
            {isFullPipeline && (
              <div className="text-[9px] text-blue-400 font-medium mt-0.5">
                ⚡ Full Pipeline Mode
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scene Calculator */}
      {showSceneCalc && (
        <div className="p-3 border-b border-border">
          <div
            className={`rounded-lg border p-2.5 space-y-2 ${
              mismatch
                ? 'border-yellow-500/40 bg-yellow-500/5'
                : 'border-green-500/30 bg-green-500/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold">
                {mismatch ? '⚠️' : '✅'} Scene Calculator
              </span>
              {scenes !== recommendedScenes && (
                <button
                  className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors font-medium"
                  onClick={() => updateField('scenes', recommendedScenes)}
                >
                  🎯 {recommendedScenes} scenes
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1 text-center">
              <div>
                <p className="text-sm font-bold tabular-nums">{estMinutes}</p>
                <p className="text-[8px] text-muted-foreground">phút audio</p>
                <p className="text-[8px] text-muted-foreground/60">{wordTarget} từ</p>
              </div>
              <div>
                <p className="text-sm font-bold tabular-nums">{duration}s</p>
                <p className="text-[8px] text-muted-foreground">/ ảnh</p>
              </div>
              <div>
                <p
                  className={`text-sm font-bold tabular-nums ${mismatch ? 'text-yellow-400' : 'text-green-400'}`}
                >
                  {scenes}
                </p>
                <p className="text-[8px] text-muted-foreground">scenes</p>
              </div>
            </div>
            {mismatch && (
              <p className="text-[9px] text-yellow-400 leading-tight">
                ⚡ {scenes}×{duration}s = {currentCoverage}s — audio ~{estAudioSec}s.
                {scenes < recommendedScenes
                  ? ` Cần ${recommendedScenes} scenes.`
                  : ` Giảm xuống ${recommendedScenes}.`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Config fields */}
      <div className="p-3 space-y-3">
        {fields.length === 0 ? (
          <p className="text-xs text-muted-foreground">No configurable options</p>
        ) : (
          fields.map((field) => (
            <div key={field.key}>
              <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                {field.label}
              </label>
              {field.type === 'toggle' ? (
                <button
                  className={`w-full text-xs rounded-md px-2 py-1.5 text-left font-medium transition-colors border ${
                    data.config[field.key]
                      ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                      : 'bg-muted border-border text-muted-foreground'
                  }`}
                  onClick={() => updateField(field.key, !data.config[field.key])}
                >
                  {data.config[field.key] ? '✅ ON' : '❌ OFF'}
                </button>
              ) : field.type === 'select' ? (
                <select
                  className="w-full text-xs bg-muted border border-border rounded-md px-2 py-1.5 text-foreground"
                  value={String(data.config[field.key] ?? '')}
                  onChange={(e) =>
                    updateField(
                      field.key,
                      field.key === 'scenes' || field.key === 'duration'
                        ? Number(e.target.value)
                        : e.target.value
                    )
                  }
                >
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : field.type === 'number' ? (
                <input
                  type="number"
                  className="w-full text-xs bg-muted border border-border rounded-md px-2 py-1.5 text-foreground"
                  value={Number(data.config[field.key]) || 0}
                  onChange={(e) => updateField(field.key, parseFloat(e.target.value) || 0)}
                />
              ) : field.type === 'textarea' ? (
                <textarea
                  className="w-full text-xs bg-muted border border-border rounded-md px-2 py-1.5 text-foreground resize-y min-h-[60px]"
                  value={String(data.config[field.key] ?? '')}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                  rows={3}
                />
              ) : (
                <input
                  type="text"
                  className="w-full text-xs bg-muted border border-border rounded-md px-2 py-1.5 text-foreground"
                  value={String(data.config[field.key] ?? '')}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                />
              )}
            </div>
          ))
        )}
      </div>

      {/* Status */}
      {data.runStatus && data.runStatus !== 'idle' && (
        <div className="px-3 py-2 border-t border-border">
          <div
            className={`text-xs font-medium ${
              data.runStatus === 'completed'
                ? 'text-green-500'
                : data.runStatus === 'running'
                  ? 'text-blue-500'
                  : data.runStatus === 'failed'
                    ? 'text-red-500'
                    : 'text-muted-foreground'
            }`}
          >
            Status: {data.runStatus}
          </div>
          {data.runError && <div className="text-[10px] text-red-500 mt-1">{data.runError}</div>}
        </div>
      )}

      {/* Delete */}
      <div className="p-3 border-t border-border">
        <button
          className="w-full text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg py-2 transition-colors"
          onClick={() => onDeleteNode(selectedNode.id)}
        >
          🗑️ Delete Node
        </button>
      </div>
    </div>
  );
}
