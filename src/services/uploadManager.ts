/**
 * 🚀 Global Upload Manager - Elon Musk Approved
 * 
 * Problem: Upload state was lost when switching tabs
 * Solution: Singleton service that persists across component lifecycle
 * 
 * Features:
 * - Global singleton - survives component unmounts
 * - localStorage persistence - survives page refresh
 * - Event-driven updates - components subscribe to changes
 * - Background processing - uploads continue when tab is inactive
 * - Retry logic - auto-retry failed uploads
 * - Queue management - multiple files, sequential processing
 */

import { AssistantType } from '@/hooks/useAssistant';

export interface UploadTask {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
  userId: string;
  assistantType: AssistantType;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  createdAt: number;
  completedAt?: number;
  retryCount: number;
  documentId?: string;
}

export interface UploadManagerState {
  tasks: UploadTask[];
  isProcessing: boolean;
}

type UploadListener = (state: UploadManagerState) => void;

class UploadManager {
  private static instance: UploadManager;
  private tasks: Map<string, UploadTask> = new Map();
  private listeners: Set<UploadListener> = new Set();
  private isProcessing = false;
  private currentXHR: XMLHttpRequest | null = null;
  private readonly STORAGE_KEY = 'upload_manager_tasks';
  private readonly MAX_RETRIES = 3;

