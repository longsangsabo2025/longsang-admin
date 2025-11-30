/**
 * useDocumentUpload Hook
 * Hook để upload và quản lý documents
 */

import { useState, useCallback } from 'react';
import { AssistantType } from './useAssistant';

export interface Document {
  id: string;
  user_id: string;
  source_type: string;
  source_id: string;
  content?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

interface UseDocumentUploadOptions {
  userId?: string;
  assistantType?: AssistantType;
}

export function useDocumentUpload({ userId, assistantType }: UseDocumentUploadOptions) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * Upload document
   */
  const uploadDocument = useCallback(
    async (file: File): Promise<Document | null> => {
      if (!userId || !assistantType) {
        throw new Error('User ID and Assistant Type are required');
      }

      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);
        formData.append('assistantType', assistantType);

        const xhr = new XMLHttpRequest();

        return new Promise((resolve, reject) => {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percentComplete = (e.loaded / e.total) * 100;
              setUploadProgress(percentComplete);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
              const response = JSON.parse(xhr.responseText);
              if (response.success) {
                setDocuments((prev) => [response.document, ...prev]);
                setUploadProgress(100);
                resolve(response.document);
              } else {
                throw new Error(response.error || 'Upload failed');
              }
            } else {
              throw new Error(`Upload failed: ${xhr.statusText}`);
            }
            setIsUploading(false);
          });

          xhr.addEventListener('error', () => {
            setIsUploading(false);
            reject(new Error('Upload failed'));
          });

          xhr.open('POST', '/api/documents/upload');
          xhr.send(formData);
        });
      } catch (err: any) {
        setError(err);
        setIsUploading(false);
        return null;
      }
    },
    [userId, assistantType]
  );

  /**
   * Fetch documents
   */
  const fetchDocuments = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const url = assistantType
        ? `/api/documents?assistantType=${assistantType}`
        : '/api/documents';
      const response = await fetch(url, {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err: any) {
      setError(err);
      console.error('[useDocumentUpload] Error fetching documents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, assistantType]);

  /**
   * Delete document
   */
  const deleteDocument = useCallback(
    async (documentId: string): Promise<boolean> => {
      if (!userId) return false;

      try {
        const response = await fetch(`/api/documents/${documentId}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': userId,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        setDocuments((prev) => prev.filter((d) => d.id !== documentId));
        return true;
      } catch (err: any) {
        console.error('[useDocumentUpload] Error deleting document:', err);
        return false;
      }
    },
    [userId]
  );

  /**
   * Get document
   */
  const getDocument = useCallback(
    async (documentId: string): Promise<Document | null> => {
      if (!userId) return null;

      try {
        const response = await fetch(`/api/documents/${documentId}`, {
          headers: {
            'x-user-id': userId,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.document || null;
      } catch (err: any) {
        console.error('[useDocumentUpload] Error getting document:', err);
        return null;
      }
    },
    [userId]
  );

  return {
    documents,
    isUploading,
    isLoading,
    error,
    uploadProgress,
    uploadDocument,
    fetchDocuments,
    deleteDocument,
    getDocument,
  };
}
