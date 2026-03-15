import type { ReactNode } from 'react';

// Project info for "Add to Project" feature
export interface ProjectInfo {
  id: string;
  slug: string;
  name: string;
  icon: string;
  color: string;
  folderId: string;
}

export interface MediaGalleryProps {
  projectSlug?: string;
  projectFolderId?: string;
  onSelectMedia?: (files: MediaItem[]) => void;
  selectionMode?: boolean;
  maxSelection?: number;
  /** Filter type from parent - when set, hides folders and shows only matching files */
  filterType?: 'all' | 'image' | 'video' | 'audio' | 'document';
  /** Hide the filter dropdown when parent controls filtering */
  hideFilter?: boolean;
  /** Callback to add files to workspace */
  onAddToWorkspace?: (files: MediaItem[]) => void;
  /** Callback to add files to products */
  onAddToProducts?: (files: MediaItem[]) => void;
  /** Available projects for "Add to Project" submenu */
  projects?: ProjectInfo[];
  /** Callback when adding files to a specific project */
  onAddToProject?: (files: MediaItem[], project: ProjectInfo) => void;
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'folder' | 'other';
  parentFolderId?: string; // Parent folder ID for project association
}

export interface LazyImageProps {
  src: string;
  alt?: string;
  className?: string;
  fallbackIcon?: ReactNode;
  onError?: () => void;
}

// Dialog state types
export interface DeleteDialogState {
  open: boolean;
  item: MediaItem | null;
  permanent: boolean;
  bulk?: boolean;
}

export interface RenameDialogState {
  open: boolean;
  item: MediaItem | null;
  newName: string;
}

export interface CreateFolderDialogState {
  open: boolean;
  name: string;
}

export interface MoveDialogState {
  open: boolean;
  item: MediaItem | null;
  bulk?: boolean;
}

export interface InfoDialogState {
  open: boolean;
  item: MediaItem | null;
}
