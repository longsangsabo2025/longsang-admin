/**
 * 🧠 Brain Image Memory Types
 * 
 * Visual memory system for AI-powered image generation with consistent
 * characters, scenes, and styles.
 * 
 * @author LongSang (Inspired by Elon's xAI vision)
 */

// =============================================================================
// CORE IMAGE MEMORY TYPES
// =============================================================================

/**
 * Image Category - Main classification groups
 */
export type ImageCategory = 
  | 'person'           // Portraits, headshots, full body
  | 'location'         // Places, venues, backgrounds
  | 'object'           // Items, props, products
  | 'outfit'           // Clothing, accessories, style
  | 'mood'             // Atmosphere, lighting, feeling
  | 'action'           // Activities, poses, movements
  | 'style'            // Art style references
  | 'brand'            // Logos, brand elements
  | 'character'        // Fictional/consistent characters
  | 'scene'            // Complete scene compositions
  | 'other';

/**
 * Sub-categories for more granular classification
 */
export interface ImageSubCategory {
  category: ImageCategory;
  subcategory: string;      // e.g., "billiard_table", "casual_wear"
  confidence: number;       // 0-1 AI confidence score
}

/**
 * Image Analysis Result from Vision AI
 */
export interface ImageAnalysis {
  // Core description
  title: string;                    // Auto-generated title
  description: string;              // Detailed description
  shortDescription: string;         // 1-2 sentence summary
  
  // Classification
  primaryCategory: ImageCategory;
  categories: ImageSubCategory[];
  tags: string[];                   // Searchable tags
  
  // Visual elements
  colors: string[];                 // Dominant colors (hex)
  objects: DetectedObject[];        // Objects in image
  faces: DetectedFace[];            // Faces detected
  text: string[];                   // Any text in image
  
  // Context
  mood: string;                     // Overall mood/atmosphere
  style: string;                    // Art/photo style
  lighting: string;                 // Lighting conditions
  composition: string;              // Composition description
  
  // Technical
  quality: ImageQuality;
  suggestedUses: string[];          // "portrait reference", "background"
  
  // AI metadata
  modelUsed: string;
  analysisVersion: string;
  confidence: number;
}

/**
 * Detected object in image
 */
export interface DetectedObject {
  name: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  attributes?: Record<string, string>;
}

/**
 * Detected face with attributes
 */
export interface DetectedFace {
  id: string;
  name?: string;                    // If recognized/labeled
  isOwner: boolean;                 // Is this "me" (the user)
  age?: string;                     // Estimated age range
  gender?: string;
  expression?: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Image quality assessment
 */
export interface ImageQuality {
  overall: 'excellent' | 'good' | 'fair' | 'poor';
  resolution: 'high' | 'medium' | 'low';
  sharpness: number;               // 0-1
  noise: number;                   // 0-1 (lower is better)
  usableForGeneration: boolean;
}

// =============================================================================
// IMAGE MEMORY ITEM
// =============================================================================

/**
 * Main Image Memory Item - stored in database
 */
export interface ImageMemoryItem {
  id: string;
  userId: string;
  
  // Image data
  imageUrl: string;                 // Original image URL
  thumbnailUrl?: string;            // Thumbnail for UI
  localPath?: string;               // Local file path if any
  
  // AI Analysis
  analysis: ImageAnalysis;
  
  // Vector embedding for semantic search
  embedding?: number[];             // pgvector embedding
  embeddingModel?: string;          // Model used for embedding
  
  // Organization
  domainId?: string;                // Link to brain domain
  folderId?: string;                // Custom folder
  collections: string[];            // User-created collections
  
  // User overrides
  customTitle?: string;             // User can override AI title
  customTags?: string[];            // Additional user tags
  customDescription?: string;       // User notes
  isOwnerPortrait: boolean;         // Mark as owner's face
  characterName?: string;           // Named character
  
  // Stats
  useCount: number;                 // Times used in generation
  lastUsedAt?: string;
  isFavorite: boolean;
  isArchived: boolean;
  
  // Metadata
  originalFilename?: string;
  fileSize?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  format?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  analyzedAt: string;
}

/**
 * Image Collection - group of related images
 */
export interface ImageCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  coverImageId?: string;
  imageIds: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Character Profile - consistent character definition
 */
export interface CharacterProfile {
  id: string;
  userId: string;
  name: string;                     // e.g., "Me", "SABO Owner"
  description: string;
  
  // Reference images
  primaryImageId: string;           // Main reference
  referenceImageIds: string[];      // Additional references
  
  // Attributes
  attributes: {
    gender?: string;
    ageRange?: string;
    ethnicity?: string;
    hairColor?: string;
    hairStyle?: string;
    eyeColor?: string;
    bodyType?: string;
    height?: string;
    distinctiveFeatures?: string[];
  };
  
  // Style preferences
  preferredStyles?: string[];
  preferredOutfits?: string[];
  
