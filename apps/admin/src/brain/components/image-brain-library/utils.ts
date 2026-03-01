/**
 * Utility functions for ImageBrainLibrary
 * Data normalization: API snake_case -> frontend camelCase
 */
import type { ImageMemoryItem } from '@/brain/types/image-memory.types';

/**
 * Normalize API response (snake_case) to frontend types (camelCase)
 */
export function normalizeImage(raw: any): ImageMemoryItem {
  return {
    id: raw.id,
    userId: raw.user_id || raw.userId,
    imageUrl: raw.image_url || raw.imageUrl,
    thumbnailUrl: raw.thumbnail_url || raw.thumbnailUrl,
    localPath: raw.local_path || raw.localPath,
    analysis: raw.analysis || {},
    embedding: raw.embedding,
    embeddingModel: raw.embedding_model || raw.embeddingModel,
    domainId: raw.domain_id || raw.domainId,
    folderId: raw.folder_id || raw.folderId,
    collections: raw.collections ? (typeof raw.collections === 'string' ? raw.collections.split(',').filter(Boolean) : raw.collections) : [],
    customTitle: raw.custom_title || raw.customTitle,
    customTags: raw.custom_tags || raw.customTags,
    customDescription: raw.custom_description || raw.customDescription,
    isOwnerPortrait: raw.is_owner_portrait || raw.isOwnerPortrait || false,
    characterName: raw.character_name || raw.characterName,
    useCount: raw.use_count || raw.useCount || 0,
    lastUsedAt: raw.last_used_at || raw.lastUsedAt,
    isFavorite: raw.is_favorite || raw.isFavorite || false,
    isArchived: raw.is_archived || raw.isArchived || false,
    originalFilename: raw.original_filename || raw.originalFilename,
    fileSize: raw.file_size || raw.fileSize,
    width: raw.width,
    height: raw.height,
    format: raw.format,
    createdAt: raw.created_at || raw.createdAt,
    updatedAt: raw.updated_at || raw.updatedAt,
    analyzedAt: raw.analyzed_at || raw.analyzedAt,
  } as ImageMemoryItem;
}

/**
 * Normalize Character API response (snake_case) to frontend types (camelCase)
 */
export function normalizeCharacter(raw: any): any {
  return {
    id: raw.id,
    userId: raw.user_id || raw.userId,
    name: raw.name,
    description: raw.description,
    isOwner: raw.is_owner || raw.isOwner || false,
    referenceImageIds: raw.reference_image_ids || raw.referenceImageIds || [],
    physicalTraits: raw.physical_traits || raw.physicalTraits || {},
    styleGuide: raw.style_guide || raw.styleGuide,
    voiceNotes: raw.voice_notes || raw.voiceNotes,
    createdAt: raw.created_at || raw.createdAt,
    updatedAt: raw.updated_at || raw.updatedAt,
  };
}

/**
 * Normalize Location API response (snake_case) to frontend types (camelCase)
 */
export function normalizeLocation(raw: any): any {
  return {
    id: raw.id,
    userId: raw.user_id || raw.userId,
    name: raw.name,
    description: raw.description,
    referenceImageIds: raw.reference_image_ids || raw.referenceImageIds || [],
    locationType: raw.location_type || raw.locationType,
    address: raw.address,
    coordinates: raw.coordinates,
    createdAt: raw.created_at || raw.createdAt,
    updatedAt: raw.updated_at || raw.updatedAt,
  };
}
