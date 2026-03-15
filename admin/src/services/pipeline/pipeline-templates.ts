/**
 * 📦 Pipeline Templates — CRUD + built-in templates
 *
 * Manages saved pipeline configurations (localStorage + optional Supabase).
 * Includes 6 pre-built templates for common YouTube workflows.
 */
import type { PipelineTemplate, SerializedEdge, SerializedNode } from './pipeline-builder-types';

const STORAGE_KEY = 'pipeline-builder-templates';

// ─── Built-in Templates ─────────────────────────────────

function makeEdge(
  source: string,
  target: string,
  sourceHandle = 'output',
  targetHandle = 'input'
): SerializedEdge {
  return {
    id: `e-${source}-${target}`,
    source,
    target,
    sourceHandle,
    targetHandle,
    animated: true,
  };
}

/** 1. Standard Full Pipeline — Topic → Script → Storyboard → Images → Voice → Assembly */
const FULL_PIPELINE: PipelineTemplate = {
  id: 'tpl-full-pipeline',
  name: 'Full Video Pipeline',
  description: 'Pipeline đầy đủ: Topic → Script → Storyboard → Images → Voiceover → Assembly',
  icon: '🎬',
  channelId: null,
  isBuiltIn: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  nodes: [
    {
      id: 'n-topic',
      type: 'trigger-node',
      position: { x: 50, y: 250 },
      data: {
        type: 'topic-input',
        label: 'Topic Input',
        icon: '💡',
        color: 'bg-amber-500',
        category: 'trigger',
        config: { topic: '', channelId: '' },
      },
    },
    {
      id: 'n-script',
      type: 'agent-node',
      position: { x: 300, y: 250 },
      data: {
        type: 'script-writer',
        label: 'Script Writer',
        icon: '✍️',
        color: 'bg-blue-500',
        category: 'agent',
        config: {
          model: 'gemini-2.5-flash',
          tone: 'dark-philosophical',
          wordTarget: 2500,
          fullPipelineMode: true,
          scenes: 12,
          duration: 6,
          style: 'dark-cinematic',
        },
      },
    },
    {
      id: 'n-board',
      type: 'agent-node',
      position: { x: 550, y: 250 },
      data: {
        type: 'storyboard',
        label: 'Storyboard',
        icon: '🎬',
        color: 'bg-purple-500',
        category: 'agent',
        config: { model: 'gpt-4o-mini', scenes: 12, duration: 6, style: 'dark-cinematic' },
      },
    },
    {
      id: 'n-img',
      type: 'agent-node',
      position: { x: 800, y: 150 },
      data: {
        type: 'image-gen',
        label: 'Image Gen',
        icon: '🖼️',
        color: 'bg-pink-500',
        category: 'agent',
        config: { provider: 'gemini', quality: 'standard' },
      },
    },
    {
      id: 'n-voice',
      type: 'agent-node',
      position: { x: 800, y: 350 },
      data: {
        type: 'voiceover',
        label: 'Voiceover',
        icon: '🎤',
        color: 'bg-green-500',
        category: 'agent',
        config: { engine: 'gemini-tts', voice: 'Kore', speed: 1.0 },
      },
    },
    {
      id: 'n-asm',
      type: 'agent-node',
      position: { x: 1100, y: 250 },
      data: {
        type: 'assembly',
        label: 'Assembly',
        icon: '🎥',
        color: 'bg-red-500',
        category: 'agent',
        config: { format: 'mp4-1080p', transitions: 'crossfade', fps: 24 },
      },
    },
    {
      id: 'n-export',
      type: 'output-node',
      position: { x: 1350, y: 250 },
      data: {
        type: 'file-export',
        label: 'Export',
        icon: '💾',
        color: 'bg-gray-600',
        category: 'output',
        config: { exportFormat: 'mp4' },
      },
    },
  ],
  edges: [
    makeEdge('n-topic', 'n-script'),
    makeEdge('n-script', 'n-board'),
    makeEdge('n-board', 'n-img'),
    makeEdge('n-board', 'n-voice'), // parallel: images + voice
    makeEdge('n-img', 'n-asm'),
    makeEdge('n-voice', 'n-asm'),
    makeEdge('n-asm', 'n-export'),
  ],
};

