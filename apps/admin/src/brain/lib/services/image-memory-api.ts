/**
 * 🧠 Image Memory API Service
 * 
 * API client for Brain Image Library operations
 * Handles image upload, analysis, search, and context building
 * 
 * @author LongSang (Elon Mode Activated 🚀)
 */

import { API_URL } from '@/config/api';
import type {
  ImageMemoryItem,
  ImageAnalysis,
  ImageCollection,
  CharacterProfile,
  LocationProfile,
  PromptAnalysis,
  ImageCategory,
  UploadImageRequest,
  UploadImageResponse,
  SearchImageMemoryRequest,
  SearchImageMemoryResponse,
  BuildContextRequest,
  BuildContextResponse,
  ImageMemoryStats,
} from '@/brain/types/image-memory.types';

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_USER_ID = '89917901-cf15-45c4-a7ad-8c4c9513347e';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB - compress if larger
const TARGET_FILE_SIZE = 2 * 1024 * 1024; // 2MB target after compression

function getUserId(): string {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem('userId');
    if (stored) return stored;
    window.localStorage.setItem('userId', DEFAULT_USER_ID);
  }
  return DEFAULT_USER_ID;
}

/**
 * 🚀 ELON MODE: Auto-compress large images before upload
 * Resizes images larger than MAX_FILE_SIZE to reduce bandwidth and speed up upload
 */
async function compressImage(file: File): Promise<File> {
  // Skip if already small enough
  if (file.size <= MAX_FILE_SIZE) {
    console.log('[Brain Upload] File size OK:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    return file;
  }

  console.log('[Brain Upload] 🚀 Compressing large file:', (file.size / 1024 / 1024).toFixed(2), 'MB');

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // Calculate new dimensions (max 2000px on longest side)
      let { width, height } = img;
      const maxDimension = 2000;
      
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      // Start with quality 0.8 and reduce until under target size
      let quality = 0.8;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            if (blob.size > TARGET_FILE_SIZE && quality > 0.3) {
              quality -= 0.1;
              tryCompress();
            } else {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              console.log('[Brain Upload] ✅ Compressed to:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
              resolve(compressedFile);
            }
          },
          'image/jpeg',
          quality
        );
      };

      tryCompress();
    };

    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = URL.createObjectURL(file);
  });
}

// =============================================================================
// IMAGE MEMORY API CLIENT
// =============================================================================

export class ImageMemoryAPI {
  private readonly baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  // ---------------------------------------------------------------------------
  // IMAGE OPERATIONS
  // ---------------------------------------------------------------------------

