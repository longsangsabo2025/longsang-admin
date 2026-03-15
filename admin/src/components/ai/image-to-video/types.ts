import type { MediaItem } from '@/hooks/library/types';

export interface VideoResult {
  taskId: string;
  state: 'generating' | 'success' | 'fail';
  videoUrl?: string;
  error?: string;
  prompt?: string;
  model?: string;
  createdAt?: string;
  duration?: number;
  thumbnailUrl?: string;
}

export interface VideoSettings {
  aiModel: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  selectedModel: string;
  duration: number;
  quality: string;
  aspectRatio: string;
  motionPreset: string;
  veoModel: string;
}

export interface ActivityLogItem {
  id: string;
  taskId?: string;
  type: 'image' | 'video' | 'upscale' | 'background-removal';
  model?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  inputUrl?: string;
  outputUrl?: string;
  prompt?: string;
  cost?: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ImageToVideoProps {
  selectedLibraryImage?: MediaItem;
  onActivityLog?: (item: Omit<ActivityLogItem, 'id' | 'createdAt'>) => string;
  onUpdateActivityLog?: (id: string, updates: Partial<ActivityLogItem>) => void;
}
