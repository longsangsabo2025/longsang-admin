/**
 * 🚀 GLOBAL LIBRARY STORE - Elon Mode Activated!
 * 
 * Problem: React hooks have isolated state per component instance
 * Solution: Global store with event emitter pattern for cross-component sync
 * 
 * When AI Generator saves an image, ALL library components get updated instantly!
 * + Auto-uploads to Google Drive for persistent storage!
 */

import { WorkspaceItem, ProductItem, MediaItem, ProductStatus } from './types';

// Storage keys
const WORKSPACE_KEY = 'library-workspace';
const PRODUCTS_KEY = 'library-products';

// Event types
type LibraryEvent = 'workspace-changed' | 'products-changed';
type LibraryListener = () => void;

// Global event emitter
const listeners: Map<LibraryEvent, Set<LibraryListener>> = new Map();

function emit(event: LibraryEvent) {
  const eventListeners = listeners.get(event);
  if (eventListeners) {
    eventListeners.forEach(listener => listener());
  }
}

function subscribe(event: LibraryEvent, listener: LibraryListener): () => void {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event)!.add(listener);
  
  // Return unsubscribe function
  return () => {
    listeners.get(event)?.delete(listener);
  };
}

// ═══════════════════════════════════════════════════════════════
// WORKSPACE STORE
// ═══════════════════════════════════════════════════════════════

