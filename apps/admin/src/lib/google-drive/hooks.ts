import { googleDriveService } from '@/lib/google-drive/service';

export interface DriveFile {
  id: string;
  name: string;
  type: 'folder' | 'file';
  mimeType: string;
  size?: string;
  modifiedTime: string;
  owners?: any[];
  starred?: boolean;
  thumbnailLink?: string;
  webViewLink?: string;
  fileType?: 'image' | 'document' | 'video' | 'audio' | 'other';
}

// Transform Google Drive file to our interface
export const transformDriveFile = (driveFile: any): DriveFile => {
  const isFolder = driveFile.mimeType === 'application/vnd.google-apps.folder';

  let fileType: DriveFile['fileType'] = 'other';
  if (!isFolder) {
    if (driveFile.mimeType?.startsWith('image/')) fileType = 'image';
    else if (driveFile.mimeType?.includes('document') || driveFile.mimeType?.includes('text'))
      fileType = 'document';
    else if (driveFile.mimeType?.startsWith('video/')) fileType = 'video';
    else if (driveFile.mimeType?.startsWith('audio/')) fileType = 'audio';
  }

  return {
    id: driveFile.id,
    name: driveFile.name,
    type: isFolder ? 'folder' : 'file',
    mimeType: driveFile.mimeType,
    size: driveFile.size ? formatFileSize(parseInt(driveFile.size)) : undefined,
    modifiedTime: formatDate(driveFile.modifiedTime),
    owners: driveFile.owners,
    starred: driveFile.starred,
    thumbnailLink: driveFile.thumbnailLink,
    webViewLink: driveFile.webViewLink,
    fileType,
  };
};

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString();
};

// Hooks for Google Drive operations
export const useDriveOperations = () => {
  const uploadFile = async (file: File, folderId?: string) => {
    try {
      return await googleDriveService.uploadFile(file, folderId);
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };

  const createFolder = async (name: string, parentId?: string) => {
    try {
      return await googleDriveService.createFolder(name, parentId);
    } catch (error) {
      console.error('Create folder failed:', error);
      throw error;
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      await googleDriveService.deleteFile(fileId);
    } catch (error) {
      console.error('Delete failed:', error);
      throw error;
    }
  };

  const downloadFile = async (fileId: string, fileName: string) => {
    try {
      const blob = await googleDriveService.downloadFile(fileId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  };

  const shareFile = async (fileId: string, email: string, role: 'reader' | 'writer' = 'reader') => {
    try {
      await googleDriveService.shareFile(fileId, email, role);
    } catch (error) {
      console.error('Share failed:', error);
      throw error;
    }
  };

  const toggleStar = async (fileId: string, starred: boolean) => {
    try {
      await googleDriveService.toggleStar(fileId, starred);
    } catch (error) {
      console.error('Toggle star failed:', error);
      throw error;
    }
  };

  const searchFiles = async (searchTerm: string) => {
    try {
      const files = await googleDriveService.searchFiles(searchTerm);
      return files.map(transformDriveFile);
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  };

  const listFiles = async (query?: string) => {
    try {
      const files = await googleDriveService.listFiles(query);
      return files.map(transformDriveFile);
    } catch (error) {
      console.error('List files failed:', error);
      throw error;
    }
  };

  return {
    uploadFile,
    createFolder,
    deleteFile,
    downloadFile,
    shareFile,
    toggleStar,
    searchFiles,
    listFiles,
    isAvailable: googleDriveService.isAvailable(),
  };
};
