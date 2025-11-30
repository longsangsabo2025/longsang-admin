import { googleDriveService, type DriveFile, type DriveFolder } from '@/lib/google-drive/drive-service';

export interface FileManagerData {
  files: DriveFile[];
  folders: DriveFolder[];
  loading: boolean;
  error: string | null;
}

export class FileManagerAPI {
  /**
   * Fetch files and folders from a specific directory
   */
  static async listFiles(folderId: string = 'root'): Promise<{ files: DriveFile[], folders: DriveFolder[] }> {
    try {
      // In a real implementation, this would make an API call to your backend
      // For now, we'll use the service directly (this should be moved to backend)
      return await googleDriveService.listFiles(folderId);
    } catch (error) {
      console.error('Failed to fetch files:', error);
      throw new Error('Failed to fetch files from Google Drive');
    }
  }

  /**
   * Upload a file to Google Drive
   */
  static async uploadFile(file: File, parentFolderId: string = 'root'): Promise<DriveFile> {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      return await googleDriveService.uploadFile(file.name, buffer, file.type, parentFolderId);
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw new Error('Failed to upload file to Google Drive');
    }
  }

  /**
   * Create a new folder
   */
  static async createFolder(name: string, parentFolderId: string = 'root'): Promise<DriveFolder> {
    try {
      return await googleDriveService.createFolder(name, parentFolderId);
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw new Error('Failed to create folder in Google Drive');
    }
  }

  /**
   * Delete a file or folder
   */
  static async deleteFile(fileId: string): Promise<void> {
    try {
      await googleDriveService.deleteFile(fileId);
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw new Error('Failed to delete file from Google Drive');
    }
  }

  /**
   * Download a file
   */
  static async downloadFile(fileId: string, fileName: string): Promise<void> {
    try {
      const buffer = await googleDriveService.downloadFile(fileId);
      
      // Create download link
      const blob = new Blob([buffer]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download file:', error);
      throw new Error('Failed to download file from Google Drive');
    }
  }

  /**
   * Search files by name
   */
  static async searchFiles(query: string): Promise<DriveFile[]> {
    try {
      return await googleDriveService.searchFiles(query);
    } catch (error) {
      console.error('Failed to search files:', error);
      throw new Error('Failed to search files in Google Drive');
    }
  }

  /**
   * Share a file with someone
   */
  static async shareFile(fileId: string, email: string, role: 'reader' | 'writer' = 'reader'): Promise<void> {
    try {
      await googleDriveService.shareFile(fileId, email, role);
    } catch (error) {
      console.error('Failed to share file:', error);
      throw new Error('Failed to share file from Google Drive');
    }
  }

  /**
   * Get file metadata
   */
  static async getFileMetadata(fileId: string): Promise<DriveFile> {
    try {
      return await googleDriveService.getFileMetadata(fileId);
    } catch (error) {
      console.error('Failed to get file metadata:', error);
      throw new Error('Failed to get file metadata from Google Drive');
    }
  }
}

// Helper functions for file management
export const FileManagerHelpers = {
  /**
   * Format file size to human readable format
   */
  formatFileSize(bytes: string | number): string {
    const size = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    if (!size) return '—';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let fileSize = size;

    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024;
      unitIndex++;
    }

    return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
  },

  /**
   * Get file type from mime type
   */
  getFileType(mimeType: string): 'image' | 'document' | 'video' | 'audio' | 'other' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (
      mimeType.includes('document') ||
      mimeType.includes('text') ||
      mimeType.includes('pdf') ||
      mimeType.includes('spreadsheet') ||
      mimeType.includes('presentation')
    ) {
      return 'document';
    }
    return 'other';
  },

  /**
   * Format date to relative time
   */
  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  },

  /**
   * Validate file for upload
   */
  validateFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = [
      'image/*',
      'video/*',
      'audio/*',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/*'
    ];

    if (file.size > maxSize) {
      return { isValid: false, error: 'File size exceeds 100MB limit' };
    }

    const isAllowedType = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isAllowedType) {
      return { isValid: false, error: 'File type not supported' };
    }

    return { isValid: true };
  }
};