/** 2. Script Only — Quick script generation */
const SCRIPT_ONLY: PipelineTemplate = {
  id: 'tpl-script-only',
  name: 'Script Only',
  description: 'Chỉ viết script — nhanh, nhẹ, dùng cho research / outline',
  icon: '✍️',
  channelId: null,
  isBuiltIn: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  nodes: [
    {
      id: 'n-topic',
      type: 'trigger-node',
      position: { x: 50, y: 200 },
      data: {
        type: 'topic-input',
        label: 'Topic Input',
        icon: '💡',
        color: 'bg-amber-500',
        category: 'trigger',
        config: { topic: '' },
      },
    },
    {
      id: 'n-script',
      type: 'agent-node',
      position: { x: 350, y: 200 },
      data: {
        type: 'script-writer',
        label: 'Script Writer',
        icon: '✍️',
        color: 'bg-blue-500',
        category: 'agent',
        config: { model: 'gemini-2.5-flash', tone: 'dark-philosophical', wordTarget: 2500 },
      },
    },
    {
      id: 'n-export',
      type: 'output-node',
      position: { x: 650, y: 200 },
      data: {
        type: 'file-export',
        label: 'Export',
        icon: '💾',
        color: 'bg-gray-600',
        category: 'output',
        config: { exportFormat: 'json' },
      },
    },
  ],
  edges: [makeEdge('n-topic', 'n-script'), makeEdge('n-script', 'n-export')],
};

/** 3. YouTube Shorts — Short-form vertical video */
const YOUTUBE_SHORTS: PipelineTemplate = {
  id: 'tpl-youtube-shorts',
  name: 'YouTube Shorts',
  description: 'Video ngắn dọc 9:16 — 60s, 5 scenes, fast pace',
  icon: '📱',
  channelId: null,
  isBuiltIn: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  nodes: [
    {
      id: 'n-topic',
      type: 'trigger-node',
      position: { x: 50, y: 200 },
      data: {
        type: 'topic-input',
        label: 'Topic',
        icon: '💡',
        color: 'bg-amber-500',
        category: 'trigger',
        config: { topic: '' },
      },
    },
    {
      id: 'n-script',
      type: 'agent-node',
      position: { x: 300, y: 200 },
      data: {
        type: 'script-writer',
        label: 'Short Script',
        icon: '✍️',
        color: 'bg-blue-500',
        category: 'agent',
        config: {
          model: 'gemini-2.5-flash',
          tone: 'punchy-hook',
          wordTarget: 150,
          fullPipelineMode: true,
          scenes: 5,
          duration: 3,
          style: 'bright-modern',
        },
      },
    },
    {
      id: 'n-board',
      type: 'agent-node',
      position: { x: 550, y: 200 },
      data: {
        type: 'storyboard',
        label: 'Storyboard',
        icon: '🎬',
        color: 'bg-purple-500',
        category: 'agent',
        config: { scenes: 5, duration: 3, aspectRatio: '9:16', style: 'bright-modern' },
      },
    },
    {
      id: 'n-img',
      type: 'agent-node',
      position: { x: 800, y: 120 },
      data: {
        type: 'image-gen',
        label: 'Image Gen',
        icon: '🖼️',
        color: 'bg-pink-500',
        category: 'agent',
        config: { provider: 'gemini', quality: 'standard' },
      },
    },
    {
      id: 'n-voice',
      type: 'agent-node',
      position: { x: 800, y: 280 },
      data: {
        type: 'voiceover',
        label: 'Voiceover',
        icon: '🎤',
        color: 'bg-green-500',
        category: 'agent',
        config: { engine: 'gemini-tts', voice: 'Kore', speed: 1.1 },
      },
    },
    {
      id: 'n-asm',
      type: 'agent-node',
      position: { x: 1050, y: 200 },
      data: {
        type: 'assembly',
        label: 'Assembly (9:16)',
        icon: '🎥',
        color: 'bg-red-500',
        category: 'agent',
        config: { format: 'mp4-1080p-vertical', transitions: 'cut', fps: 30 },
      },
    },
  ],
  edges: [
    makeEdge('n-topic', 'n-script'),
    makeEdge('n-script', 'n-board'),
    makeEdge('n-board', 'n-img'),
    makeEdge('n-board', 'n-voice'),
    makeEdge('n-img', 'n-asm'),
    makeEdge('n-voice', 'n-asm'),
  ],
};

