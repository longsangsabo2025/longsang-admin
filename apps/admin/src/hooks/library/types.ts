/**
 * 🚀 LIBRARY TYPES
 * Shared types for Unified Library system
 */

export type AssetType = 'all' | 'image' | 'video' | 'document' | 'audio' | 'file' | 'workspace' | 'products';
export type ViewMode = 'grid' | 'list';
export type ProductStatus = 'draft' | 'review' | 'approved' | 'published';

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'folder' | 'other';
  parentFolderId?: string;
}

export interface WorkspaceItem extends MediaItem {
  addedAt: string;
  notes?: string;
}

export interface ProductItem extends MediaItem {
  addedAt: string;
  status: ProductStatus;
  category?: string;
  notes?: string;
  tags?: string[];
  aiTags?: string[];
}

export interface ActivityLogEntry {
  id: string;
  action: ActivityAction;
  description: string;
  count?: number;
  timestamp: string;
  icon: string;
}

export type ActivityAction = 
  | 'add_workspace' 
  | 'add_products' 
  | 'remove' 
  | 'remove_workspace' 
  | 'remove_products'
  | 'status_change' 
  | 'update_status'
  | 'ai_tag' 
  | 'bulk_rename' 
  | 'export' 
  | 'batch_action'
  | 'clear_workspace' 
  | 'clear_products' 
  | 'batch_status' 
  | 'batch_delete' 
  | 'rename';

export interface LibraryStats {
  total: number;
  images: number;
  videos: number;
  documents: number;
  audio: number;
  files: number;
  totalSize: string;
}

export interface ProjectInfo {
  id: string;
  slug: string;
  name: string;
  icon: string;
  color: string;
  folderId: string;
}

// Status configuration
export const STATUS_CONFIG: Record<ProductStatus, { color: string; label: string; icon: string }> = {
  draft: { color: 'bg-yellow-500', label: 'Draft', icon: '📝' },
  review: { color: 'bg-blue-500', label: 'Review', icon: '👀' },
  approved: { color: 'bg-green-500', label: 'Approved', icon: '✅' },
  published: { color: 'bg-purple-500', label: 'Published', icon: '🚀' },
};

// Activity icons mapping
export const ACTIVITY_ICONS: Record<ActivityAction, string> = {
  add_workspace: '📁',
  add_products: '📦',
  remove: '🗑️',
  remove_workspace: '❌',
  remove_products: '🗑️',
  status_change: '🔄',
  ai_tag: '🤖',
  bulk_rename: '✏️',
  export: '📥',
  batch_action: '⚡',
  clear_workspace: '🧹',
  clear_products: '🧹',
  batch_status: '📋',
  batch_delete: '🗑️',
  rename: '✏️',
};

// Google Drive Project Folders
export const PROJECT_FOLDERS: Record<string, { id: string; name: string; icon: string; color: string }> = {
  'longsang-admin': { id: '18lVYunyFRGyImQDueC4eep-YLMQQG2cF', name: 'LongSang Admin', icon: '🚀', color: 'bg-blue-500' },
  'ainewbie-web': { id: '1_W717py4DrkqEnGJtN6m9wBJqfAz2CMT', name: 'AI Newbie Web', icon: '🎓', color: 'bg-cyan-500' },
  'vungtau-dream-homes': { id: '1sxfRRyty6r0x1SpcXXyRR7OFevkwKuYH', name: 'VT Dream Homes', icon: '🏡', color: 'bg-orange-500' },
  'sabo-hub': { id: '10GotnxoqURPNFmbDoksQTkXX-WKwKT9N', name: 'SABO Hub', icon: '🎱', color: 'bg-green-500' },
  'sabo-arena': { id: '1hw0FjtBfBoh1i963NVYJ10nuNrjT6v__', name: 'SABO Arena', icon: '🏆', color: 'bg-green-600' },
  'music-video-app': { id: '1U1aE_6pYse-_I4hCy12iK743C3v1kuau', name: 'Music Video', icon: '🎵', color: 'bg-purple-500' },
  'ai-secretary': { id: '1knlWL11y5JNO7Gf6BBvQGUrC0Tr27yeC', name: 'AI Secretary', icon: '🤖', color: 'bg-pink-500' },
};

export const PROJECTS_ROOT = '18P5ks7WdlUWjPRuJ2b4BVSBAAe0l9SjL';

// Convert PROJECT_FOLDERS to ProjectInfo[]
export const PROJECTS_LIST: ProjectInfo[] = Object.entries(PROJECT_FOLDERS).map(([slug, info]) => ({
  id: slug,
  slug,
  name: info.name,
  icon: info.icon,
  color: info.color,
  folderId: info.id,
}));
