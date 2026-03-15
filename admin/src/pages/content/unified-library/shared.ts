/**
 * 📚 Unified Library — Shared constants, types, and helpers
 */

import {
  Cloud,
  FileText,
  Folder,
  Globe,
  HardDrive,
  Image,
  Music,
  Newspaper,
  Video,
} from 'lucide-react';
import type { AssetType } from '@/hooks/library';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const AI_TAG_CATEGORIES: Record<string, string[]> = {
  image: [
    'product',
    'banner',
    'logo',
    'screenshot',
    'photo',
    'icon',
    'background',
    'social-media',
    'thumbnail',
  ],
  video: ['promo', 'tutorial', 'demo', 'review', 'intro', 'outro', 'ad', 'content'],
  document: ['report', 'guide', 'template', 'contract', 'invoice', 'presentation'],
};

export const RENAME_PATTERNS = [
  { id: 'prefix', label: 'Thêm prefix', example: 'PREFIX_filename.jpg' },
  { id: 'suffix', label: 'Thêm suffix', example: 'filename_SUFFIX.jpg' },
  { id: 'date', label: 'Thêm ngày', example: 'filename_2024-01-15.jpg' },
  { id: 'number', label: 'Đánh số', example: 'product_001.jpg, product_002.jpg' },
  { id: 'replace', label: 'Thay thế text', example: 'old → new' },
];

// ═══════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface UnifiedAsset {
  id: string;
  name: string;
  type: AssetType;
  source: 'drive' | 'local' | 'youtube' | 'news' | 'web';
  url?: string;
  thumbnailUrl?: string;
  size?: number;
  mimeType?: string;
  createdAt: string;
  modifiedAt?: string;
  projectSlug?: string;
  metadata?: Record<string, unknown>;
}

export interface LibraryStats {
  total: number;
  images: number;
  videos: number;
  documents: number;
  audio: number;
  files: number;
  totalSize: string;
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export const getAssetIcon = (type: AssetType) => {
  switch (type) {
    case 'image':
      return Image;
    case 'video':
      return Video;
    case 'document':
      return FileText;
    case 'audio':
      return Music;
    default:
      return Folder;
  }
};

export const getSourceIcon = (source: string) => {
  switch (source) {
    case 'youtube':
      return Video;
    case 'news':
      return Newspaper;
    case 'web':
      return Globe;
    case 'drive':
      return Cloud;
    default:
      return HardDrive;
  }
};

export const formatFileSize = (bytes?: number) => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};
