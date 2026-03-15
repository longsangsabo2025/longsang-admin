/**
 * 🧩 Pipeline Builder Types — modular node-based pipeline system
 *
 * Defines the schema for draggable nodes, edges, and templates
 * that can be visually connected on a React Flow canvas.
 */

// ─── Node Categories ─────────────────────────────────────

export type NodeCategory = 'trigger' | 'agent' | 'transform' | 'logic' | 'output';

export type TriggerNodeType = 'topic-input' | 'transcript-input' | 'batch-input';
export type AgentNodeType = 'script-writer' | 'storyboard' | 'image-gen' | 'voiceover' | 'assembly';
export type TransformNodeType = 'script-cleaner' | 'prompt-enhancer';
export type LogicNodeType = 'condition' | 'merge' | 'delay';
export type OutputNodeType = 'file-export' | 'youtube-upload';

export type PipelineNodeType =
  | TriggerNodeType
  | AgentNodeType
  | TransformNodeType
  | LogicNodeType
  | OutputNodeType;

// ─── Node Registry (metadata for the palette) ───────────

export interface NodeRegistryEntry {
  type: PipelineNodeType;
  category: NodeCategory;
  label: string;
  icon: string; // emoji icon
  description: string;
  color: string; // tailwind bg class
  inputs: PortDef[];
  outputs: PortDef[];
  defaultConfig: Record<string, unknown>;
}

export interface PortDef {
  id: string;
  label: string;
  type: 'data' | 'trigger' | 'control'; // what flows through
}

// ─── Pipeline Graph ─────────────────────────────────────

export interface PipelineNodeData {
  type: PipelineNodeType;
  label: string;
  icon: string;
  color: string;
  category: NodeCategory;
  config: Record<string, unknown>;
  /** Runtime: current execution status */
  runStatus?: 'idle' | 'running' | 'completed' | 'failed' | 'skipped';
  /** Runtime: error message if failed */
  runError?: string;
}

export interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** Which channel this template belongs to (null = global) */
  channelId: string | null;
  /** React Flow nodes (serialized) */
  nodes: SerializedNode[];
  /** React Flow edges (serialized) */
  edges: SerializedEdge[];
  createdAt: string;
  updatedAt: string;
  /** Whether this is a built-in template (cannot be deleted) */
  isBuiltIn?: boolean;
}

export interface SerializedNode {
  id: string;
  type: string; // React Flow node type key
  position: { x: number; y: number };
  data: PipelineNodeData;
}

export interface SerializedEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  animated?: boolean;
}

// ─── Execution ──────────────────────────────────────────

export interface ExecutionPlan {
  /** Ordered layers — nodes in the same layer can run in parallel */
  layers: ExecutionLayer[];
  /** Original template used */
  templateId: string;
}

export interface ExecutionLayer {
  /** Nodes to execute in this layer (parallel) */
  nodeIds: string[];
}

export interface NodeExecutionResult {
  nodeId: string;
  status: 'completed' | 'failed' | 'skipped';
  output?: Record<string, unknown>;
  error?: string;
  durationMs: number;
}

// ─── Node Registry ──────────────────────────────────────