/** 4. Podcast Episode — Audio-only pipeline */
const PODCAST_EPISODE: PipelineTemplate = {
  id: 'tpl-podcast',
  name: 'Podcast Episode',
  description: 'Chỉ tạo script + voiceover — xuất file audio',
  icon: '🎙️',
  channelId: null,
  isBuiltIn: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  nodes: [
    {
      id: 'n-topic',
      type: 'trigger-node',
      position: { x: 50, y: 200 },
      data: {
        type: 'topic-input',
        label: 'Topic',
        icon: '💡',
        color: 'bg-amber-500',
        category: 'trigger',
        config: { topic: '' },
      },
    },
    {
      id: 'n-script',
      type: 'agent-node',
      position: { x: 300, y: 200 },
      data: {
        type: 'script-writer',
        label: 'Script Writer',
        icon: '✍️',
        color: 'bg-blue-500',
        category: 'agent',
        config: { model: 'gemini-2.5-flash', tone: 'storytelling', wordTarget: 3000 },
      },
    },
    {
      id: 'n-clean',
      type: 'transform-node',
      position: { x: 550, y: 200 },
      data: {
        type: 'script-cleaner',
        label: 'Clean for TTS',
        icon: '🧹',
        color: 'bg-teal-500',
        category: 'transform',
        config: { removeHeadings: true, removeNotes: true },
      },
    },
    {
      id: 'n-voice',
      type: 'agent-node',
      position: { x: 800, y: 200 },
      data: {
        type: 'voiceover',
        label: 'Voiceover',
        icon: '🎤',
        color: 'bg-green-500',
        category: 'agent',
        config: { engine: 'elevenlabs', voice: 'pNInz6obpgDQGcFmaJgB', speed: 0.95 },
      },
    },
    {
      id: 'n-export',
      type: 'output-node',
      position: { x: 1050, y: 200 },
      data: {
        type: 'file-export',
        label: 'Export Audio',
        icon: '💾',
        color: 'bg-gray-600',
        category: 'output',
        config: { exportFormat: 'mp3' },
      },
    },
  ],
  edges: [
    makeEdge('n-topic', 'n-script'),
    makeEdge('n-script', 'n-clean'),
    makeEdge('n-clean', 'n-voice'),
    makeEdge('n-voice', 'n-export'),
  ],
};

/** 5. Visual Storyboard — Images only, no video */
const VISUAL_STORYBOARD: PipelineTemplate = {
  id: 'tpl-visual-storyboard',
  name: 'Visual Storyboard',
  description: 'Script → Storyboard → Images — tạo bộ ảnh minh hoạ, không ghép video',
  icon: '🖼️',
  channelId: null,
  isBuiltIn: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  nodes: [
    {
      id: 'n-topic',
      type: 'trigger-node',
      position: { x: 50, y: 200 },
      data: {
        type: 'topic-input',
        label: 'Topic',
        icon: '💡',
        color: 'bg-amber-500',
        category: 'trigger',
        config: { topic: '' },
      },
    },
    {
      id: 'n-script',
      type: 'agent-node',
      position: { x: 300, y: 200 },
      data: {
        type: 'script-writer',
        label: 'Script Writer',
        icon: '✍️',
        color: 'bg-blue-500',
        category: 'agent',
        config: { model: 'gemini-2.5-flash', wordTarget: 2000 },
      },
    },
    {
      id: 'n-board',
      type: 'agent-node',
      position: { x: 550, y: 200 },
      data: {
        type: 'storyboard',
        label: 'Storyboard',
        icon: '🎬',
        color: 'bg-purple-500',
        category: 'agent',
        config: { scenes: 15, duration: 8, style: 'dark-cinematic' },
      },
    },
    {
      id: 'n-enhance',
      type: 'transform-node',
      position: { x: 800, y: 200 },
      data: {
        type: 'prompt-enhancer',
        label: 'Enhance Prompts',
        icon: '✨',
        color: 'bg-teal-500',
        category: 'transform',
        config: { enhanceLevel: 'high' },
      },
    },
    {
      id: 'n-img',
      type: 'agent-node',
      position: { x: 1050, y: 200 },
      data: {
        type: 'image-gen',
        label: 'Image Gen',
        icon: '🖼️',
        color: 'bg-pink-500',
        category: 'agent',
        config: { provider: 'gemini', quality: 'high' },
      },
    },
    {
      id: 'n-export',
      type: 'output-node',
      position: { x: 1300, y: 200 },
      data: {
        type: 'file-export',
        label: 'Export Images',
        icon: '💾',
        color: 'bg-gray-600',
        category: 'output',
        config: { exportFormat: 'zip' },
      },
    },
  ],
  edges: [
    makeEdge('n-topic', 'n-script'),
    makeEdge('n-script', 'n-board'),
    makeEdge('n-board', 'n-enhance'),
    makeEdge('n-enhance', 'n-img'),
    makeEdge('n-img', 'n-export'),
  ],
};

