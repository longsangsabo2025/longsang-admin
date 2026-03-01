/**
 * 🧠 useImageMemory Hook
 * 
 * React Query hooks for Brain Image Library operations
 * Manages image memory, characters, locations, and generation context
 * 
 * @author LongSang (Elon Mode 🚀)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  imageMemoryApi, 
  localImageMemoryStore 
} from '@/brain/lib/services/image-memory-api';
import type {
  ImageMemoryItem,
  CharacterProfile,
  LocationProfile,
  ImageCategory,
  UploadImageRequest,
  SearchImageMemoryRequest,
  BuildContextRequest,
} from '@/brain/types/image-memory.types';

// =============================================================================
// QUERY KEYS
// =============================================================================

export const imageMemoryKeys = {
  all: ['brain', 'image-memory'] as const,
  images: () => [...imageMemoryKeys.all, 'images'] as const,
  image: (id: string) => [...imageMemoryKeys.images(), id] as const,
  search: (query: string) => [...imageMemoryKeys.images(), 'search', query] as const,
  similar: (id: string) => [...imageMemoryKeys.images(), 'similar', id] as const,
  characters: () => [...imageMemoryKeys.all, 'characters'] as const,
  character: (id: string) => [...imageMemoryKeys.characters(), id] as const,
  locations: () => [...imageMemoryKeys.all, 'locations'] as const,
  location: (id: string) => [...imageMemoryKeys.locations(), id] as const,
  collections: () => [...imageMemoryKeys.all, 'collections'] as const,
  collection: (id: string) => [...imageMemoryKeys.collections(), id] as const,
  stats: () => [...imageMemoryKeys.all, 'stats'] as const,
  context: (prompt: string) => [...imageMemoryKeys.all, 'context', prompt] as const,
};

// =============================================================================
// IMAGE HOOKS
// =============================================================================

/**
 * Get all images in memory with optional filters
 */
export function useImages(params?: {
  category?: ImageCategory;
  tags?: string[];
  folderId?: string;
  collection?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: [...imageMemoryKeys.images(), params],
    queryFn: () => imageMemoryApi.getImages(params),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Get single image by ID
 */
export function useImage(imageId: string) {
  return useQuery({
    queryKey: imageMemoryKeys.image(imageId),
    queryFn: () => imageMemoryApi.getImage(imageId),
    enabled: !!imageId,
  });
}

/**
 * Upload and analyze image mutation
 */
export function useUploadImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UploadImageRequest) => imageMemoryApi.uploadAndAnalyze(request),
    onSuccess: (result) => {
      if (result.success && result.data) {
        // Also save to local storage for offline access
        localImageMemoryStore.addImage(result.data);
        
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: imageMemoryKeys.images() });
        queryClient.invalidateQueries({ queryKey: imageMemoryKeys.stats() });
        
        toast.success('Đã phân tích và lưu ảnh vào Brain Library! 🧠', {
          description: `Danh mục: ${result.data.analysis.primaryCategory}`,
        });
      }
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Không thể upload ảnh', {
        description: String(error),
      });
    },
  });
}

/**
 * Analyze image without storing (preview)
 */
export function useAnalyzeImage() {
  return useMutation({
    mutationFn: (imageUrl: string) => imageMemoryApi.analyzeImage(imageUrl),
    onError: (error) => {
      console.error('Analysis error:', error);
      toast.error('Không thể phân tích ảnh');
    },
  });
}

/**
 * Update image metadata
 */
export function useUpdateImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ imageId, updates }: { imageId: string; updates: Partial<ImageMemoryItem> }) =>
      imageMemoryApi.updateImage(imageId, updates),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: imageMemoryKeys.image(variables.imageId) });
        queryClient.invalidateQueries({ queryKey: imageMemoryKeys.images() });
        toast.success('Đã cập nhật thông tin ảnh');
      }
    },
    onError: (error) => {
      toast.error('Không thể cập nhật ảnh');
    },
  });
}

/**
 * Delete image from memory
 */
export function useDeleteImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageId: string) => imageMemoryApi.deleteImage(imageId),
    onSuccess: (result, imageId) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: imageMemoryKeys.images() });
        queryClient.invalidateQueries({ queryKey: imageMemoryKeys.stats() });
        toast.success('Đã xóa ảnh khỏi Brain Library');
      }
    },
    onError: (error) => {
      toast.error('Không thể xóa ảnh');
    },
  });
}

/**
 * Toggle favorite status
 */