  /**
   * Upload and analyze an image
   * Uses AI Vision to extract metadata, categories, and generate embedding
   */
  async uploadAndAnalyze(request: UploadImageRequest): Promise<UploadImageResponse> {
    const userId = getUserId();
    
    const formData = new FormData();
    
    if (request.file) {
      console.log('[Brain Upload] Original file:', request.file.name, (request.file.size / 1024 / 1024).toFixed(2), 'MB', request.file.type);
      
      // 🚀 ELON MODE: Auto-compress large images
      const processedFile = await compressImage(request.file);
      formData.append('image', processedFile);
    } else if (request.imageUrl) {
      console.log('[Brain Upload] URL:', request.imageUrl);
      formData.append('imageUrl', request.imageUrl);
    } else {
      console.error('[Brain Upload] No image provided');
      return { success: false, error: 'No image provided' };
    }

    formData.append('userId', userId);
    if (request.domainId) formData.append('domainId', request.domainId);
    if (request.folderId) formData.append('folderId', request.folderId);
    if (request.collections) formData.append('collections', JSON.stringify(request.collections));
    if (request.customTags) formData.append('customTags', JSON.stringify(request.customTags));
    if (request.isOwnerPortrait) formData.append('isOwnerPortrait', 'true');
    if (request.characterName) formData.append('characterName', request.characterName);

    const uploadUrl = `${this.baseUrl}/brain/images/upload`;
    console.log('[Brain Upload] URL:', uploadUrl, 'userId:', userId);

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      console.log('[Brain Upload] Response status:', response.status);
      const data = await response.json();
      console.log('[Brain Upload] Response data:', data);
      return data;
    } catch (error) {
      console.error('Upload error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Analyze an image without storing (preview mode)
   */
  async analyzeImage(imageUrl: string): Promise<{ success: boolean; analysis?: ImageAnalysis; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/brain/images/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });

      return await response.json();
    } catch (error) {
      console.error('Analysis error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get all images in memory
   */
  async getImages(params?: {
    category?: ImageCategory;
    tags?: string[];
    folderId?: string;
    collection?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; data: ImageMemoryItem[]; total: number }> {
    const userId = getUserId();
    
    const searchParams = new URLSearchParams({ userId });
    if (params?.category) searchParams.append('category', params.category);
    if (params?.tags) searchParams.append('tags', params.tags.join(','));
    if (params?.folderId) searchParams.append('folderId', params.folderId);
    if (params?.collection) searchParams.append('collection', params.collection);
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.offset) searchParams.append('offset', String(params.offset));

    try {
      const response = await fetch(`${this.baseUrl}/brain/images?${searchParams}`);
      return await response.json();
    } catch (error) {
      console.error('Get images error:', error);
      return { success: false, data: [], total: 0 };
    }
  }

  /**
   * Get single image by ID
   */
  async getImage(imageId: string): Promise<{ success: boolean; data?: ImageMemoryItem; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/brain/images/${imageId}`);
      return await response.json();
    } catch (error) {
      console.error('Get image error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Update image metadata
   */
  async updateImage(imageId: string, updates: Partial<ImageMemoryItem>): Promise<{ success: boolean; data?: ImageMemoryItem; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/brain/images/${imageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      return await response.json();
    } catch (error) {
      console.error('Update image error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Delete image from memory
   */
  async deleteImage(imageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/brain/images/${imageId}`, {
        method: 'DELETE',
      });

      return await response.json();
    } catch (error) {
      console.error('Delete image error:', error);
      return { success: false, error: String(error) };
    }
  }

  // ---------------------------------------------------------------------------
  // SEMANTIC SEARCH
  // ---------------------------------------------------------------------------

  /**
   * Search images using natural language
   * Uses vector embeddings for semantic similarity
   */
  async searchImages(request: SearchImageMemoryRequest): Promise<SearchImageMemoryResponse> {
    const userId = getUserId();

    try {
      const response = await fetch(`${this.baseUrl}/brain/images/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...request, userId }),
      });

      return await response.json();
    } catch (error) {
      console.error('Search error:', error);
      return { success: false, data: [], total: 0, query: request.query };
    }
  }

  /**
   * Find similar images to a given image
   */
  async findSimilar(imageId: string, limit: number = 10): Promise<{ success: boolean; data: ImageMemoryItem[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/brain/images/${imageId}/similar?limit=${limit}`);
      return await response.json();
    } catch (error) {
      console.error('Find similar error:', error);
      return { success: false, data: [] };
    }
  }

  // ---------------------------------------------------------------------------
  // CONTEXT BUILDING (The Magic! 🚀)
  // ---------------------------------------------------------------------------

