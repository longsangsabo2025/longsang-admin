import { GoogleDriveService } from '../google-drive/drive-service';

const driveService = new GoogleDriveService();

import type { DriveFile, DriveFolder } from '../google-drive/drive-service';

export const googleDriveAPI = {
  async uploadFile(file: File, parentId?: string): Promise<DriveFile> {
    try {
      // Convert File to Buffer for server-side upload
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const result = await driveService.uploadFile(
        file.name,
        buffer,
        file.type,
        parentId || 'root'
      );
      
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  async listFiles(parentId?: string): Promise<{ files: DriveFile[], folders: DriveFolder[] }> {
    try {
      return await driveService.listFiles(parentId || 'root');
    } catch (error) {
      console.error('List files error:', error);
      throw error;
    }
  },

  async deleteFile(fileId: string): Promise<void> {
    try {
      await driveService.deleteFile(fileId);
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  },

  async downloadFile(fileId: string): Promise<Buffer> {
    try {
      return await driveService.downloadFile(fileId);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  },

  async createFolder(name: string, parentId?: string): Promise<DriveFolder> {
    try {
      return await driveService.createFolder(name, parentId || 'root');
    } catch (error) {
      console.error('Create folder error:', error);
      throw error;
    }
  },

  async shareFile(fileId: string, email: string, role: 'reader' | 'writer' | 'owner' = 'reader'): Promise<void> {
    try {
      return await driveService.shareFile(fileId, email, role);
    } catch (error) {
      console.error('Share file error:', error);
      throw error;
    }
  },

  async searchFiles(query: string): Promise<DriveFile[]> {
    try {
      return await driveService.searchFiles(query);
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  },

  async getFileMetadata(fileId: string): Promise<DriveFile> {
    try {
      return await driveService.getFileMetadata(fileId);
    } catch (error) {
      console.error('Get metadata error:', error);
      throw error;
    }
  }
};