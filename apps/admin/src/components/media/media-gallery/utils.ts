import {
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Folder,
} from 'lucide-react';
import type { DriveFile } from '@/lib/api/google-drive-http';
import type { MediaItem } from './types';

// Convert Drive file to MediaItem
export const driveFileToMediaItem = (file: DriveFile): MediaItem => {
  const mimeType = file.mimeType || '';
  let type: MediaItem['type'] = 'other';
  
  if (mimeType.startsWith('image/')) type = 'image';
  else if (mimeType.startsWith('video/')) type = 'video';
  else if (mimeType.startsWith('audio/')) type = 'audio';
  else if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) type = 'document';

  return {
    id: file.id,
    name: file.name,
    url: file.webContentLink || file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
    thumbnailUrl: file.thumbnailLink?.replace('=s220', '=s400'),
    mimeType: file.mimeType,
    size: file.size,
    modifiedTime: file.modifiedTime,
    type,
    parentFolderId: file.parents?.[0],
  };
};

// Get direct preview URL for images/videos
// Always use API proxy for authenticated Google Drive access
export const getPreviewUrl = (file: MediaItem, size: 'small' | 'medium' | 'large' = 'medium'): string => {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const sizeMap = { small: 200, medium: 400, large: 800 };
  const sizeParam = sizeMap[size];
  
  // Use API proxy for all media types (handles Google Drive auth)
  if (file.type === 'image' || file.type === 'video') {
    return `${API_BASE}/api/drive/thumbnail/${file.id}?size=${sizeParam}`;
  }
  
  // For documents, use icon or thumbnailUrl if available
  if (file.thumbnailUrl) {
    return file.thumbnailUrl.replace(/=s\d+/, `=s${sizeParam}`);
  }
  
  return file.url;
};

// Format file size
export const formatSize = (bytes?: string): string => {
  if (!bytes) return '';
  const size = parseInt(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

// Format date
export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Type colors and icons
export const typeConfig = {
  image: { icon: ImageIcon, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Ảnh' },
  video: { icon: Video, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30', label: 'Video' },
  audio: { icon: Music, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/30', label: 'Âm thanh' },
  document: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Tài liệu' },
  folder: { icon: Folder, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Folder' },
  other: { icon: FileText, color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/30', label: 'Khác' },
};
