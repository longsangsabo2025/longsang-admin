// Browser-safe: Comment out Node.js imports
// import { google } from 'googleapis';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

interface GoogleDriveConfig {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

// Types for Google Drive API responses
interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
}

interface DriveFolder {
  id: string;
  name: string;
  webViewLink?: string;
}

interface DriveDocument {
  documentId: string;
  title: string;
  revisionId?: string;
}

interface FileMetadata {
  name: string;
  mimeType: string;
  parents?: string[];
}

class GoogleDriveService {
   
  private drive: any = null;
   
  private docs: any = null;
   
  private auth: any = null;

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth() {
    try {
      const credentialsJson = import.meta.env.GOOGLE_SERVICE_ACCOUNT_JSON;

      if (!credentialsJson) {
        logger.warn('GOOGLE_SERVICE_ACCOUNT_JSON not found in environment');
        return;
      }

      const credentials: GoogleDriveConfig = JSON.parse(credentialsJson);

      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: [
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/documents',
        ],
      });

      this.drive = google.drive({ version: 'v3', auth: this.auth });
      this.docs = google.docs({ version: 'v1', auth: this.auth });

      logger.info('Google Drive service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Google Drive service', error);
    }
  }

  // Check if service is available
  isAvailable(): boolean {
    return !!this.drive && !!this.auth;
  }

  // List files in Drive
  async listFiles(query?: string, pageSize: number = 20): Promise<DriveFile[]> {
    if (!this.isAvailable()) {
      throw new Error('Google Drive service not available');
    }

    try {
      const response = await this.drive.files.list({
        pageSize,
        q: query,
        fields:
          'nextPageToken, files(id, name, mimeType, size, modifiedTime, owners, starred, thumbnailLink, webViewLink)',
        orderBy: 'modifiedTime desc',
      });

      return response.data.files || [];
    } catch (error) {
      logger.error('Failed to list files', error);
      toast.error('Failed to load files from Google Drive');
      return [];
    }
  }

  // Upload file to Drive
  async uploadFile(file: File, folderId?: string): Promise<DriveFile> {
    if (!this.isAvailable()) {
      throw new Error('Google Drive service not available');
    }

    try {
      const metadata: FileMetadata = {
        name: file.name,
        mimeType: file.type,
      };

      if (folderId) {
        metadata.parents = [folderId];
      }

      // Convert file to buffer
      const buffer = await file.arrayBuffer();

      const response = await this.drive.files.create({
        resource: metadata,
        media: {
          mimeType: file.type,
          body: Buffer.from(buffer),
        },
        fields: 'id, name, mimeType, size',
      });

      toast.success(`File "${file.name}" uploaded successfully`);
      return response.data;
    } catch (error) {
      logger.error('Failed to upload file', error);
      toast.error('Failed to upload file to Google Drive');
      throw error;
    }
  }

  // Create folder
  async createFolder(name: string, parentId?: string): Promise<DriveFolder> {
    if (!this.isAvailable()) {
      throw new Error('Google Drive service not available');
    }

    try {
      const metadata: FileMetadata = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
      };

      if (parentId) {
        metadata.parents = [parentId];
      }

      const response = await this.drive.files.create({
        resource: metadata,
        fields: 'id, name',
      });

      toast.success(`Folder "${name}" created successfully`);
      return response.data;
    } catch (error) {
      console.error('Failed to create folder:', error);
      toast.error('Failed to create folder');
      throw error;
    }
  }

  // Delete file/folder
  async deleteFile(fileId: string): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Google Drive service not available');
    }

    try {
      await this.drive.files.delete({ fileId });
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Failed to delete file:', error);
      toast.error('Failed to delete file');
      throw error;
    }
  }

  // Download file
  async downloadFile(fileId: string): Promise<Blob> {
    if (!this.isAvailable()) {
      throw new Error('Google Drive service not available');
    }

    try {
      const response = await this.drive.files.get({
        fileId,
        alt: 'media',
      });

      return new Blob([response.data]);
    } catch (error) {
      console.error('Failed to download file:', error);
      toast.error('Failed to download file');
      throw error;
    }
  }

  // Share file
  async shareFile(
    fileId: string,
    email: string,
    role: 'reader' | 'writer' = 'reader'
  ): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Google Drive service not available');
    }

    try {
      await this.drive.permissions.create({
        fileId,
        resource: {
          role,
          type: 'user',
          emailAddress: email,
        },
      });

      toast.success(`File shared with ${email}`);
    } catch (error) {
      console.error('Failed to share file:', error);
      toast.error('Failed to share file');
      throw error;
    }
  }

  // Star/unstar file
  async toggleStar(fileId: string, starred: boolean): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Google Drive service not available');
    }

    try {
      await this.drive.files.update({
        fileId,
        resource: { starred },
      });

      toast.success(starred ? 'File starred' : 'File unstarred');
    } catch (error) {
      console.error('Failed to toggle star:', error);
      toast.error('Failed to update file');
      throw error;
    }
  }

  // Create Google Document
  async createDocument(title: string, folderId?: string): Promise<DriveDocument> {
    if (!this.isAvailable()) {
      throw new Error('Google Drive service not available');
    }

    try {
      // Create the document
      const docResponse = await this.docs.documents.create({
        resource: { title },
      });

      const documentId = docResponse.data.documentId;

      // Move to folder if specified
      if (folderId && documentId) {
        await this.drive.files.update({
          fileId: documentId,
          addParents: folderId,
          fields: 'id, parents',
        });
      }

      toast.success(`Document "${title}" created successfully`);
      return docResponse.data;
    } catch (error) {
      console.error('Failed to create document:', error);
      toast.error('Failed to create document');
      throw error;
    }
  }

  // Update document content
  async updateDocument(documentId: string, requests: unknown[]): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Google Drive service not available');
    }

    try {
      await this.docs.documents.batchUpdate({
        documentId,
        resource: { requests },
      });

      toast.success('Document updated successfully');
    } catch (error) {
      console.error('Failed to update document:', error);
      toast.error('Failed to update document');
      throw error;
    }
  }

  // Get document content
  async getDocument(documentId: string): Promise<DriveDocument> {
    if (!this.isAvailable()) {
      throw new Error('Google Drive service not available');
    }

    try {
      const response = await this.docs.documents.get({ documentId });
      return response.data;
    } catch (error) {
      console.error('Failed to get document:', error);
      toast.error('Failed to load document');
      throw error;
    }
  }

  // Search files
  async searchFiles(searchTerm: string): Promise<DriveFile[]> {
    const query = `name contains '${searchTerm}' or fullText contains '${searchTerm}'`;
    return this.listFiles(query);
  }

  // Get file info
  async getFileInfo(fileId: string): Promise<DriveFile> {
    if (!this.isAvailable()) {
      throw new Error('Google Drive service not available');
    }

    try {
      const response = await this.drive.files.get({
        fileId,
        fields: '*',
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get file info:', error);
      toast.error('Failed to get file information');
      throw error;
    }
  }
}

// Export singleton instance
export const googleDriveService = new GoogleDriveService();
