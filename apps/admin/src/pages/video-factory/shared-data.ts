/**
 * 🎬 Video Factory — Shared Data & Types
 * Model Intelligence metadata, constants, and shared configurations
 */

import { Crown, Flame, Star, Target, Image as ImageIcon } from 'lucide-react';
import React from 'react';

// ─── Image Models Set (for AI media_type detection) ───────────────────────────

export const IMAGE_MODELS_SET = new Set([
  'seedream-v5', 'flux2-pro', 'nano-banana-pro', 'gpt-image', 'z-image',
  'seedream-4.5', 'kling-o1-image', 'flux-kontext', 'nano-banana',
  'seedream-4.0', 'higgsfield-faceswap'
]);

// ─── Model Intelligence Types ─────────────────────────────────────────────────

export type ModelTier = 'primary' | 'premium' | 'niche' | 'experimental' | 'image';

export interface ModelMeta {
  id: string;
  name: string;
  tier: ModelTier;
  type: 'video' | 'image';
  provider: string;
  maxResolution: string;
  maxDuration: string;
  speed: number;
  quality: number;
  creativity: number;
  costType: 'unlimited' | 'credits' | 'free';
  features: string[];
  bestFor: string;
  notes: string;
  updated: string;
}

// ─── Model Intelligence Metadata ──────────────────────────────────────────────