/** 6. Batch Factory — Process multiple topics */
const BATCH_FACTORY: PipelineTemplate = {
  id: 'tpl-batch-factory',
  name: 'Batch Factory',
  description: 'Nhập nhiều topic → chạy hàng loạt Script + Storyboard',
  icon: '🏭',
  channelId: null,
  isBuiltIn: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  nodes: [
    {
      id: 'n-batch',
      type: 'trigger-node',
      position: { x: 50, y: 200 },
      data: {
        type: 'batch-input',
        label: 'Batch Topics',
        icon: '📋',
        color: 'bg-amber-600',
        category: 'trigger',
        config: { topics: [], parallel: false, staggerMs: 3000 },
      },
    },
    {
      id: 'n-script',
      type: 'agent-node',
      position: { x: 350, y: 200 },
      data: {
        type: 'script-writer',
        label: 'Script Writer',
        icon: '✍️',
        color: 'bg-blue-500',
        category: 'agent',
        config: {
          model: 'gemini-2.5-flash',
          wordTarget: 2500,
          fullPipelineMode: true,
          scenes: 12,
          duration: 6,
          style: 'dark-cinematic',
        },
      },
    },
    {
      id: 'n-board',
      type: 'agent-node',
      position: { x: 650, y: 200 },
      data: {
        type: 'storyboard',
        label: 'Storyboard',
        icon: '🎬',
        color: 'bg-purple-500',
        category: 'agent',
        config: { scenes: 12, duration: 6, style: 'dark-cinematic' },
      },
    },
    {
      id: 'n-export',
      type: 'output-node',
      position: { x: 950, y: 200 },
      data: {
        type: 'file-export',
        label: 'Export',
        icon: '💾',
        color: 'bg-gray-600',
        category: 'output',
        config: { exportFormat: 'json' },
      },
    },
  ],
  edges: [
    makeEdge('n-batch', 'n-script'),
    makeEdge('n-script', 'n-board'),
    makeEdge('n-board', 'n-export'),
  ],
};

