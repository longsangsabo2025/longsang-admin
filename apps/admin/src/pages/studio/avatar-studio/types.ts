/**
 * Types for Avatar Studio
 */

export interface OwnerPortrait {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  angle: 'front' | 'side' | 'three-quarter';
  expression: 'neutral' | 'smile' | 'serious' | 'presenting';
  outfit: string;
  isActive: boolean;
}

export interface ContentTemplate {
  id: string;
  name: string;
  category: 'intro' | 'promo' | 'tutorial' | 'announcement' | 'testimonial';
  script: string;
  duration: number; // seconds
  platform: 'tiktok' | 'instagram' | 'facebook' | 'youtube' | 'all';
}

export interface GeneratedContent {
  id: string;
  type: 'image' | 'video';
  status: 'pending' | 'generating' | 'completed' | 'failed';
  prompt: string;
  outputUrl?: string;
  thumbnailUrl?: string;
  createdAt: Date;
  platform?: string;
}

export interface AvatarProfile {
  id: string;
  name: string;
  role: string;
  brand: string;
  personality: string;
  speakingStyle: string;
  languages: string[];
  portraits: OwnerPortrait[];
  createdAt?: string;
  brainCharacterId?: string; // Link to Brain character
}

export interface PlatformConfig {
  aspectRatio: string;
  maxDuration: number;
  icon: string;
}

export interface GenerationStyle {
  id: string;
  name: string;
  prompt: string;
}

export type PlatformKey = 'tiktok' | 'instagram' | 'facebook' | 'youtube';