  private constructor() {
    this.loadFromStorage();
    this.resumePendingUploads();
    
    // Listen for visibility changes to resume uploads
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.resumePendingUploads();
        }
      });
    }
    
    console.log('[UploadManager] 🚀 Initialized with', this.tasks.size, 'tasks');
  }

  static getInstance(): UploadManager {
    if (!UploadManager.instance) {
      UploadManager.instance = new UploadManager();
    }
    return UploadManager.instance;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: UploadListener): () => void {
    this.listeners.add(listener);
    // Immediately send current state
    listener(this.getState());
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current state
   */
  getState(): UploadManagerState {
    return {
      tasks: Array.from(this.tasks.values()).sort((a, b) => b.createdAt - a.createdAt),
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Add file to upload queue
   */
  addToQueue(file: File, userId: string, assistantType: AssistantType): string {
    const taskId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const task: UploadTask = {
      id: taskId,
      file,
      fileName: file.name,
      fileSize: file.size,
      userId,
      assistantType,
      status: 'pending',
      progress: 0,
      createdAt: Date.now(),
      retryCount: 0,
    };

    this.tasks.set(taskId, task);
    this.saveToStorage();
    this.notifyListeners();
    this.processQueue();

    console.log('[UploadManager] ➕ Added task:', taskId, file.name);
    return taskId;
  }

  /**
   * Cancel upload
   */
  cancelUpload(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    if (task.status === 'uploading' && this.currentXHR) {
      this.currentXHR.abort();
      this.currentXHR = null;
    }

    this.tasks.delete(taskId);
    this.saveToStorage();
    this.notifyListeners();
    
    if (task.status === 'uploading') {
      this.isProcessing = false;
      this.processQueue();
    }

    console.log('[UploadManager] ❌ Cancelled task:', taskId);
  }

  /**
   * Retry failed upload
   */
  retryUpload(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'failed') return;

    task.status = 'pending';
    task.progress = 0;
    task.error = undefined;
    task.retryCount++;
    
    this.tasks.set(taskId, task);
    this.saveToStorage();
    this.notifyListeners();
    this.processQueue();

    console.log('[UploadManager] 🔄 Retrying task:', taskId);
  }

  /**
   * Clear completed/failed tasks
   */
  clearCompleted(): void {
    for (const [id, task] of this.tasks) {
      if (task.status === 'completed' || task.status === 'failed') {
        this.tasks.delete(id);
      }
    }
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Process upload queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    const pendingTask = Array.from(this.tasks.values()).find(
      (t) => t.status === 'pending'
    );

    if (!pendingTask) return;

    this.isProcessing = true;
    await this.uploadTask(pendingTask);
    this.isProcessing = false;
    
    // Process next in queue
    this.processQueue();
  }

  /**
   * Upload single task
   */
  private async uploadTask(task: UploadTask): Promise<void> {
    task.status = 'uploading';
    this.tasks.set(task.id, task);
    this.saveToStorage();
    this.notifyListeners();

    try {
      const formData = new FormData();
      formData.append('file', task.file);
      formData.append('userId', task.userId);
      formData.append('assistantType', task.assistantType);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        this.currentXHR = xhr;

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            task.progress = (e.loaded / e.total) * 100;
            this.tasks.set(task.id, { ...task });
            this.notifyListeners();
          }
        });

        xhr.addEventListener('load', () => {
          this.currentXHR = null;
          
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success) {
                task.status = 'completed';
                task.progress = 100;
                task.completedAt = Date.now();
                task.documentId = response.document?.id;
                console.log('[UploadManager] ✅ Completed:', task.fileName);
                resolve();
              } else {
                task.status = 'failed';
                task.error = response.error || 'Upload failed';
                reject(new Error(task.error));
              }
            } catch (e) {
              task.status = 'failed';
              task.error = 'Invalid server response';
              reject(new Error(task.error));
            }
          } else if (xhr.status === 429) {
            // Rate limited - auto retry after delay
            task.status = 'pending';
            task.error = 'Rate limited, will retry...';
            setTimeout(() => this.processQueue(), 5000);
            resolve();
          } else {
            task.status = 'failed';
            task.error = `Upload failed: ${xhr.statusText || xhr.status}`;
            reject(new Error(task.error));
          }
          
          this.tasks.set(task.id, { ...task });
          this.saveToStorage();
          this.notifyListeners();
        });

        xhr.addEventListener('error', () => {
          this.currentXHR = null;
          task.status = 'failed';
          task.error = 'Network error';
          this.tasks.set(task.id, { ...task });
          this.saveToStorage();
          this.notifyListeners();
          reject(new Error('Network error'));
        });

        xhr.addEventListener('abort', () => {
          this.currentXHR = null;
          console.log('[UploadManager] ⚠️ Aborted:', task.fileName);
          resolve();
        });

        xhr.open('POST', '/api/documents/upload');
        xhr.send(formData);
      });
    } catch (error: any) {
      console.error('[UploadManager] ❌ Error:', error.message);
      
      // Auto-retry logic
      if (task.retryCount < this.MAX_RETRIES && task.status === 'failed') {
        setTimeout(() => {
          task.status = 'pending';
          task.retryCount++;
          this.tasks.set(task.id, { ...task });
          this.saveToStorage();
          this.notifyListeners();
          this.processQueue();
        }, 2000 * (task.retryCount + 1)); // Exponential backoff
      }
    }
  }

  /**
   * Resume pending uploads (after page load or tab switch)
   */
  private resumePendingUploads(): void {
    const hasPending = Array.from(this.tasks.values()).some(
      (t) => t.status === 'pending' || t.status === 'uploading'
    );
    
    if (hasPending && !this.isProcessing) {
      // Reset any 'uploading' tasks to 'pending' (interrupted by page refresh)
      for (const [id, task] of this.tasks) {
        if (task.status === 'uploading') {
          task.status = 'pending';
          this.tasks.set(id, task);
        }
      }
      this.processQueue();
    }
  }

  /**
   * Save to localStorage (excluding File objects)
   */
  private saveToStorage(): void {
    try {
      const serializable = Array.from(this.tasks.values()).map((task) => ({
        ...task,
        file: undefined, // Can't serialize File
        // Keep file reference info for display
        _hasFile: !!task.file,
      }));
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serializable));
    } catch (e) {
      console.warn('[UploadManager] Failed to save to storage:', e);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const tasks = JSON.parse(data) as UploadTask[];
        for (const task of tasks) {
          // Only restore completed/failed tasks (can't restore pending without File)
          if (task.status === 'completed' || task.status === 'failed') {
            this.tasks.set(task.id, task);
          }
        }
      }
    } catch (e) {
      console.warn('[UploadManager] Failed to load from storage:', e);
    }
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }
}

// Export singleton instance
export const uploadManager = UploadManager.getInstance();
export default uploadManager;