/** 7. Transcript → Video — Start from existing transcript text */
const TRANSCRIPT_TO_VIDEO: PipelineTemplate = {
  id: 'tpl-transcript-to-video',
  name: 'Transcript → Video',
  description: 'Dán transcript có sẵn → tạo storyboard, hình ảnh, voiceover, ghép video',
  icon: '📝',
  channelId: null,
  isBuiltIn: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  nodes: [
    {
      id: 'n-transcript',
      type: 'trigger-node',
      position: { x: 50, y: 250 },
      data: {
        type: 'transcript-input',
        label: 'Paste Transcript',
        icon: '📝',
        color: 'bg-amber-500',
        category: 'trigger',
        config: { transcript: '', sourceUrl: '' },
      },
    },
    {
      id: 'n-clean',
      type: 'transform-node',
      position: { x: 300, y: 250 },
      data: {
        type: 'script-cleaner',
        label: 'Clean Script',
        icon: '🧹',
        color: 'bg-teal-500',
        category: 'transform',
        config: { removeHeadings: true, removeNotes: true },
      },
    },
    {
      id: 'n-board',
      type: 'agent-node',
      position: { x: 550, y: 250 },
      data: {
        type: 'storyboard',
        label: 'Storyboard',
        icon: '🎬',
        color: 'bg-purple-500',
        category: 'agent',
        config: { model: 'gpt-4o-mini', scenes: 12, duration: 6 },
      },
    },
    {
      id: 'n-enhance',
      type: 'transform-node',
      position: { x: 800, y: 130 },
      data: {
        type: 'prompt-enhancer',
        label: 'Enhance Prompts',
        icon: '✨',
        color: 'bg-teal-500',
        category: 'transform',
        config: { enhanceLevel: 'medium' },
      },
    },
    {
      id: 'n-img',
      type: 'agent-node',
      position: { x: 1050, y: 130 },
      data: {
        type: 'image-gen',
        label: 'Image Gen',
        icon: '🖼️',
        color: 'bg-pink-500',
        category: 'agent',
        config: { provider: 'gemini', quality: 'standard' },
      },
    },
    {
      id: 'n-voice',
      type: 'agent-node',
      position: { x: 800, y: 370 },
      data: {
        type: 'voiceover',
        label: 'Voiceover',
        icon: '🎤',
        color: 'bg-green-500',
        category: 'agent',
        config: { engine: 'gemini-tts', voice: 'Kore', speed: 1.0 },
      },
    },
    {
      id: 'n-asm',
      type: 'agent-node',
      position: { x: 1300, y: 250 },
      data: {
        type: 'assembly',
        label: 'Assembly',
        icon: '🎥',
        color: 'bg-red-500',
        category: 'agent',
        config: { format: 'mp4-1080p', transitions: 'crossfade', fps: 24 },
      },
    },
    {
      id: 'n-export',
      type: 'output-node',
      position: { x: 1550, y: 250 },
      data: {
        type: 'file-export',
        label: 'Export',
        icon: '💾',
        color: 'bg-gray-600',
        category: 'output',
        config: { exportFormat: 'mp4' },
      },
    },
  ],
  edges: [
    makeEdge('n-transcript', 'n-clean'),
    makeEdge('n-clean', 'n-board'),
    makeEdge('n-board', 'n-enhance'),
    makeEdge('n-enhance', 'n-img'),
    makeEdge('n-board', 'n-voice'),
    makeEdge('n-img', 'n-asm'),
    makeEdge('n-voice', 'n-asm'),
    makeEdge('n-asm', 'n-export'),
  ],
};

/** 8. A/B Script Test — Two script variations with conditional selection */
const AB_SCRIPT_TEST: PipelineTemplate = {
  id: 'tpl-ab-script-test',
  name: 'A/B Script Test',
  description: 'Tạo 2 phiên bản script, so sánh và chọn bản tốt nhất qua condition',
  icon: '⚖️',
  channelId: null,
  isBuiltIn: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  nodes: [
    {
      id: 'n-topic',
      type: 'trigger-node',
      position: { x: 50, y: 250 },
      data: {
        type: 'topic-input',
        label: 'Topic',
        icon: '💡',
        color: 'bg-amber-500',
        category: 'trigger',
        config: { topic: '' },
      },
    },
    {
      id: 'n-script-a',
      type: 'agent-node',
      position: { x: 350, y: 100 },
      data: {
        type: 'script-writer',
        label: 'Script A (Dark)',
        icon: '✍️',
        color: 'bg-blue-500',
        category: 'agent',
        config: { model: 'gemini-2.5-flash', tone: 'dark-philosophical', wordTarget: 2500 },
      },
    },
    {
      id: 'n-script-b',
      type: 'agent-node',
      position: { x: 350, y: 400 },
      data: {
        type: 'script-writer',
        label: 'Script B (Punchy)',
        icon: '✍️',
        color: 'bg-indigo-500',
        category: 'agent',
        config: { model: 'gemini-2.5-flash', tone: 'punchy-hook', wordTarget: 2000 },
      },
    },
    {
      id: 'n-merge',
      type: 'transform-node',
      position: { x: 650, y: 250 },
      data: {
        type: 'merge',
        label: 'Merge Results',
        icon: '🔀',
        color: 'bg-teal-500',
        category: 'transform',
        config: { strategy: 'wait-all' },
      },
    },
    {
      id: 'n-condition',
      type: 'condition-node',
      position: { x: 950, y: 250 },
      data: {
        type: 'condition',
        label: 'Pick Best',
        icon: '❓',
        color: 'bg-yellow-500',
        category: 'logic',
        config: { field: 'wordCount', operator: '>=', value: '2000' },
      },
    },
    {
      id: 'n-export-win',
      type: 'output-node',
      position: { x: 1250, y: 150 },
      data: {
        type: 'file-export',
        label: 'Export Winner',
        icon: '💾',
        color: 'bg-gray-600',
        category: 'output',
        config: { exportFormat: 'json' },
      },
    },
    {
      id: 'n-export-alt',
      type: 'output-node',
      position: { x: 1250, y: 350 },
      data: {
        type: 'file-export',
        label: 'Export Backup',
        icon: '💾',
        color: 'bg-gray-500',
        category: 'output',
        config: { exportFormat: 'json' },
      },
    },
  ],
  edges: [
    makeEdge('n-topic', 'n-script-a'),
    makeEdge('n-topic', 'n-script-b'),
    makeEdge('n-script-a', 'n-merge'),
    makeEdge('n-script-b', 'n-merge'),
    makeEdge('n-merge', 'n-condition'),
    makeEdge('n-condition', 'n-export-win', 'yes', 'input'),
    makeEdge('n-condition', 'n-export-alt', 'no', 'input'),
  ],
};