  // Generation hints
  positivePromptKeywords: string[];
  negativePromptKeywords: string[];
  
  isOwner: boolean;                 // Is this the user
  createdAt: string;
  updatedAt: string;
}

/**
 * Location Profile - consistent location/scene
 */
export interface LocationProfile {
  id: string;
  userId: string;
  name: string;                     // e.g., "SABO Billiard Club"
  description: string;
  type: 'indoor' | 'outdoor' | 'mixed';
  
  // Reference images
  referenceImageIds: string[];
  
  // Attributes
  attributes: {
    style?: string;                 // Modern, vintage, etc.
    lighting?: string;              // Neon, natural, dim
    colors?: string[];              // Dominant colors
    features?: string[];            // Key features
    atmosphere?: string;
  };
  
  // Generation hints
  positivePromptKeywords: string[];
  negativePromptKeywords: string[];
  
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// GENERATION CONTEXT
// =============================================================================

/**
 * Context built from image memory for generation
 */
export interface GenerationContext {
  // User's original request
  originalPrompt: string;
  
  // Parsed intent
  intent: {
    action: string;                 // What's happening
    characters: string[];           // Who's involved
    location?: string;              // Where
    mood?: string;                  // Atmosphere
    style?: string;                 // Art style
  };
  
  // Retrieved from memory
  characterReferences: ImageMemoryItem[];
  locationReferences: ImageMemoryItem[];
  styleReferences: ImageMemoryItem[];
  objectReferences: ImageMemoryItem[];
  
  // Character profiles matched
  characterProfiles: CharacterProfile[];
  
  // Location profiles matched
  locationProfiles: LocationProfile[];
  
  // Built prompt
  enhancedPrompt: string;           // Enriched with context
  negativePrompt: string;
  
  // Reference images for API
  referenceImages: {
    url: string;
    weight: number;                 // 0-1 influence
    type: 'character' | 'style' | 'composition' | 'location';
  }[];
  
  // Confidence
  contextConfidence: number;        // How well memory matched
  suggestions?: string[];           // Tips for better results
}

/**
 * Smart prompt analysis result
 */
export interface PromptAnalysis {
  // Original
  originalPrompt: string;
  
  // Extracted entities
  entities: {
    characters: string[];           // "tôi", "bạn nữ xinh đẹp"
    locations: string[];            // "quán bida SABO"
    actions: string[];              // "đang chơi bida"
    objects: string[];              // "bàn bida"
    styles: string[];               // Art style hints
    moods: string[];                // Atmosphere hints
  };
  
  // Matched to profiles
  matchedCharacters: {
    profileId: string;
    name: string;
    confidence: number;
  }[];
  
  matchedLocations: {
    profileId: string;
    name: string;
    confidence: number;
  }[];
  
  // Keywords for search
  searchKeywords: string[];
}

// =============================================================================
// API TYPES
// =============================================================================

/**
 * Upload & Analyze Image Request
 */
export interface UploadImageRequest {
  file?: File;
  imageUrl?: string;
  domainId?: string;
  folderId?: string;
  collections?: string[];
  customTags?: string[];
  isOwnerPortrait?: boolean;
  characterName?: string;
}

/**
 * Upload & Analyze Image Response
 */
export interface UploadImageResponse {
  success: boolean;
  data?: ImageMemoryItem;
  error?: string;
}

/**
 * Search Image Memory Request
 */
export interface SearchImageMemoryRequest {
  query: string;                    // Natural language or keywords
  categories?: ImageCategory[];
  tags?: string[];
  domainId?: string;
  folderId?: string;
  collections?: string[];
  isOwnerPortrait?: boolean;
  characterName?: string;
  limit?: number;
  offset?: number;
  minSimilarity?: number;
}

/**
 * Search Image Memory Response
 */
export interface SearchImageMemoryResponse {
  success: boolean;
  data: ImageMemoryItem[];
  total: number;
  query: string;
}

/**
 * Build Generation Context Request
 */
export interface BuildContextRequest {
  prompt: string;
  includeOwnerPortrait?: boolean;
  maxReferences?: number;
  preferredStyle?: string;
}

/**
 * Build Generation Context Response
 */
export interface BuildContextResponse {
  success: boolean;
  context?: GenerationContext;
  error?: string;
}

/**
 * Batch Analysis Request
 */
export interface BatchAnalysisRequest {
  imageUrls: string[];
  domainId?: string;
  autoCategorie: boolean;
}

/**
 * Image Memory Statistics
 */
export interface ImageMemoryStats {
  totalImages: number;
  byCategory: Record<ImageCategory, number>;
  byCollection: Record<string, number>;
  totalCharacters: number;
  totalLocations: number;
  storageUsed: number;
  mostUsedImages: ImageMemoryItem[];
  recentlyAdded: ImageMemoryItem[];
}
