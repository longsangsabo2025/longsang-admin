/**
 * Types for ImageBrainLibrary components
 */
import type { ImageMemoryItem, ImageCategory } from '@/brain/types/image-memory.types';

// =============================================================================
// COMPONENT PROPS
// =============================================================================

export interface ImageCardProps {
  image: ImageMemoryItem;
  onSelect?: (image: ImageMemoryItem) => void;
  onEdit?: (image: ImageMemoryItem) => void;
  onDelete?: (imageId: string) => void;
  onToggleFavorite?: (imageId: string, isFavorite: boolean) => void;
  selected?: boolean;
  compact?: boolean;
}

export interface UploadDropzoneProps {
  onUpload: (files: File[]) => void;
  isUploading: boolean;
}

export interface ImageDetailDialogProps {
  image: ImageMemoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (updates: Partial<ImageMemoryItem>) => void;
}

export interface ImageBrainLibraryProps {
  onSelectImages?: (images: ImageMemoryItem[]) => void;
  selectionMode?: boolean;
  maxSelection?: number;
  className?: string;
}

// =============================================================================
// DIALOG PROPS
// =============================================================================

export interface ImageBrainDialogsProps {
  // Upload dialog
  showUploadDialog: boolean;
  setShowUploadDialog: (v: boolean) => void;
  handleUpload: (files: File[]) => void;
  isUploading: boolean;

  // Detail dialog
  detailImage: ImageMemoryItem | null;
  setDetailImage: (img: ImageMemoryItem | null) => void;
  handleUpdateImage: (imageId: string, updates: Partial<ImageMemoryItem>) => void;

  // Create character dialog
  showCreateCharacterDialog: boolean;
  setShowCreateCharacterDialog: (v: boolean) => void;
  newCharacter: { name: string; description: string; isOwner: boolean };
  setNewCharacter: React.Dispatch<React.SetStateAction<{ name: string; description: string; isOwner: boolean }>>;
  handleCreateCharacter: () => void;
  selectedImagesSize: number;

  // Create location dialog
  showCreateLocationDialog: boolean;
  setShowCreateLocationDialog: (v: boolean) => void;
  newLocation: { name: string; description: string };
  setNewLocation: React.Dispatch<React.SetStateAction<{ name: string; description: string }>>;
  handleCreateLocation: () => void;

  // Create collection dialog
  showCreateCollectionDialog: boolean;
  setShowCreateCollectionDialog: (v: boolean) => void;
  newCollection: { name: string; description: string };
  setNewCollection: React.Dispatch<React.SetStateAction<{ name: string; description: string }>>;
  handleCreateCollection: () => void;

  // Add images to character dialog
  addImageToCharacterId: string | null;
  setAddImageToCharacterId: (id: string | null) => void;
  normalizedCharacters: any[];
  normalizedImages: ImageMemoryItem[];
  selectedImages: Set<string>;
  setSelectedImages: React.Dispatch<React.SetStateAction<Set<string>>>;
  handleAddImagesToCharacter: (imageIds: string[]) => void;

  // Add images to location dialog
  addImageToLocationId: string | null;
  setAddImageToLocationId: (id: string | null) => void;
  normalizedLocations: any[];
  handleAddImagesToLocation: (imageIds: string[]) => void;
}

// =============================================================================
// HOOK RETURN TYPE
// =============================================================================

export interface UseImageBrainLibraryReturn {
  // Data
  normalizedImages: ImageMemoryItem[];
  normalizedCharacters: any[];
  normalizedLocations: any[];
  collections: any[];
  filteredImages: ImageMemoryItem[];
  stats: any;
  images: any[];

  // Loading states
  isLoading: boolean;
  isUploading: boolean;
  isSearching: boolean;

  // Search & filter
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: ImageCategory | 'all';
  setSelectedCategory: (c: ImageCategory | 'all') => void;
  viewMode: 'grid' | 'list';
  setViewMode: (m: 'grid' | 'list') => void;
  handleSearch: () => void;

  // Tabs
  activeTab: 'all' | 'characters' | 'locations' | 'collections';
  setActiveTab: (t: 'all' | 'characters' | 'locations' | 'collections') => void;

  // Selection
  selectedImages: Set<string>;
  setSelectedImages: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedImagesList: any[];
  selectionMode: boolean;
  maxSelection: number;

  // Image actions
  handleUpload: (files: File[]) => void;
  handleSelectImage: (image: ImageMemoryItem) => void;
  handleDeleteImage: (imageId: string) => void;
  handleUpdateImage: (imageId: string, updates: Partial<ImageMemoryItem>) => void;
  handleToggleFavorite: (imageId: string, isFavorite: boolean) => void;

  // Dialog state
  detailImage: ImageMemoryItem | null;
  setDetailImage: (img: ImageMemoryItem | null) => void;
  showUploadDialog: boolean;
  setShowUploadDialog: (v: boolean) => void;

  // Create entity dialogs
  showCreateCharacterDialog: boolean;
  setShowCreateCharacterDialog: (v: boolean) => void;
  showCreateLocationDialog: boolean;
  setShowCreateLocationDialog: (v: boolean) => void;
  showCreateCollectionDialog: boolean;
  setShowCreateCollectionDialog: (v: boolean) => void;

  // Add images to entity
  addImageToCharacterId: string | null;
  setAddImageToCharacterId: (id: string | null) => void;
  addImageToLocationId: string | null;
  setAddImageToLocationId: (id: string | null) => void;

  // Form state
  newCharacter: { name: string; description: string; isOwner: boolean };
  setNewCharacter: React.Dispatch<React.SetStateAction<{ name: string; description: string; isOwner: boolean }>>;
  newLocation: { name: string; description: string };
  setNewLocation: React.Dispatch<React.SetStateAction<{ name: string; description: string }>>;
  newCollection: { name: string; description: string };
  setNewCollection: React.Dispatch<React.SetStateAction<{ name: string; description: string }>>;

  // Handlers
  handleCreateCharacter: () => void;
  handleCreateLocation: () => void;
  handleCreateCollection: () => void;
  handleAddImagesToCharacter: (imageIds: string[]) => void;
  handleAddImagesToLocation: (imageIds: string[]) => void;

  // Parent callback
  onSelectImages?: (images: ImageMemoryItem[]) => void;
}