/** 9. Social Repurpose — One long video → Shorts + Podcast + Images */
const SOCIAL_REPURPOSE: PipelineTemplate = {
  id: 'tpl-social-repurpose',
  name: 'Social Repurpose',
  description: 'Tái sử dụng transcript thành Shorts, podcast audio, và bộ ảnh cho social',
  icon: '♻️',
  channelId: null,
  isBuiltIn: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  nodes: [
    {
      id: 'n-transcript',
      type: 'trigger-node',
      position: { x: 50, y: 300 },
      data: {
        type: 'transcript-input',
        label: 'Source Transcript',
        icon: '📝',
        color: 'bg-amber-500',
        category: 'trigger',
        config: { transcript: '', sourceUrl: '' },
      },
    },
    // Branch 1: Shorts
    {
      id: 'n-short-script',
      type: 'agent-node',
      position: { x: 350, y: 100 },
      data: {
        type: 'script-writer',
        label: 'Shorts Script',
        icon: '✍️',
        color: 'bg-blue-500',
        category: 'agent',
        config: { model: 'gemini-2.5-flash', tone: 'punchy-hook', wordTarget: 150 },
      },
    },
    {
      id: 'n-short-board',
      type: 'agent-node',
      position: { x: 650, y: 100 },
      data: {
        type: 'storyboard',
        label: 'Shorts Board',
        icon: '🎬',
        color: 'bg-purple-500',
        category: 'agent',
        config: { scenes: 5, duration: 3, aspectRatio: '9:16', style: 'bright-modern' },
      },
    },
    {
      id: 'n-short-export',
      type: 'output-node',
      position: { x: 950, y: 100 },
      data: {
        type: 'file-export',
        label: 'Export Shorts',
        icon: '📱',
        color: 'bg-gray-600',
        category: 'output',
        config: { exportFormat: 'json' },
      },
    },
    // Branch 2: Podcast
    {
      id: 'n-clean',
      type: 'transform-node',
      position: { x: 350, y: 300 },
      data: {
        type: 'script-cleaner',
        label: 'Clean for TTS',
        icon: '🧹',
        color: 'bg-teal-500',
        category: 'transform',
        config: { removeHeadings: true, removeNotes: true },
      },
    },
    {
      id: 'n-voice',
      type: 'agent-node',
      position: { x: 650, y: 300 },
      data: {
        type: 'voiceover',
        label: 'Podcast Voice',
        icon: '🎤',
        color: 'bg-green-500',
        category: 'agent',
        config: { engine: 'elevenlabs', voice: 'pNInz6obpgDQGcFmaJgB', speed: 0.95 },
      },
    },
    {
      id: 'n-audio-export',
      type: 'output-node',
      position: { x: 950, y: 300 },
      data: {
        type: 'file-export',
        label: 'Export Audio',
        icon: '🎙️',
        color: 'bg-gray-600',
        category: 'output',
        config: { exportFormat: 'mp3' },
      },
    },
    // Branch 3: Social Images
    {
      id: 'n-enhance',
      type: 'transform-node',
      position: { x: 350, y: 500 },
      data: {
        type: 'prompt-enhancer',
        label: 'Social Prompts',
        icon: '✨',
        color: 'bg-teal-500',
        category: 'transform',
        config: { enhanceLevel: 'high' },
      },
    },
    {
      id: 'n-img',
      type: 'agent-node',
      position: { x: 650, y: 500 },
      data: {
        type: 'image-gen',
        label: 'Social Images',
        icon: '🖼️',
        color: 'bg-pink-500',
        category: 'agent',
        config: { provider: 'gemini', quality: 'high' },
      },
    },
    {
      id: 'n-img-export',
      type: 'output-node',
      position: { x: 950, y: 500 },
      data: {
        type: 'file-export',
        label: 'Export Images',
        icon: '🖼️',
        color: 'bg-gray-600',
        category: 'output',
        config: { exportFormat: 'zip' },
      },
    },
  ],
  edges: [
    makeEdge('n-transcript', 'n-short-script'),
    makeEdge('n-short-script', 'n-short-board'),
    makeEdge('n-short-board', 'n-short-export'),
    makeEdge('n-transcript', 'n-clean'),
    makeEdge('n-clean', 'n-voice'),
    makeEdge('n-voice', 'n-audio-export'),
    makeEdge('n-transcript', 'n-enhance'),
    makeEdge('n-enhance', 'n-img'),
    makeEdge('n-img', 'n-img-export'),
  ],
};

