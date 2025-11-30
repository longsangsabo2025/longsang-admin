// Types for Google Drive API responses
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  parents?: string[];
  owners?: Array<{ displayName: string; emailAddress: string }>;
}

export interface DriveFolder {
  id: string;
  name: string;
  modifiedTime: string;
  parents?: string[];
}

// Chuẩn hóa: Dùng API_URL từ config
import { API_URL } from '@/config/api';
const API_BASE_URL = `${API_URL}/drive`;

export const googleDriveAPI = {
  async uploadFile(file: File, parentId?: string): Promise<DriveFile> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const endpoint =
        parentId && parentId !== 'root'
          ? `${API_BASE_URL}/upload/${parentId}`
          : `${API_BASE_URL}/upload`;

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  async listFiles(parentId?: string): Promise<{ files: DriveFile[]; folders: DriveFolder[] }> {
    try {
      const endpoint =
        parentId && parentId !== 'root'
          ? `${API_BASE_URL}/list/${parentId}`
          : `${API_BASE_URL}/list`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`List files failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('List files error:', error);
      throw error;
    }
  },

  async deleteFile(fileId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  },

  async downloadFile(fileId: string): Promise<Blob> {
    try {
      const response = await fetch(`${API_BASE_URL}/download/${fileId}`);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  },

  async createFolder(name: string, parentId?: string): Promise<DriveFolder> {
    try {
      const response = await fetch(`${API_BASE_URL}/folder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          parentId: parentId || 'root',
        }),
      });

      if (!response.ok) {
        throw new Error(`Create folder failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Create folder error:', error);
      throw error;
    }
  },

  async shareFile(
    fileId: string,
    email: string,
    role: 'reader' | 'writer' | 'owner' = 'reader'
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/share/${fileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          role,
        }),
      });

      if (!response.ok) {
        throw new Error(`Share failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Share file error:', error);
      throw error;
    }
  },

  async searchFiles(query: string): Promise<DriveFile[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/search/${encodeURIComponent(query)}`);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  },

  async getFileMetadata(fileId: string): Promise<DriveFile> {
    try {
      // This would need to be implemented in the backend if needed
      throw new Error('getFileMetadata not implemented yet');
    } catch (error) {
      console.error('Get metadata error:', error);
      throw error;
    }
  },
};
