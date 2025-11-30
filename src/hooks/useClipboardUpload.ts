/**
 * =================================================================
 * USE CLIPBOARD UPLOAD HOOK
 * =================================================================
 * Auto-upload images from clipboard (paste) to Google Drive
 *
 * Usage:
 *   const { uploading, error } = useClipboardUpload({
 *     onUpload: (url) => setImageUrl(url),
 *     folderId: 'your-folder-id' // optional
 *   });
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { googleDriveAPI } from '@/lib/api/google-drive-http';
import { useToast } from '@/hooks/use-toast';

interface UseClipboardUploadOptions {
  /** Called when upload completes with the file URL */
  onUpload?: (url: string, fileId: string) => void;
  /** Called when upload fails */
  onError?: (error: Error) => void;
  /** Target folder ID in Google Drive */
  folderId?: string;
  /** Element ref to attach paste listener (default: document) */
  targetRef?: React.RefObject<HTMLElement>;
  /** Whether the hook is enabled */
  enabled?: boolean;
  /** Show toast notifications */
  showToast?: boolean;
}

interface ClipboardUploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  lastUploadedUrl: string | null;
}

export function useClipboardUpload(options: UseClipboardUploadOptions = {}) {
  const { onUpload, onError, folderId, targetRef, enabled = true, showToast = true } = options;

  const { toast } = useToast();
  const [state, setState] = useState<ClipboardUploadState>({
    uploading: false,
    progress: 0,
    error: null,
    lastUploadedUrl: null,
  });

  // Keep track of abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Upload file to Google Drive
  const uploadFile = useCallback(
    async (file: File): Promise<string | null> => {
      setState((prev) => ({ ...prev, uploading: true, progress: 0, error: null }));

      try {
        // Create abort controller
        abortControllerRef.current = new AbortController();

        // Generate unique filename with timestamp
        const timestamp = new Date().toISOString().split(':').join('-').split('.').join('-');
        const ext = file.name.split('.').pop() || 'png';
        const filename = `paste-${timestamp}.${ext}`;

        // Show uploading toast
        if (showToast) {
          toast({
            title: '⬆️ Đang upload...',
            description: `${filename} (${(file.size / 1024).toFixed(1)} KB)`,
          });
        }

        // Simulate progress (since we can't track real progress easily)
        const progressInterval = setInterval(() => {
          setState((prev) => ({
            ...prev,
            progress: Math.min(prev.progress + 10, 90),
          }));
        }, 200);

        // Upload to Drive
        const result = await googleDriveAPI.uploadFile(file, folderId);

        clearInterval(progressInterval);

        if (result?.id) {
          const fileUrl =
            result.webViewLink ||
            result.webContentLink ||
            `https://drive.google.com/file/d/${result.id}/view`;

          setState((prev) => ({
            ...prev,
            uploading: false,
            progress: 100,
            lastUploadedUrl: fileUrl,
          }));

          // Success toast
          if (showToast) {
            toast({
              title: '✅ Upload thành công!',
              description: filename,
            });
          }

          // Callback
          onUpload?.(fileUrl, result.id);

          return fileUrl;
        } else {
          throw new Error('Upload failed - no file ID returned');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';

        setState((prev) => ({
          ...prev,
          uploading: false,
          progress: 0,
          error: errorMessage,
        }));

        if (showToast) {
          toast({
            title: '❌ Upload thất bại',
            description: errorMessage,
            variant: 'destructive',
          });
        }

        onError?.(error instanceof Error ? error : new Error(errorMessage));
        return null;
      }
    },
    [folderId, onUpload, onError, showToast, toast]
  );

  // Handle paste event
  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      if (!enabled) return;

      const items = event.clipboardData?.items;
      if (!items) return;

      // Find image in clipboard
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          event.preventDefault();

          const file = item.getAsFile();
          if (file) {
            await uploadFile(file);
          }
          break;
        }
      }
    },
    [enabled, uploadFile]
  );

  // Handle drop event
  const handleDrop = useCallback(
    async (event: DragEvent) => {
      if (!enabled) return;

      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) return;

      // Find first image file
      for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
          event.preventDefault();
          await uploadFile(file);
          break;
        }
      }
    },
    [enabled, uploadFile]
  );

  // Attach event listeners
  useEffect(() => {
    if (!enabled) return;

    const target = targetRef?.current || document;

    const pasteHandler = (e: Event) => handlePaste(e as ClipboardEvent);
    const dropHandler = (e: Event) => handleDrop(e as DragEvent);

    target.addEventListener('paste', pasteHandler);
    target.addEventListener('drop', dropHandler);

    return () => {
      target.removeEventListener('paste', pasteHandler);
      target.removeEventListener('drop', dropHandler);
    };
  }, [enabled, handlePaste, handleDrop, targetRef]);

  // Cancel upload
  const cancelUpload = useCallback(() => {
    abortControllerRef.current?.abort();
    setState((prev) => ({
      ...prev,
      uploading: false,
      progress: 0,
    }));
  }, []);

  // Manual upload (for file input)
  const upload = useCallback(
    async (file: File) => {
      return uploadFile(file);
    },
    [uploadFile]
  );

  return {
    ...state,
    upload,
    cancelUpload,
  };
}

export default useClipboardUpload;