/** 10. Quality Review — Pipeline with review gates before publishing */
const QUALITY_REVIEW: PipelineTemplate = {
  id: 'tpl-quality-review',
  name: 'Quality Review Pipeline',
  description: 'Full pipeline với bước review chất lượng — chỉ publish nếu đạt yêu cầu',
  icon: '✅',
  channelId: null,
  isBuiltIn: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  nodes: [
    {
      id: 'n-topic',
      type: 'trigger-node',
      position: { x: 50, y: 250 },
      data: {
        type: 'topic-input',
        label: 'Topic',
        icon: '💡',
        color: 'bg-amber-500',
        category: 'trigger',
        config: { topic: '' },
      },
    },
    {
      id: 'n-script',
      type: 'agent-node',
      position: { x: 300, y: 250 },
      data: {
        type: 'script-writer',
        label: 'Script Writer',
        icon: '✍️',
        color: 'bg-blue-500',
        category: 'agent',
        config: { model: 'gemini-2.5-flash', tone: 'dark-philosophical', wordTarget: 2500 },
      },
    },
    {
      id: 'n-check-script',
      type: 'condition-node',
      position: { x: 550, y: 250 },
      data: {
        type: 'condition',
        label: 'Script OK?',
        icon: '❓',
        color: 'bg-yellow-500',
        category: 'logic',
        config: { field: 'wordCount', operator: '>=', value: '2000' },
      },
    },
    {
      id: 'n-board',
      type: 'agent-node',
      position: { x: 800, y: 150 },
      data: {
        type: 'storyboard',
        label: 'Storyboard',
        icon: '🎬',
        color: 'bg-purple-500',
        category: 'agent',
        config: { model: 'gpt-4o-mini', scenes: 12, duration: 6, style: 'dark-cinematic' },
      },
    },
    {
      id: 'n-img',
      type: 'agent-node',
      position: { x: 1050, y: 80 },
      data: {
        type: 'image-gen',
        label: 'Image Gen',
        icon: '🖼️',
        color: 'bg-pink-500',
        category: 'agent',
        config: { provider: 'gemini', quality: 'standard' },
      },
    },
    {
      id: 'n-voice',
      type: 'agent-node',
      position: { x: 1050, y: 250 },
      data: {
        type: 'voiceover',
        label: 'Voiceover',
        icon: '🎤',
        color: 'bg-green-500',
        category: 'agent',
        config: { engine: 'gemini-tts', voice: 'Kore', speed: 1.0 },
      },
    },
    {
      id: 'n-asm',
      type: 'agent-node',
      position: { x: 1300, y: 150 },
      data: {
        type: 'assembly',
        label: 'Assembly',
        icon: '🎥',
        color: 'bg-red-500',
        category: 'agent',
        config: { format: 'mp4-1080p', transitions: 'crossfade', fps: 24 },
      },
    },
    {
      id: 'n-check-video',
      type: 'condition-node',
      position: { x: 1550, y: 150 },
      data: {
        type: 'condition',
        label: 'Video Ready?',
        icon: '❓',
        color: 'bg-yellow-500',
        category: 'logic',
        config: { field: 'status', operator: '==', value: 'complete' },
      },
    },
    {
      id: 'n-upload',
      type: 'output-node',
      position: { x: 1800, y: 80 },
      data: {
        type: 'youtube-upload',
        label: 'YouTube Upload',
        icon: '📤',
        color: 'bg-red-600',
        category: 'output',
        config: { visibility: 'private', notifySubscribers: false },
      },
    },
    {
      id: 'n-draft',
      type: 'output-node',
      position: { x: 1800, y: 250 },
      data: {
        type: 'file-export',
        label: 'Save Draft',
        icon: '💾',
        color: 'bg-gray-600',
        category: 'output',
        config: { exportFormat: 'mp4' },
      },
    },
    {
      id: 'n-reject',
      type: 'output-node',
      position: { x: 750, y: 400 },
      data: {
        type: 'file-export',
        label: 'Rejected Log',
        icon: '📋',
        color: 'bg-gray-500',
        category: 'output',
        config: { exportFormat: 'json' },
      },
    },
  ],
  edges: [
    makeEdge('n-topic', 'n-script'),
    makeEdge('n-script', 'n-check-script'),
    makeEdge('n-check-script', 'n-board', 'yes', 'input'),
    makeEdge('n-check-script', 'n-reject', 'no', 'input'),
    makeEdge('n-board', 'n-img'),
    makeEdge('n-board', 'n-voice'),
    makeEdge('n-img', 'n-asm'),
    makeEdge('n-voice', 'n-asm'),
    makeEdge('n-asm', 'n-check-video'),
    makeEdge('n-check-video', 'n-upload', 'yes', 'input'),
    makeEdge('n-check-video', 'n-draft', 'no', 'input'),
  ],
};