export function useToggleFavorite() {
  const updateImage = useUpdateImage();

  return (imageId: string, currentFavorite: boolean) => {
    updateImage.mutate({
      imageId,
      updates: { isFavorite: !currentFavorite },
    });
  };
}

// =============================================================================
// SEARCH HOOKS
// =============================================================================

/**
 * Search images using natural language
 */
export function useSearchImages(query: string, options?: Partial<SearchImageMemoryRequest>) {
  return useQuery({
    queryKey: imageMemoryKeys.search(query),
    queryFn: () => imageMemoryApi.searchImages({ query, ...options }),
    enabled: query.length > 2,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Search images mutation (for on-demand search)
 */
export function useSearchImagesMutation() {
  return useMutation({
    mutationFn: (request: SearchImageMemoryRequest) => imageMemoryApi.searchImages(request),
  });
}

/**
 * Find similar images to a given image
 */
export function useFindSimilar(imageId: string, limit: number = 10) {
  return useQuery({
    queryKey: imageMemoryKeys.similar(imageId),
    queryFn: () => imageMemoryApi.findSimilar(imageId, limit),
    enabled: !!imageId,
  });
}

// =============================================================================
// CONTEXT BUILDING HOOKS (The Magic! 🚀)
// =============================================================================

/**
 * Analyze prompt and extract entities
 */
export function useAnalyzePrompt() {
  return useMutation({
    mutationFn: (prompt: string) => imageMemoryApi.analyzePrompt(prompt),
  });
}

/**
 * Build generation context from prompt
 * This is THE CORE FEATURE - turns natural language into
 * full generation context with references
 */
export function useBuildContext() {
  return useMutation({
    mutationFn: (request: BuildContextRequest) => imageMemoryApi.buildGenerationContext(request),
    onSuccess: (result) => {
      if (result.success && result.context) {
        const refs = [
          result.context.characterReferences.length,
          result.context.locationReferences.length,
          result.context.styleReferences.length,
        ].reduce((a, b) => a + b, 0);
        
        if (refs > 0) {
          toast.success(`Đã tìm thấy ${refs} ảnh tham chiếu từ Brain! 🧠`, {
            description: `Confidence: ${Math.round(result.context.contextConfidence * 100)}%`,
          });
        }
      }
    },
    onError: (error) => {
      console.error('Build context error:', error);
    },
  });
}

/**
 * Get generation context (query version)
 */
export function useGenerationContext(prompt: string, enabled: boolean = true) {
  return useQuery({
    queryKey: imageMemoryKeys.context(prompt),
    queryFn: () => imageMemoryApi.buildGenerationContext({ prompt }),
    enabled: enabled && prompt.length > 5,
    staleTime: 300000, // 5 minutes
  });
}

// =============================================================================
// CHARACTER HOOKS
// =============================================================================

/**
 * Get all character profiles
 */
export function useCharacters() {
  return useQuery({
    queryKey: imageMemoryKeys.characters(),
    queryFn: () => imageMemoryApi.getCharacters(),
  });
}

/**
 * Create character profile
 */
export function useCreateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profile: Omit<CharacterProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
      imageMemoryApi.createCharacter(profile),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: imageMemoryKeys.characters() });
        toast.success(`Đã tạo nhân vật "${result.data?.name}"! 🎭`);
      }
    },
    onError: (error) => {
      toast.error('Không thể tạo nhân vật');
    },
  });
}

/**
 * Update character profile
 */
export function useUpdateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ characterId, updates }: { characterId: string; updates: Partial<CharacterProfile> }) =>
      imageMemoryApi.updateCharacter(characterId, updates),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: imageMemoryKeys.character(variables.characterId) });
        queryClient.invalidateQueries({ queryKey: imageMemoryKeys.characters() });
        toast.success('Đã cập nhật nhân vật');
      }
    },
  });
}

/**
 * Delete character profile
 */
export function useDeleteCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (characterId: string) => imageMemoryApi.deleteCharacter(characterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: imageMemoryKeys.characters() });
      toast.success('Đã xóa nhân vật');
    },
  });
}

// =============================================================================
// LOCATION HOOKS
// =============================================================================

/**
 * Get all location profiles
 */
export function useLocations() {
  return useQuery({
    queryKey: imageMemoryKeys.locations(),
    queryFn: () => imageMemoryApi.getLocations(),
  });
}

/**
 * Create location profile
 */