export const MODEL_INTELLIGENCE: Record<string, ModelMeta> = {
  'minimax-hailuo': {
    id: 'minimax-hailuo', name: 'MiniMax Hailuo', tier: 'primary', type: 'video',
    provider: 'MiniMax (via Higgsfield)', maxResolution: '1080p', maxDuration: '6s',
    speed: 9, quality: 8, creativity: 7, costType: 'unlimited',
    features: ['Fast generation', 'Consistent quality', 'Good motion', 'Text overlay'],
    bestFor: 'High-volume daily production — fast & reliable workhorse',
    notes: 'Proven #1 in production. ~22s avg generation. Unlimited on Higgsfield.',
    updated: '2025-06',
  },
  'higgsfield-popcorn': {
    id: 'higgsfield-popcorn', name: 'Higgsfield Popcorn', tier: 'niche', type: 'video',
    provider: 'Higgsfield', maxResolution: '1080p', maxDuration: '5s',
    speed: 8, quality: 7, creativity: 6, costType: 'unlimited',
    features: ['Quick generation', 'Simple scenes', 'Reliable'],
    bestFor: 'Fast short clips for social media',
    notes: 'Good for quick iterations. Unlimited.',
    updated: '2025-06',
  },
  'higgsfield-soul': {
    id: 'higgsfield-soul', name: 'Higgsfield Soul 2.0', tier: 'premium', type: 'video',
    provider: 'Higgsfield', maxResolution: '1080p', maxDuration: '5s',
    speed: 6, quality: 9, creativity: 9, costType: 'unlimited',
    features: ['Editorial aesthetics', '20+ style presets', 'Culture-native', 'Artistic'],
    bestFor: 'Premium brand content, artistic & editorial style',
    notes: 'Soul 2.0 with editorial presets. 5000-10000 free gens/month on basic.',
    updated: '2025-06',
  },
  'reve': {
    id: 'reve', name: 'Reve', tier: 'niche', type: 'video',
    provider: 'Reve (via Higgsfield)', maxResolution: '1080p', maxDuration: '5s',
    speed: 8, quality: 7, creativity: 8, costType: 'unlimited',
    features: ['Unique style', 'Creative motion', 'Good for abstract'],
    bestFor: 'Creative & abstract content, unique visual style',
    notes: 'Different aesthetic from others. Good for variety.',
    updated: '2025-06',
  },
  'kling3': {
    id: 'kling3', name: 'Kling 3.0', tier: 'premium', type: 'video',
    provider: 'Kuaishou (via Higgsfield)', maxResolution: '4K', maxDuration: '15s',
    speed: 5, quality: 10, creativity: 9, costType: 'credits',
    features: ['4K native', 'Native audio', 'Multi-shot (6 cuts)', '15s duration', 'Physics-aware', 'Voice Binding 5 languages'],
    bestFor: 'Hero content, cinematic quality, long-form clips',
    notes: 'Industry-leading quality. 4K + audio + multi-shot. Credits-based.',
    updated: '2025-06',
  },
  'kling25-turbo': {
    id: 'kling25-turbo', name: 'Kling 2.5 Turbo', tier: 'niche', type: 'video',
    provider: 'Kuaishou (via Higgsfield)', maxResolution: '1080p', maxDuration: '5s',
    speed: 7, quality: 7, creativity: 7, costType: 'credits',
    features: ['Fast Kling', 'Good quality', 'Cost-effective'],
    bestFor: 'When you need Kling quality but faster & cheaper',
    notes: 'Faster than Kling 3.0 but lower max quality.',
    updated: '2025-05',
  },
  'sora2': {
    id: 'sora2', name: 'Sora 2', tier: 'experimental', type: 'video',
    provider: 'OpenAI (via Higgsfield)', maxResolution: '1080p', maxDuration: '20s',
    speed: 3, quality: 9, creativity: 10, costType: 'credits',
    features: ['Long duration', 'World knowledge', 'Complex scenes', 'Text understanding'],
    bestFor: 'Complex narrative scenes, text-heavy content',
    notes: 'Powerful but slow. Use for special projects.',
    updated: '2025-06',
  },
  'veo31': {
    id: 'veo31', name: 'Veo 3.1', tier: 'experimental', type: 'video',
    provider: 'Google (via Higgsfield)', maxResolution: '1080p', maxDuration: '8s',
    speed: 5, quality: 8, creativity: 8, costType: 'credits',
    features: ['Google quality', 'Good motion', 'Realistic physics'],
    bestFor: 'Realistic scenes, product demos',
    notes: 'Google DeepMind model. Solid alternative.',
    updated: '2025-06',
  },
  'wan25-fast': {
    id: 'wan25-fast', name: 'Wan 2.5 Fast', tier: 'experimental', type: 'video',
    provider: 'Alibaba (via Higgsfield)', maxResolution: '1080p', maxDuration: '5s',
    speed: 8, quality: 6, creativity: 6, costType: 'unlimited',
    features: ['Very fast', 'Acceptable quality', 'Unlimited'],
    bestFor: 'Rapid prototyping, testing prompts',
    notes: 'Fast but quality is below production standard.',
    updated: '2025-05',
  },
  'seedream-v5': {
    id: 'seedream-v5', name: 'SeeDream v5', tier: 'primary', type: 'image',
    provider: 'ByteDance (via Higgsfield)', maxResolution: '4K', maxDuration: 'N/A',
    speed: 9, quality: 9, creativity: 8, costType: 'unlimited',
    features: ['4K images', 'Photorealistic', 'Fast generation'],
    bestFor: 'High-quality image generation for thumbnails & posts',
    notes: 'Top-tier image model. Unlimited.',
    updated: '2025-06',
  },
  'flux2-pro': {
    id: 'flux2-pro', name: 'Flux 2 Pro', tier: 'premium', type: 'image',
    provider: 'Black Forest Labs (via Higgsfield)', maxResolution: '4K', maxDuration: 'N/A',
    speed: 7, quality: 9, creativity: 9, costType: 'unlimited',
    features: ['Excellent text rendering', 'Detailed images', 'Artistic'],
    bestFor: 'Text-heavy images, detailed artwork',
    notes: 'Best text rendering. Unlimited.',
    updated: '2025-06',
  },
  'nano-banana-pro': {
    id: 'nano-banana-pro', name: 'Nano Banana Pro', tier: 'premium', type: 'image',
    provider: 'Higgsfield', maxResolution: '4K native', maxDuration: 'N/A',
    speed: 10, quality: 9, creativity: 8, costType: 'unlimited',
    features: ['Gemini 3.0 backbone', 'Perfect text rendering', '<10s generation', '4K native'],
    bestFor: 'Production speed + quality. Best for thumbnails with text.',
    notes: 'Fastest high-quality image model. <10s. Unlimited.',
    updated: '2025-06',
  },
  'gpt-image': {
    id: 'gpt-image', name: 'GPT Image', tier: 'niche', type: 'image',
    provider: 'OpenAI (via Higgsfield)', maxResolution: '1024x1024', maxDuration: 'N/A',
    speed: 6, quality: 8, creativity: 9, costType: 'credits',
    features: ['Good understanding', 'Versatile', 'Creative'],
    bestFor: 'Complex image prompts needing understanding',
    notes: 'GPT-4o image generation. Credits-based.',
    updated: '2025-06',
  },
  'z-image': {
    id: 'z-image', name: 'Z Image', tier: 'niche', type: 'image',
    provider: 'Higgsfield', maxResolution: '1080p', maxDuration: 'N/A',
    speed: 8, quality: 7, creativity: 7, costType: 'unlimited',
    features: ['Fast', 'General purpose', 'Unlimited'],
    bestFor: 'Quick general-purpose images',
    notes: 'Fast utility image model. Unlimited.',
    updated: '2025-06',
  },
  'seedream-4.5': {
    id: 'seedream-4.5', name: 'SeeDream 4.5', tier: 'niche', type: 'image',
    provider: 'ByteDance (via Higgsfield)', maxResolution: '2K', maxDuration: 'N/A',
    speed: 8, quality: 8, creativity: 7, costType: 'unlimited',
    features: ['Good quality', 'Fast', 'Photorealistic'],
    bestFor: 'Efficient image generation when v5 is overkill',
    notes: 'Slightly older but faster than v5. Unlimited.',
    updated: '2025-05',
  },
  'seedream-4.0': {
    id: 'seedream-4.0', name: 'SeeDream 4.0', tier: 'experimental', type: 'image',
    provider: 'ByteDance (via Higgsfield)', maxResolution: '1080p', maxDuration: 'N/A',
    speed: 9, quality: 7, creativity: 6, costType: 'unlimited',
    features: ['Legacy version', 'Very fast', 'Basic quality'],
    bestFor: 'Rapid prototyping, testing concepts',
    notes: 'Older generation. Use v5 for production.',
    updated: '2025-03',
  },
  'kling-o1-image': {
    id: 'kling-o1-image', name: 'Kling O1 Image', tier: 'premium', type: 'image',
    provider: 'Kuaishou (via Higgsfield)', maxResolution: '2K', maxDuration: 'N/A',
    speed: 6, quality: 9, creativity: 8, costType: 'credits',
    features: ['High detail', 'Photorealistic', 'Scene understanding'],
    bestFor: 'Premium photorealistic images with complex scenes',
    notes: 'Kling image model. Credits-based.',
    updated: '2025-06',
  },
  'flux-kontext': {
    id: 'flux-kontext', name: 'Flux Kontext', tier: 'niche', type: 'image',
    provider: 'Black Forest Labs (via Higgsfield)', maxResolution: '2K', maxDuration: 'N/A',
    speed: 7, quality: 8, creativity: 8, costType: 'unlimited',
    features: ['Context-aware', 'Style transfer', 'Image editing'],
    bestFor: 'Image editing, style transfer, context-aware generation',
    notes: 'Flux variant for image manipulation. Unlimited.',
    updated: '2025-06',
  },
  'nano-banana': {
    id: 'nano-banana', name: 'Nano Banana', tier: 'niche', type: 'image',
    provider: 'Higgsfield', maxResolution: '1080p', maxDuration: 'N/A',
    speed: 9, quality: 7, creativity: 7, costType: 'unlimited',
    features: ['Fast', 'Lightweight', 'Good for drafts'],
    bestFor: 'Quick drafts and iterations',
    notes: 'Lighter version of Pro. Use Pro for final output.',
    updated: '2025-05',
  },
  'higgsfield-faceswap': {
    id: 'higgsfield-faceswap', name: 'Higgsfield FaceSwap', tier: 'niche', type: 'image',
    provider: 'Higgsfield', maxResolution: '1080p', maxDuration: 'N/A',
    speed: 8, quality: 7, creativity: 5, costType: 'unlimited',
    features: ['Face swap', 'Identity transfer', 'Quick processing'],
    bestFor: 'Face replacement in images/thumbnails',
    notes: 'Specialized face swap tool. Unlimited.',
    updated: '2025-06',
  },
  'sora2-pro': {
    id: 'sora2-pro', name: 'Sora 2 Pro', tier: 'premium', type: 'video',
    provider: 'OpenAI (via Higgsfield)', maxResolution: '1080p', maxDuration: '20s',
    speed: 2, quality: 10, creativity: 10, costType: 'credits',
    features: ['Highest quality', 'Extended duration', 'World simulation', 'Complex physics'],
    bestFor: 'Absolute best quality — hero/flagship content',
    notes: 'Premium Sora tier. Slow but stunning.',
    updated: '2025-06',
  },
  'sora2-max': {
    id: 'sora2-max', name: 'Sora 2 Max', tier: 'experimental', type: 'video',
    provider: 'OpenAI (via Higgsfield)', maxResolution: '4K', maxDuration: '60s',
    speed: 1, quality: 10, creativity: 10, costType: 'credits',
    features: ['4K output', '60s duration', 'Cinematic', 'Full scene control'],
    bestFor: 'Feature-length clips, documentaries, trailers',
    notes: 'Maximum tier. Very slow, very expensive. Special occasions only.',
    updated: '2025-06',
  },
  'kling26': {
    id: 'kling26', name: 'Kling 2.6', tier: 'niche', type: 'video',
    provider: 'Kuaishou (via Higgsfield)', maxResolution: '1080p', maxDuration: '10s',
    speed: 6, quality: 8, creativity: 8, costType: 'credits',
    features: ['Balanced', 'Good motion', 'Improved physics'],
    bestFor: 'Mid-tier Kling content when 3.0 is overkill',
    notes: 'Between 2.5 Turbo and 3.0. Good balance.',
    updated: '2025-06',
  },
  'kling-motion': {
    id: 'kling-motion', name: 'Kling Motion', tier: 'niche', type: 'video',
    provider: 'Kuaishou (via Higgsfield)', maxResolution: '1080p', maxDuration: '5s',
    speed: 7, quality: 7, creativity: 8, costType: 'credits',
    features: ['Motion transfer', 'Action sequences', 'Dynamic camera'],
    bestFor: 'Action sequences, dynamic motion content',
    notes: 'Specialized in motion dynamics.',
    updated: '2025-06',
  },
  'veo3': {
    id: 'veo3', name: 'Veo 3.0', tier: 'premium', type: 'video',
    provider: 'Google (via Higgsfield)', maxResolution: '1080p', maxDuration: '8s',
    speed: 4, quality: 9, creativity: 9, costType: 'credits',
    features: ['High quality', 'Realistic physics', 'Good audio sync'],
    bestFor: 'Realistic content, product videos',
    notes: 'Google DeepMind flagship. Strong competitor to Kling 3.',
    updated: '2025-06',
  },
  'wan26': {
    id: 'wan26', name: 'Wan 2.6', tier: 'experimental', type: 'video',
    provider: 'Alibaba (via Higgsfield)', maxResolution: '1080p', maxDuration: '5s',
    speed: 7, quality: 7, creativity: 7, costType: 'unlimited',
    features: ['Improved quality', 'Fast', 'Unlimited'],
    bestFor: 'Upgraded fast generation when Hailuo is busy',
    notes: 'Improved Wan. Better than 2.5 but still below top tier.',
    updated: '2025-06',
  },
  'seedance': {
    id: 'seedance', name: 'SeeDance', tier: 'niche', type: 'video',
    provider: 'ByteDance (via Higgsfield)', maxResolution: '1080p', maxDuration: '5s',
    speed: 7, quality: 8, creativity: 8, costType: 'credits',
    features: ['Dance generation', 'Human motion', 'Music sync'],
    bestFor: 'Dance/music videos, human motion content',
    notes: 'Specialized dance & motion model by ByteDance.',
    updated: '2025-06',
  },
  'minimax': {
    id: 'minimax', name: 'MiniMax (Legacy)', tier: 'experimental', type: 'video',
    provider: 'MiniMax (via Higgsfield)', maxResolution: '720p', maxDuration: '5s',
    speed: 8, quality: 6, creativity: 6, costType: 'unlimited',
    features: ['Legacy version', 'Fast', 'Basic quality'],
    bestFor: 'Fallback when Hailuo is unavailable',
    notes: 'Older MiniMax. Use Hailuo variant for production.',
    updated: '2025-03',
  },
};

export const TIER_CONFIG: Record<ModelTier, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  primary: { label: '🏆 Primary', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', icon: React.createElement(Crown, { className: 'h-3.5 w-3.5' }), description: 'Production workhorse — 80% of output' },
  premium: { label: '💎 Premium', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30', icon: React.createElement(Star, { className: 'h-3.5 w-3.5' }), description: 'Hero content — highest quality' },
  niche: { label: '🎯 Niche', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: React.createElement(Target, { className: 'h-3.5 w-3.5' }), description: 'Specialized use cases' },
  experimental: { label: '🧪 Experimental', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30', icon: React.createElement(Flame, { className: 'h-3.5 w-3.5' }), description: 'Testing & evaluation' },
  image: { label: '🖼️ Image', color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: React.createElement(ImageIcon, { className: 'h-3.5 w-3.5' }), description: 'Image generation models' },
};