export const NODE_REGISTRY: NodeRegistryEntry[] = [
  // ─── Triggers ───
  {
    type: 'topic-input',
    category: 'trigger',
    label: 'Topic Input',
    icon: '💡',
    description: 'Nhập topic / chủ đề cho video',
    color: 'bg-amber-500',
    inputs: [],
    outputs: [{ id: 'topic', label: 'Topic', type: 'data' }],
    defaultConfig: { topic: '', channelId: '' },
  },
  {
    type: 'transcript-input',
    category: 'trigger',
    label: 'Transcript Input',
    icon: '📄',
    description: 'Chọn transcript có sẵn làm nguồn',
    color: 'bg-amber-500',
    inputs: [],
    outputs: [{ id: 'transcript', label: 'Transcript', type: 'data' }],
    defaultConfig: { transcriptId: '', query: '' },
  },
  {
    type: 'batch-input',
    category: 'trigger',
    label: 'Batch Topics',
    icon: '📋',
    description: 'Nhiều topic chạy tuần tự / song song',
    color: 'bg-amber-600',
    inputs: [],
    outputs: [{ id: 'topic', label: 'Topic', type: 'data' }],
    defaultConfig: { topics: [], parallel: false, staggerMs: 2000 },
  },

  // ─── AI Agents ───
  {
    type: 'script-writer',
    category: 'agent',
    label: 'Script Writer',
    icon: '✍️',
    description: 'AI viết script (+ storyboard nếu bật Full Pipeline)',
    color: 'bg-blue-500',
    inputs: [{ id: 'topic', label: 'Topic / Transcript', type: 'data' }],
    outputs: [
      { id: 'script', label: 'Script', type: 'data' },
      { id: 'storyboard', label: 'Storyboard (Full Pipeline)', type: 'data' },
    ],
    defaultConfig: {
      model: 'gemini-2.5-flash',
      tone: 'dark-philosophical',
      wordTarget: 2500,
      customPrompt: '',
      fullPipelineMode: true,
      scenes: 12,
      duration: 6,
      style: 'dark-cinematic',
    },
  },
  {
    type: 'storyboard',
    category: 'agent',
    label: 'Storyboard',
    icon: '🎬',
    description: 'Chia scenes + tạo visual prompts (tự skip nếu Script Writer đã tạo)',
    color: 'bg-purple-500',
    inputs: [{ id: 'script', label: 'Script', type: 'data' }],
    outputs: [{ id: 'storyboard', label: 'Storyboard', type: 'data' }],
    defaultConfig: {
      model: 'gpt-4o-mini',
      scenes: 12,
      duration: 6,
      style: 'dark-cinematic',
      aspectRatio: '16:9',
    },
  },
  {
    type: 'image-gen',
    category: 'agent',
    label: 'Image Generation',
    icon: '🖼️',
    description: 'Tạo hình ảnh cho từng scene',
    color: 'bg-pink-500',
    inputs: [{ id: 'storyboard', label: 'Storyboard', type: 'data' }],
    outputs: [{ id: 'images', label: 'Images', type: 'data' }],
    defaultConfig: { provider: 'gemini', quality: 'standard' },
  },
  {
    type: 'voiceover',
    category: 'agent',
    label: 'Voiceover / TTS',
    icon: '🎤',
    description: 'Tạo giọng đọc từ script',
    color: 'bg-green-500',
    inputs: [{ id: 'script', label: 'Script', type: 'data' }],
    outputs: [{ id: 'audio', label: 'Audio', type: 'data' }],
    defaultConfig: { engine: 'gemini-tts', voice: 'Kore', speed: 1.0 },
  },
  {
    type: 'assembly',
    category: 'agent',
    label: 'Video Assembly',
    icon: '🎥',
    description: 'Ghép images + audio → video',
    color: 'bg-red-500',
    inputs: [
      { id: 'images', label: 'Images', type: 'data' },
      { id: 'audio', label: 'Audio', type: 'data' },
      { id: 'storyboard', label: 'Storyboard', type: 'data' },
    ],
    outputs: [{ id: 'video', label: 'Video', type: 'data' }],
    defaultConfig: { format: 'mp4-1080p', transitions: 'crossfade', bgMusic: true, fps: 24 },
  },

  // ─── Transforms ───
  {
    type: 'script-cleaner',
    category: 'transform',
    label: 'Script Cleaner',
    icon: '🧹',
    description: 'Tối ưu script cho TTS (bỏ heading, note)',
    color: 'bg-teal-500',
    inputs: [{ id: 'script', label: 'Script', type: 'data' }],
    outputs: [{ id: 'script', label: 'Cleaned Script', type: 'data' }],
    defaultConfig: { removeHeadings: true, removeNotes: true },
  },
  {
    type: 'prompt-enhancer',
    category: 'transform',
    label: 'Prompt Enhancer',
    icon: '✨',
    description: 'Nâng cấp image prompts với AI',
    color: 'bg-teal-500',
    inputs: [{ id: 'storyboard', label: 'Storyboard', type: 'data' }],
    outputs: [{ id: 'storyboard', label: 'Enhanced Storyboard', type: 'data' }],
    defaultConfig: { enhanceLevel: 'medium' },
  },

  // ─── Logic ───
  {
    type: 'condition',
    category: 'logic',
    label: 'Condition',
    icon: '🔀',
    description: 'Rẽ nhánh dựa trên điều kiện',
    color: 'bg-orange-500',
    inputs: [{ id: 'data', label: 'Input', type: 'data' }],
    outputs: [
      { id: 'true', label: 'True', type: 'control' },
      { id: 'false', label: 'False', type: 'control' },
    ],
    defaultConfig: { field: 'wordCount', operator: '>', value: 1500 },
  },
  {
    type: 'merge',
    category: 'logic',
    label: 'Merge',
    icon: '🔗',
    description: 'Gộp nhiều nhánh lại',
    color: 'bg-orange-500',
    inputs: [
      { id: 'input-1', label: 'Input 1', type: 'data' },
      { id: 'input-2', label: 'Input 2', type: 'data' },
    ],
    outputs: [{ id: 'merged', label: 'Merged', type: 'data' }],
    defaultConfig: {},
  },
  {
    type: 'delay',
    category: 'logic',
    label: 'Delay',
    icon: '⏱️',
    description: 'Chờ N giây trước khi tiếp tục',
    color: 'bg-orange-400',
    inputs: [{ id: 'data', label: 'Input', type: 'data' }],
    outputs: [{ id: 'data', label: 'Output', type: 'data' }],
    defaultConfig: { delayMs: 3000 },
  },

  // ─── Outputs ───
  {
    type: 'file-export',
    category: 'output',
    label: 'File Export',
    icon: '💾',
    description: 'Lưu kết quả ra file (JSON, MP4, etc.)',
    color: 'bg-gray-600',
    inputs: [{ id: 'data', label: 'Input', type: 'data' }],
    outputs: [],
    defaultConfig: { exportFormat: 'json', filename: '' },
  },
  {
    type: 'youtube-upload',
    category: 'output',
    label: 'YouTube Upload',
    icon: '📺',
    description: 'Upload video lên YouTube',
    color: 'bg-red-600',
    inputs: [{ id: 'video', label: 'Video', type: 'data' }],
    outputs: [],
    defaultConfig: { title: '', description: '', tags: [], privacy: 'private' },
  },
];

/** Lookup helper */
export function getNodeRegistryEntry(type: PipelineNodeType): NodeRegistryEntry | undefined {
  return NODE_REGISTRY.find((n) => n.type === type);
}

/** Get nodes by category */
export function getNodesByCategory(category: NodeCategory): NodeRegistryEntry[] {
  return NODE_REGISTRY.filter((n) => n.category === category);
}