export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profile: Omit<LocationProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
      imageMemoryApi.createLocation(profile),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: imageMemoryKeys.locations() });
        toast.success(`Đã tạo địa điểm "${result.data?.name}"! 📍`);
      }
    },
    onError: (error) => {
      toast.error('Không thể tạo địa điểm');
    },
  });
}

/**
 * Update location profile
 */
export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ locationId, updates }: { locationId: string; updates: Partial<LocationProfile> }) =>
      imageMemoryApi.updateLocation(locationId, updates),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: imageMemoryKeys.location(variables.locationId) });
        queryClient.invalidateQueries({ queryKey: imageMemoryKeys.locations() });
        toast.success('Đã cập nhật địa điểm');
      }
    },
  });
}

/**
 * Delete location profile
 */
export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (locationId: string) => imageMemoryApi.deleteLocation(locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: imageMemoryKeys.locations() });
      toast.success('Đã xóa địa điểm');
    },
  });
}

// =============================================================================
// COLLECTION HOOKS
// =============================================================================

/**
 * Get all collections
 */
export function useCollections() {
  return useQuery({
    queryKey: imageMemoryKeys.collections(),
    queryFn: () => imageMemoryApi.getCollections(),
  });
}

/**
 * Create collection
 */
export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      imageMemoryApi.createCollection(name, description),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: imageMemoryKeys.collections() });
        toast.success(`Đã tạo bộ sưu tập "${result.data?.name}"! 📁`);
      }
    },
  });
}

/**
 * Add images to collection
 */
export function useAddToCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, imageIds }: { collectionId: string; imageIds: string[] }) =>
      imageMemoryApi.addToCollection(collectionId, imageIds),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: imageMemoryKeys.collection(variables.collectionId) });
        queryClient.invalidateQueries({ queryKey: imageMemoryKeys.collections() });
        toast.success('Đã thêm ảnh vào bộ sưu tập');
      }
    },
  });
}

/**
 * Remove images from collection
 */
export function useRemoveFromCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, imageIds }: { collectionId: string; imageIds: string[] }) =>
      imageMemoryApi.removeFromCollection(collectionId, imageIds),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: imageMemoryKeys.collection(variables.collectionId) });
        queryClient.invalidateQueries({ queryKey: imageMemoryKeys.collections() });
        toast.success('Đã xóa ảnh khỏi bộ sưu tập');
      }
    },
  });
}

// =============================================================================
// STATISTICS HOOKS
// =============================================================================

/**
 * Get image memory statistics
 */
export function useImageMemoryStats() {
  return useQuery({
    queryKey: imageMemoryKeys.stats(),
    queryFn: () => imageMemoryApi.getStats(),
    staleTime: 60000, // 1 minute
  });
}

// =============================================================================
// COMBINED HOOK FOR BRAIN IMAGE LIBRARY
// =============================================================================

/**
 * All-in-one hook for Brain Image Library
 * Use this for quick access to all image memory operations
 */
export function useBrainImageLibrary() {
  const images = useImages();
  const characters = useCharacters();
  const locations = useLocations();
  const collections = useCollections();
  const stats = useImageMemoryStats();
  
  const uploadImage = useUploadImage();
  const analyzeImage = useAnalyzeImage();
  const searchImages = useSearchImagesMutation();
  const buildContext = useBuildContext();
  
  const createCharacter = useCreateCharacter();
  const createLocation = useCreateLocation();
  const createCollection = useCreateCollection();

  return {
    // Data
    images: images.data?.data || [],
    characters: characters.data?.data || [],
    locations: locations.data?.data || [],
    collections: collections.data?.data || [],
    stats: stats.data?.data,
    
    // Loading states
    isLoading: images.isLoading || characters.isLoading || locations.isLoading,
    
    // Mutations
    uploadImage: uploadImage.mutate,
    isUploading: uploadImage.isPending,
    
    analyzeImage: analyzeImage.mutate,
    isAnalyzing: analyzeImage.isPending,
    analysisResult: analyzeImage.data?.analysis,
    
    searchImages: searchImages.mutate,
    isSearching: searchImages.isPending,
    searchResults: searchImages.data?.data || [],
    
    buildContext: buildContext.mutate,
    isBuildingContext: buildContext.isPending,
    generationContext: buildContext.data?.context,
    
    createCharacter: createCharacter.mutate,
    createLocation: createLocation.mutate,
    createCollection: createCollection.mutate,
    
    // Refetch
    refetch: () => {
      images.refetch();
      characters.refetch();
      locations.refetch();
      collections.refetch();
      stats.refetch();
    },
  };
}