  /**
   * Analyze prompt and extract entities
   */
  async analyzePrompt(prompt: string): Promise<{ success: boolean; analysis?: PromptAnalysis; error?: string }> {
    const userId = getUserId();

    try {
      const response = await fetch(`${this.baseUrl}/brain/images/analyze-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, userId }),
      });

      return await response.json();
    } catch (error) {
      console.error('Prompt analysis error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Build generation context from prompt
   * This is the CORE feature - turns "tạo ảnh tôi chơi bida" into
   * full context with character refs, location refs, enhanced prompt
   */
  async buildGenerationContext(request: BuildContextRequest): Promise<BuildContextResponse> {
    const userId = getUserId();

    try {
      const response = await fetch(`${this.baseUrl}/brain/images/build-context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...request, userId }),
      });

      return await response.json();
    } catch (error) {
      console.error('Build context error:', error);
      return { success: false, error: String(error) };
    }
  }

  // ---------------------------------------------------------------------------
  // CHARACTER PROFILES
  // ---------------------------------------------------------------------------

  /**
   * Create a character profile
   */
  async createCharacter(profile: Omit<CharacterProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; data?: CharacterProfile; error?: string }> {
    const userId = getUserId();

    try {
      const response = await fetch(`${this.baseUrl}/brain/characters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, userId }),
      });

      return await response.json();
    } catch (error) {
      console.error('Create character error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get all character profiles
   */
  async getCharacters(): Promise<{ success: boolean; data: CharacterProfile[] }> {
    const userId = getUserId();

    try {
      const response = await fetch(`${this.baseUrl}/brain/characters?userId=${userId}`);
      return await response.json();
    } catch (error) {
      console.error('Get characters error:', error);
      return { success: false, data: [] };
    }
  }

  /**
   * Update character profile
   */
  async updateCharacter(characterId: string, updates: Partial<CharacterProfile>): Promise<{ success: boolean; data?: CharacterProfile; error?: string }> {
    try {
      // Convert camelCase to snake_case for database
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.isOwner !== undefined) dbUpdates.is_owner = updates.isOwner;
      if (updates.referenceImageIds !== undefined) dbUpdates.reference_image_ids = updates.referenceImageIds;
      if (updates.physicalTraits !== undefined) dbUpdates.physical_traits = updates.physicalTraits;
      if (updates.styleGuide !== undefined) dbUpdates.style_guide = updates.styleGuide;
      if (updates.voiceNotes !== undefined) dbUpdates.voice_notes = updates.voiceNotes;

      console.log('[API] updateCharacter:', characterId, 'updates:', dbUpdates);

      const response = await fetch(`${this.baseUrl}/brain/characters/${characterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbUpdates),
      });

      const data = await response.json();
      console.log('[API] updateCharacter response:', data);
      
      // Wrap raw response in success format
      if (data && data.id) {
        return { success: true, data };
      }
      return data;
    } catch (error) {
      console.error('Update character error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Delete character profile
   */
  async deleteCharacter(characterId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/brain/characters/${characterId}`, {
        method: 'DELETE',
      });

      return await response.json();
    } catch (error) {
      console.error('Delete character error:', error);
      return { success: false, error: String(error) };
    }
  }

  // ---------------------------------------------------------------------------
  // LOCATION PROFILES
  // ---------------------------------------------------------------------------

  /**
   * Create a location profile
   */
  async createLocation(profile: Omit<LocationProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; data?: LocationProfile; error?: string }> {
    const userId = getUserId();

    try {
      const response = await fetch(`${this.baseUrl}/brain/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, userId }),
      });

      return await response.json();
    } catch (error) {
      console.error('Create location error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get all location profiles
   */
  async getLocations(): Promise<{ success: boolean; data: LocationProfile[] }> {
    const userId = getUserId();

    try {
      const response = await fetch(`${this.baseUrl}/brain/locations?userId=${userId}`);
      return await response.json();
    } catch (error) {
      console.error('Get locations error:', error);
      return { success: false, data: [] };
    }
  }

  /**
   * Update location profile
   */
  async updateLocation(locationId: string, updates: Partial<LocationProfile>): Promise<{ success: boolean; data?: LocationProfile; error?: string }> {
    try {
      // Convert camelCase to snake_case for database
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.referenceImageIds !== undefined) dbUpdates.reference_image_ids = updates.referenceImageIds;
      if (updates.locationType !== undefined) dbUpdates.location_type = updates.locationType;
      if (updates.address !== undefined) dbUpdates.address = updates.address;
      if (updates.coordinates !== undefined) dbUpdates.coordinates = updates.coordinates;

      console.log('[API] updateLocation:', locationId, 'updates:', dbUpdates);

      const response = await fetch(`${this.baseUrl}/brain/locations/${locationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbUpdates),
      });

      const data = await response.json();
      console.log('[API] updateLocation response:', data);
      
      // Wrap raw response in success format
      if (data && data.id) {
        return { success: true, data };
      }
      return data;
    } catch (error) {
      console.error('Update location error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Delete location profile
   */
  async deleteLocation(locationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/brain/locations/${locationId}`, {
        method: 'DELETE',
      });

      return await response.json();
    } catch (error) {
      console.error('Delete location error:', error);
      return { success: false, error: String(error) };
    }
  }

  // ---------------------------------------------------------------------------
  // COLLECTIONS
  // ---------------------------------------------------------------------------

  /**
   * Create a collection
   */
  async createCollection(name: string, description?: string): Promise<{ success: boolean; data?: ImageCollection; error?: string }> {
    const userId = getUserId();

    try {
      const response = await fetch(`${this.baseUrl}/brain/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, userId }),
      });

      return await response.json();
    } catch (error) {
      console.error('Create collection error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get all collections
   */
  async getCollections(): Promise<{ success: boolean; data: ImageCollection[] }> {
    const userId = getUserId();

    try {
      const response = await fetch(`${this.baseUrl}/brain/collections?userId=${userId}`);
      return await response.json();
    } catch (error) {
      console.error('Get collections error:', error);
      return { success: false, data: [] };
    }
  }

  /**
   * Add images to collection
   */
  async addToCollection(collectionId: string, imageIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/brain/collections/${collectionId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds }),
      });

      return await response.json();
    } catch (error) {
      console.error('Add to collection error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Remove images from collection
   */
  async removeFromCollection(collectionId: string, imageIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/brain/collections/${collectionId}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds }),
      });

      return await response.json();
    } catch (error) {
      console.error('Remove from collection error:', error);
      return { success: false, error: String(error) };
    }
  }

  // ---------------------------------------------------------------------------
  // STATISTICS
  // ---------------------------------------------------------------------------

  /**
   * Get image memory statistics
   */
  async getStats(): Promise<{ success: boolean; data?: ImageMemoryStats; error?: string }> {
    const userId = getUserId();

    try {
      const response = await fetch(`${this.baseUrl}/brain/stats?userId=${userId}`);
      return await response.json();
    } catch (error) {
      console.error('Get stats error:', error);
      return { success: false, error: String(error) };
    }
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const imageMemoryApi = new ImageMemoryAPI();

// =============================================================================
// LOCAL STORAGE FALLBACK (For offline/demo mode)
// =============================================================================

const STORAGE_KEY = 'brain-image-memory';

export class LocalImageMemoryStore {
  private getStore(): { images: ImageMemoryItem[]; characters: CharacterProfile[]; locations: LocationProfile[]; collections: ImageCollection[] } {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load local store:', e);
    }
    return { images: [], characters: [], locations: [], collections: [] };
  }

  private saveStore(store: { images: ImageMemoryItem[]; characters: CharacterProfile[]; locations: LocationProfile[]; collections: ImageCollection[] }) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      console.error('Failed to save local store:', e);
    }
  }

  // Add image to local store
  addImage(image: ImageMemoryItem) {
    const store = this.getStore();
    store.images.push(image);
    this.saveStore(store);
  }

  // Get all images from local store
  getImages(): ImageMemoryItem[] {
    return this.getStore().images;
  }

  // Search images by tags/description locally
  searchImages(query: string): ImageMemoryItem[] {
    const store = this.getStore();
    const lowerQuery = query.toLowerCase();
    
    return store.images.filter(img => {
      const searchText = [
        img.analysis.title,
        img.analysis.description,
        ...img.analysis.tags,
        img.customTitle,
        img.customDescription,
        ...(img.customTags || []),
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchText.includes(lowerQuery);
    });
  }

  // Add character profile
  addCharacter(character: CharacterProfile) {
    const store = this.getStore();
    store.characters.push(character);
    this.saveStore(store);
  }

  // Get all characters
  getCharacters(): CharacterProfile[] {
    return this.getStore().characters;
  }

  // Add location profile
  addLocation(location: LocationProfile) {
    const store = this.getStore();
    store.locations.push(location);
    this.saveStore(store);
  }

  // Get all locations
  getLocations(): LocationProfile[] {
    return this.getStore().locations;
  }
}

export const localImageMemoryStore = new LocalImageMemoryStore();
