/**
 * useImageBrainLibrary - Custom hook with all state & business logic
 */
import { useState, useCallback, useMemo } from 'react';
import {
  useBrainImageLibrary,
  useDeleteImage,
  useUpdateImage,
  useUpdateCharacter,
  useUpdateLocation,
} from '@/brain/hooks/useImageMemory';
import type {
  ImageMemoryItem,
  ImageCategory,
} from '@/brain/types/image-memory.types';
import { toast } from 'sonner';
import { normalizeImage, normalizeCharacter, normalizeLocation } from './utils';
import type { UseImageBrainLibraryReturn } from './types';

interface UseImageBrainLibraryOptions {
  onSelectImages?: (images: ImageMemoryItem[]) => void;
  selectionMode?: boolean;
  maxSelection?: number;
}

export function useImageBrainLibraryHook({
  onSelectImages,
  selectionMode = false,
  maxSelection = 5,
}: UseImageBrainLibraryOptions): UseImageBrainLibraryReturn {
  console.log('[ImageBrainLibrary] Rendering component');

  // API Hooks
  const {
    images,
    characters,
    locations,
    collections,
    stats,
    isLoading,
    uploadImage,
    isUploading,
    searchImages,
    isSearching,
    searchResults,
    createCharacter,
    createLocation,
    createCollection,
    refetch,
  } = useBrainImageLibrary();

  console.log('[ImageBrainLibrary] Data:', {
    imagesCount: images?.length,
    charactersCount: characters?.length,
    locationsCount: locations?.length,
    collectionsCount: collections?.length,
    isLoading,
    stats,
  });

  const deleteImage = useDeleteImage();
  const updateImage = useUpdateImage();
  const updateCharacter = useUpdateCharacter();
  const updateLocation = useUpdateLocation();

  // State
  const [activeTab, setActiveTab] = useState<'all' | 'characters' | 'locations' | 'collections'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ImageCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [detailImage, setDetailImage] = useState<ImageMemoryItem | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Create dialogs state
  const [showCreateCharacterDialog, setShowCreateCharacterDialog] = useState(false);
  const [showCreateLocationDialog, setShowCreateLocationDialog] = useState(false);
  const [showCreateCollectionDialog, setShowCreateCollectionDialog] = useState(false);
  const [addImageToCharacterId, setAddImageToCharacterId] = useState<string | null>(null);
  const [addImageToLocationId, setAddImageToLocationId] = useState<string | null>(null);

  // Form state for new entities
  const [newCharacter, setNewCharacter] = useState({ name: '', description: '', isOwner: false });
  const [newLocation, setNewLocation] = useState({ name: '', description: '' });
  const [newCollection, setNewCollection] = useState({ name: '', description: '' });

  // Normalize and filter images
  const normalizedImages = useMemo(() => {
    return (images || []).map(normalizeImage);
  }, [images]);

  const normalizedSearchResults = useMemo(() => {
    return (searchResults || []).map(normalizeImage);
  }, [searchResults]);

  const normalizedCharacters = useMemo(() => {
    return (characters || []).map(normalizeCharacter);
  }, [characters]);

  const normalizedLocations = useMemo(() => {
    return (locations || []).map(normalizeLocation);
  }, [locations]);

  // Filtered images
  const filteredImages = useMemo(() => {
    let result = searchQuery ? normalizedSearchResults : normalizedImages;

    if (selectedCategory !== 'all') {
      result = result.filter((img) => img.analysis?.primaryCategory === selectedCategory);
    }

    return result;
  }, [normalizedImages, normalizedSearchResults, searchQuery, selectedCategory]);

  // Handlers
  const handleUpload = useCallback((files: File[]) => {
    files.forEach((file) => {
      uploadImage({ file });
    });
  }, [uploadImage]);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      searchImages({ query: searchQuery });
    }
  }, [searchQuery, searchImages]);

  const handleSelectImage = useCallback((image: ImageMemoryItem) => {
    if (selectionMode) {
      setSelectedImages((prev) => {
        const next = new Set(prev);
        if (next.has(image.id)) {
          next.delete(image.id);
        } else if (next.size < maxSelection) {
          next.add(image.id);
        }
        return next;
      });
    } else {
      setDetailImage(image);
    }
  }, [selectionMode, maxSelection]);

  const handleDeleteImage = useCallback((imageId: string) => {
    if (confirm('Xóa ảnh này khỏi Brain Library?')) {
      deleteImage.mutate(imageId);
    }
  }, [deleteImage]);

  const handleUpdateImage = useCallback((imageId: string, updates: Partial<ImageMemoryItem>) => {
    updateImage.mutate({ imageId, updates });
  }, [updateImage]);

  const handleToggleFavorite = useCallback((imageId: string, isFavorite: boolean) => {
    updateImage.mutate({ imageId, updates: { isFavorite: !isFavorite } });
  }, [updateImage]);

  // Handlers for creating characters, locations, collections
  const handleCreateCharacter = useCallback(() => {
    if (!newCharacter.name.trim()) {
      toast.error('Vui lòng nhập tên nhân vật');
      return;
    }
    createCharacter({
      name: newCharacter.name,
      description: newCharacter.description,
      isOwner: newCharacter.isOwner,
      referenceImageIds: Array.from(selectedImages),
      primaryImageId: '',
      attributes: {},
      positivePromptKeywords: [],
      negativePromptKeywords: [],
    });
    setShowCreateCharacterDialog(false);
    setNewCharacter({ name: '', description: '', isOwner: false });
    setSelectedImages(new Set());
  }, [newCharacter, createCharacter, selectedImages]);

  const handleCreateLocation = useCallback(() => {
    if (!newLocation.name.trim()) {
      toast.error('Vui lòng nhập tên địa điểm');
      return;
    }
    createLocation({
      name: newLocation.name,
      description: newLocation.description,
      referenceImageIds: Array.from(selectedImages),
      type: 'mixed',
      attributes: {},
      positivePromptKeywords: [],
      negativePromptKeywords: [],
    });
    setShowCreateLocationDialog(false);
    setNewLocation({ name: '', description: '' });
    setSelectedImages(new Set());
  }, [newLocation, createLocation, selectedImages]);

  const handleCreateCollection = useCallback(() => {
    if (!newCollection.name.trim()) {
      toast.error('Vui lòng nhập tên bộ sưu tập');
      return;
    }
    createCollection({
      name: newCollection.name,
      description: newCollection.description,
    });
    setShowCreateCollectionDialog(false);
    setNewCollection({ name: '', description: '' });
    setSelectedImages(new Set());
    toast.success('Đã tạo bộ sưu tập mới!');
  }, [newCollection, createCollection, selectedImages]);

  // Handler: Add images to character
  const handleAddImagesToCharacter = useCallback((imageIds: string[]) => {
    if (!addImageToCharacterId) return;

    const character = normalizedCharacters.find(c => c.id === addImageToCharacterId);
    if (!character) return;

    const existingIds = character.referenceImageIds || [];
    const newIds = [...new Set([...existingIds, ...imageIds])];

    updateCharacter.mutate({
      characterId: addImageToCharacterId,
      updates: { referenceImageIds: newIds },
    }, {
      onSuccess: () => {
        toast.success(`Đã thêm ${imageIds.length} ảnh cho ${character.name}`);
        setAddImageToCharacterId(null);
        setSelectedImages(new Set());
        refetch();
      },
      onError: (error) => {
        toast.error(`Lỗi: ${error.message}`);
      },
    });
  }, [addImageToCharacterId, normalizedCharacters, updateCharacter, refetch]);

  // Handler: Add images to location
  const handleAddImagesToLocation = useCallback((imageIds: string[]) => {
    if (!addImageToLocationId) return;

    const location = normalizedLocations.find(l => l.id === addImageToLocationId);
    if (!location) return;

    const existingIds = location.referenceImageIds || [];
    const newIds = [...new Set([...existingIds, ...imageIds])];

    updateLocation.mutate({
      locationId: addImageToLocationId,
      updates: { referenceImageIds: newIds },
    }, {
      onSuccess: () => {
        toast.success(`Đã thêm ${imageIds.length} ảnh cho ${location.name}`);
        setAddImageToLocationId(null);
        setSelectedImages(new Set());
        refetch();
      },
      onError: (error) => {
        toast.error(`Lỗi: ${error.message}`);
      },
    });
  }, [addImageToLocationId, normalizedLocations, updateLocation, refetch]);

  // Selected images list for parent callback
  const selectedImagesList = useMemo(() => {
    return images.filter((img) => selectedImages.has(img.id));
  }, [images, selectedImages]);

  return {
    // Data
    normalizedImages,
    normalizedCharacters,
    normalizedLocations,
    collections,
    filteredImages,
    stats,
    images,

    // Loading states
    isLoading,
    isUploading,
    isSearching,

    // Search & filter
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    viewMode,
    setViewMode,
    handleSearch,

    // Tabs
    activeTab,
    setActiveTab,

    // Selection
    selectedImages,
    setSelectedImages,
    selectedImagesList,
    selectionMode,
    maxSelection,

    // Image actions
    handleUpload,
    handleSelectImage,
    handleDeleteImage,
    handleUpdateImage,
    handleToggleFavorite,

    // Dialog state
    detailImage,
    setDetailImage,
    showUploadDialog,
    setShowUploadDialog,

    // Create entity dialogs
    showCreateCharacterDialog,
    setShowCreateCharacterDialog,
    showCreateLocationDialog,
    setShowCreateLocationDialog,
    showCreateCollectionDialog,
    setShowCreateCollectionDialog,

    // Add images to entity
    addImageToCharacterId,
    setAddImageToCharacterId,
    addImageToLocationId,
    setAddImageToLocationId,

    // Form state
    newCharacter,
    setNewCharacter,
    newLocation,
    setNewLocation,
    newCollection,
    setNewCollection,

    // Handlers
    handleCreateCharacter,
    handleCreateLocation,
    handleCreateCollection,
    handleAddImagesToCharacter,
    handleAddImagesToLocation,

    // Parent callback
    onSelectImages,
  };
}