export const BUILT_IN_TEMPLATES: PipelineTemplate[] = [
  FULL_PIPELINE,
  SCRIPT_ONLY,
  YOUTUBE_SHORTS,
  PODCAST_EPISODE,
  VISUAL_STORYBOARD,
  BATCH_FACTORY,
  TRANSCRIPT_TO_VIDEO,
  AB_SCRIPT_TEST,
  SOCIAL_REPURPOSE,
  QUALITY_REVIEW,
];

// ─── CRUD Helpers ───────────────────────────────────────

function loadCustomTemplates(): PipelineTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomTemplates(templates: PipelineTemplate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

/** Get all templates (built-in + custom) */
export function getAllTemplates(): PipelineTemplate[] {
  return [...BUILT_IN_TEMPLATES, ...loadCustomTemplates()];
}

/** Get a single template by ID */
export function getTemplate(id: string): PipelineTemplate | undefined {
  return getAllTemplates().find((t) => t.id === id);
}

/** Save a new custom template */
export function saveTemplate(
  template: Omit<PipelineTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isBuiltIn'>
): PipelineTemplate {
  const now = new Date().toISOString();
  const newTemplate: PipelineTemplate = {
    ...template,
    id: `tpl-custom-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    isBuiltIn: false,
  };
  const customs = loadCustomTemplates();
  customs.push(newTemplate);
  saveCustomTemplates(customs);
  return newTemplate;
}

/** Update an existing custom template */
export function updateTemplate(
  id: string,
  updates: {
    name?: string;
    description?: string;
    nodes?: SerializedNode[];
    edges?: SerializedEdge[];
    channelId?: string | null;
  }
): PipelineTemplate | null {
  const customs = loadCustomTemplates();
  const idx = customs.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  customs[idx] = { ...customs[idx], ...updates, updatedAt: new Date().toISOString() };
  saveCustomTemplates(customs);
  return customs[idx];
}

/** Delete a custom template (cannot delete built-in) */
export function deleteTemplate(id: string): boolean {
  const customs = loadCustomTemplates();
  const filtered = customs.filter((t) => t.id !== id);
  if (filtered.length === customs.length) return false;
  saveCustomTemplates(filtered);
  return true;
}

/** Clone a template (built-in or custom) into a new custom template */
export function cloneTemplate(id: string, newName?: string): PipelineTemplate | null {
  const source = getTemplate(id);
  if (!source) return null;
  return saveTemplate({
    name: newName || `${source.name} (Copy)`,
    description: source.description,
    icon: source.icon,
    channelId: source.channelId,
    nodes: JSON.parse(JSON.stringify(source.nodes)),
    edges: JSON.parse(JSON.stringify(source.edges)),
  });
}