function getWorkspaceItems(): WorkspaceItem[] {
  try {
    const saved = localStorage.getItem(WORKSPACE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function setWorkspaceItems(items: WorkspaceItem[]) {
  localStorage.setItem(WORKSPACE_KEY, JSON.stringify(items));
  emit('workspace-changed');
}

export const workspaceStore = {
  getItems: getWorkspaceItems,
  
  addItems: (newMediaItems: MediaItem[]): number => {
    const currentItems = getWorkspaceItems();
    const newItems: WorkspaceItem[] = newMediaItems
      .filter(item => !currentItems.some(w => w.id === item.id))
      .map(item => ({
        ...item,
        addedAt: new Date().toISOString(),
      }));

    if (newItems.length === 0) return 0;

    setWorkspaceItems([...currentItems, ...newItems]);
    return newItems.length;
  },

  removeItem: (itemId: string): boolean => {
    const currentItems = getWorkspaceItems();
    const newItems = currentItems.filter(i => i.id !== itemId);
    if (newItems.length === currentItems.length) return false;
    
    setWorkspaceItems(newItems);
    return true;
  },

  clearAll: (): number => {
    const count = getWorkspaceItems().length;
    setWorkspaceItems([]);
    return count;
  },

  isInWorkspace: (itemId: string): boolean => {
    return getWorkspaceItems().some(w => w.id === itemId);
  },

  subscribe: (listener: LibraryListener) => subscribe('workspace-changed', listener),
};

// ═══════════════════════════════════════════════════════════════
// PRODUCTS STORE
// ═══════════════════════════════════════════════════════════════

function getProductItems(): ProductItem[] {
  try {
    const saved = localStorage.getItem(PRODUCTS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function setProductItems(items: ProductItem[]) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(items));
  emit('products-changed');
}

export const productsStore = {
  getItems: getProductItems,
  
  addItems: (newMediaItems: MediaItem[], defaultStatus: ProductStatus = 'draft'): number => {
    const currentItems = getProductItems();
    const newItems: ProductItem[] = newMediaItems
      .filter(item => !currentItems.some(p => p.id === item.id))
      .map(item => ({
        ...item,
        addedAt: new Date().toISOString(),
        status: defaultStatus,
      }));

    if (newItems.length === 0) return 0;

    setProductItems([...currentItems, ...newItems]);
    return newItems.length;
  },

  removeItem: (itemId: string): boolean => {
    const currentItems = getProductItems();
    const newItems = currentItems.filter(i => i.id !== itemId);
    if (newItems.length === currentItems.length) return false;
    
    setProductItems(newItems);
    return true;
  },

  updateStatus: (itemId: string, newStatus: ProductStatus): boolean => {
    const currentItems = getProductItems();
    const index = currentItems.findIndex(i => i.id === itemId);
    if (index === -1) return false;

    currentItems[index] = { 
      ...currentItems[index], 
      status: newStatus, 
      updatedAt: new Date().toISOString() 
    };
    setProductItems(currentItems);
    return true;
  },

  batchUpdateStatus: (itemIds: string[], newStatus: ProductStatus): number => {
    const currentItems = getProductItems();
    let updated = 0;
    
    const newItems = currentItems.map(item => {
      if (itemIds.includes(item.id)) {
        updated++;
        return { ...item, status: newStatus, updatedAt: new Date().toISOString() };
      }
      return item;
    });
    
    if (updated > 0) {
      setProductItems(newItems);
    }
    return updated;
  },

  clearAll: (): number => {
    const count = getProductItems().length;
    setProductItems([]);
    return count;
  },

  isInProducts: (itemId: string): boolean => {
    return getProductItems().some(p => p.id === itemId);
  },

  getStats: () => {
    const items = getProductItems();
    const result: Record<ProductStatus, number> = {
      draft: 0,
      review: 0,
      approved: 0,
      published: 0,
    };
    
    items.forEach(item => {
      if (item.status && result.hasOwnProperty(item.status)) {
        result[item.status]++;
      }
    });
    
    return result;
  },

  subscribe: (listener: LibraryListener) => subscribe('products-changed', listener),
};

// ═══════════════════════════════════════════════════════════════
// GOOGLE DRIVE SYNC - Fetch from cloud on load
// ═══════════════════════════════════════════════════════════════

let workspaceSynced = false;
let productsSynced = false;

/**
 * Get direct image URL via our API proxy
 * This bypasses Google Drive auth/CORS issues
 */
function getDriveImageUrl(fileId: string): string {
  return `/api/drive/image/${fileId}`;
}

/**
 * Fetch workspace items from Google Drive
 * Merges with localStorage (Drive is source of truth)
 */
async function fetchWorkspaceFromDrive(): Promise<void> {
  if (workspaceSynced) return; // Only sync once per session
  
  try {
    console.log('[Library] Syncing workspace from Google Drive...');
    const response = await fetch('/api/drive/library/workspace');
    
    if (!response.ok) {
      console.warn('[Library] Drive workspace fetch failed:', response.status);
      return;
    }
    
    const data = await response.json();
    if (!data.success || !data.files) return;
    
    // Convert Drive files to WorkspaceItem format
    const driveItems: WorkspaceItem[] = data.files.map((file: any) => ({
      id: file.id,
      name: file.name,
      url: getDriveImageUrl(file.id),
      type: file.mimeType?.startsWith('image/') ? 'image' : 
            file.mimeType?.startsWith('video/') ? 'video' : 'file',
      tags: ['google-drive'],
      createdAt: file.modifiedTime,
      addedAt: file.modifiedTime,
      driveId: file.id,
      driveLink: file.webViewLink,
      thumbnailUrl: getDriveImageUrl(file.id),
    }));
    
    if (driveItems.length > 0) {
      // Merge: Drive items + local items that aren't in Drive
      const localItems = getWorkspaceItems();
      const driveIds = new Set(driveItems.map(d => d.driveId));
      const localOnly = localItems.filter(l => !l.driveId || !driveIds.has(l.driveId));
      
      const merged = [...driveItems, ...localOnly];
      setWorkspaceItems(merged);
      console.log(`[Library] ✅ Workspace synced: ${driveItems.length} from Drive, ${localOnly.length} local`);
    }
    
    workspaceSynced = true;
  } catch (error) {
    console.error('[Library] Workspace sync error:', error);
  }
}

/**
 * Fetch products items from Google Drive
 */
async function fetchProductsFromDrive(): Promise<void> {
  if (productsSynced) return;
  
  try {
    console.log('[Library] Syncing products from Google Drive...');
    const response = await fetch('/api/drive/library/products');
    
    if (!response.ok) {
      console.warn('[Library] Drive products fetch failed:', response.status);
      return;
    }
    
    const data = await response.json();
    if (!data.success || !data.files) return;
    
    // Convert Drive files to ProductItem format
    const driveItems: ProductItem[] = data.files.map((file: any) => ({
      id: file.id,
      name: file.name,
      url: getDriveImageUrl(file.id),
      type: file.mimeType?.startsWith('image/') ? 'image' : 
            file.mimeType?.startsWith('video/') ? 'video' : 'file',
      tags: ['google-drive'],
      createdAt: file.modifiedTime,
      addedAt: file.modifiedTime,
      status: (file.status as ProductStatus) || 'draft',
      driveId: file.id,
      driveLink: file.webViewLink,
      thumbnailUrl: getDriveImageUrl(file.id),
    }));
    
    if (driveItems.length > 0) {
      const localItems = getProductItems();
      const driveIds = new Set(driveItems.map(d => d.driveId));
      const localOnly = localItems.filter(l => !l.driveId || !driveIds.has(l.driveId));
      
      const merged = [...driveItems, ...localOnly];
      setProductItems(merged);
      console.log(`[Library] ✅ Products synced: ${driveItems.length} from Drive, ${localOnly.length} local`);
    }
    
    productsSynced = true;
  } catch (error) {
    console.error('[Library] Products sync error:', error);
  }
}

// Export sync functions
export const librarySync = {
  syncWorkspace: fetchWorkspaceFromDrive,
  syncProducts: fetchProductsFromDrive,
  syncAll: async () => {
    await Promise.all([fetchWorkspaceFromDrive(), fetchProductsFromDrive()]);
  },
  resetSync: () => {
    workspaceSynced = false;
    productsSynced = false;
  },
};

// ═══════════════════════════════════════════════════════════════
// GOOGLE DRIVE UPLOAD - Persistent Storage
// ═══════════════════════════════════════════════════════════════

interface UploadResult {
  success: boolean;
  file?: {
    id: string;
    name: string;
    webViewLink?: string;
    thumbnailLink?: string;
  };
  error?: string;
}

/**
 * Upload image from URL to Google Drive Library
 * Called automatically when saving AI-generated images
 */
async function uploadToGoogleDrive(
  imageUrl: string,
  fileName: string,
  destination: 'workspace' | 'products',
  status?: ProductStatus,
  metadata?: Record<string, string>
): Promise<UploadResult> {
  try {
    const response = await fetch('/api/drive/library/upload-from-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl,
        fileName,
        destination,
        status: status || 'draft',
        metadata,
      }),
    });

    const data = await response.json();
    
    if (!data.success) {
      console.error('[Library] Drive upload failed:', data.error);
      return { success: false, error: data.error };
    }

    console.log('[Library] ✅ Uploaded to Google Drive:', data.file.name);
    return { success: true, file: data.file };
  } catch (error) {
    console.error('[Library] Drive upload error:', error);
    return { success: false, error: String(error) };
  }
}

// ═══════════════════════════════════════════════════════════════
// COMBINED STORE ACTIONS - LocalStorage + Google Drive
// ═══════════════════════════════════════════════════════════════

export const libraryActions = {
  /**
   * Add AI-generated image to Workspace
   * Saves to localStorage (instant) + uploads to Google Drive (background)
   */
  addToWorkspace: async (item: MediaItem, uploadToDrive = true): Promise<boolean> => {
    // 1. Save to localStorage immediately (instant UI update)
    const count = workspaceStore.addItems([item]);
    if (count === 0) return false;

    // 2. Upload to Google Drive in background
    if (uploadToDrive && item.url) {
      uploadToGoogleDrive(
        item.url,
        item.name || `AI_Image_${Date.now()}.png`,
        'workspace',
        undefined,
        { prompt: (item as any).prompt || '' }
      ).then(result => {
        if (result.success && result.file) {
          // Update item with Drive info
          const items = workspaceStore.getItems();
          const index = items.findIndex(i => i.id === item.id);
          if (index !== -1) {
            items[index] = {
              ...items[index],
              driveId: result.file.id,
              driveLink: result.file.webViewLink,
            } as WorkspaceItem;
            localStorage.setItem(WORKSPACE_KEY, JSON.stringify(items));
            emit('workspace-changed');
          }
        }
      });
    }

    return true;
  },

  /**
   * Add AI-generated image to Products
   * Saves to localStorage (instant) + uploads to Google Drive (background)
   */
  addToProducts: async (item: MediaItem, status: ProductStatus = 'draft', uploadToDrive = true): Promise<boolean> => {
    // 1. Save to localStorage immediately (instant UI update)
    const count = productsStore.addItems([item], status);
    if (count === 0) return false;

    // 2. Upload to Google Drive in background
    if (uploadToDrive && item.url) {
      uploadToGoogleDrive(
        item.url,
        item.name || `AI_Image_${Date.now()}.png`,
        'products',
        status,
        { prompt: (item as any).prompt || '' }
      ).then(result => {
        if (result.success && result.file) {
          // Update item with Drive info
          const items = productsStore.getItems();
          const index = items.findIndex(i => i.id === item.id);
          if (index !== -1) {
            items[index] = {
              ...items[index],
              driveId: result.file.id,
              driveLink: result.file.webViewLink,
            } as ProductItem;
            localStorage.setItem(PRODUCTS_KEY, JSON.stringify(items));
            emit('products-changed');
          }
        }
      });
    }

    return true;
  },
};

// Export for direct usage in AI components
export { WORKSPACE_KEY, PRODUCTS_KEY };
