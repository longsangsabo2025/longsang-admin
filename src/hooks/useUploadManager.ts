/**
 * 🚀 useUploadManager Hook
 * 
 * React hook wrapper for the global UploadManager
 * Provides reactive state updates and convenient methods
 */

import { useEffect, useState, useCallback } from 'react';
import { uploadManager, UploadManagerState, UploadTask } from '@/services/uploadManager';
import { AssistantType } from '@/hooks/useAssistant';
import { useToast } from '@/hooks/use-toast';

interface UseUploadManagerOptions {
  userId?: string;
  assistantType?: AssistantType;
  showToasts?: boolean;
}

export function useUploadManager(options: UseUploadManagerOptions = {}) {
  const { userId, assistantType, showToasts = true } = options;
  const [state, setState] = useState<UploadManagerState>({ tasks: [], isProcessing: false });
  const { toast } = useToast();

  // Track completed tasks for toast notifications
  const [notifiedTasks, setNotifiedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = uploadManager.subscribe((newState) => {
      setState(newState);
      
      // Show toast for newly completed/failed tasks
      if (showToasts) {
        newState.tasks.forEach(task => {
          if (notifiedTasks.has(task.id)) return;
          
          if (task.status === 'completed') {
            toast({
              title: '✅ Upload thành công',
              description: `${task.fileName} đã được upload và index`,
            });
            setNotifiedTasks(prev => new Set(prev).add(task.id));
          } else if (task.status === 'failed' && task.retryCount >= 3) {
            toast({
              title: '❌ Upload thất bại',
              description: `${task.fileName}: ${task.error}`,
              variant: 'destructive',
            });
            setNotifiedTasks(prev => new Set(prev).add(task.id));
          }
        });
      }
    });

    return unsubscribe;
  }, [showToasts, toast, notifiedTasks]);

  /**
   * Upload a file
   */
  const uploadFile = useCallback((file: File) => {
    if (!userId || !assistantType) {
      toast({
        title: '❌ Lỗi',
        description: 'Thiếu thông tin user hoặc assistant type',
        variant: 'destructive',
      });
      return null;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: '❌ Lỗi',
        description: 'Chỉ hỗ trợ file PDF, DOCX, và TXT',
        variant: 'destructive',
      });
      return null;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: '❌ Lỗi',
        description: 'File không được vượt quá 10MB',
        variant: 'destructive',
      });
      return null;
    }

    const taskId = uploadManager.addToQueue(file, userId, assistantType);
    
    toast({
      title: '📤 Đang upload',
      description: `${file.name} đã được thêm vào hàng đợi`,
    });

    return taskId;
  }, [userId, assistantType, toast]);

  /**
   * Upload multiple files
   */
  const uploadFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const taskIds: string[] = [];

    fileArray.forEach(file => {
      const taskId = uploadFile(file);
      if (taskId) taskIds.push(taskId);
    });

    return taskIds;
  }, [uploadFile]);

  /**
   * Cancel an upload
   */
  const cancelUpload = useCallback((taskId: string) => {
    uploadManager.cancelUpload(taskId);
  }, []);

  /**
   * Retry a failed upload
   */
  const retryUpload = useCallback((taskId: string) => {
    uploadManager.retryUpload(taskId);
  }, []);

  /**
   * Clear completed/failed tasks
   */
  const clearCompleted = useCallback(() => {
    uploadManager.clearCompleted();
    setNotifiedTasks(new Set());
  }, []);

  /**
   * Get tasks filtered by current assistant type
   */
  const getMyTasks = useCallback(() => {
    if (!assistantType) return state.tasks;
    return state.tasks.filter(t => t.assistantType === assistantType);
  }, [state.tasks, assistantType]);

  // Computed values
  const activeTasks = state.tasks.filter(t => 
    t.status === 'pending' || t.status === 'uploading' || t.status === 'processing'
  );
  const completedTasks = state.tasks.filter(t => t.status === 'completed');
  const failedTasks = state.tasks.filter(t => t.status === 'failed');

  return {
    // State
    tasks: state.tasks,
    activeTasks,
    completedTasks,
    failedTasks,
    isProcessing: state.isProcessing,
    hasActiveUploads: activeTasks.length > 0,
    
    // Methods
    uploadFile,
    uploadFiles,
    cancelUpload,
    retryUpload,
    clearCompleted,
    getMyTasks,
  };
}

export default useUploadManager;
