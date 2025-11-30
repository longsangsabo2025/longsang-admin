// Browser-safe: Comment out Node.js imports
// import { google } from 'googleapis';

// Initialize Google Drive API client
const initializeDriveClient = () => {
  try {
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountKey) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set');
    }

    const credentials = JSON.parse(serviceAccountKey);
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata'
      ],
    });

    return google.drive({ version: 'v3', auth });
  } catch (error) {
    console.error('Failed to initialize Google Drive client:', error);
    throw error;
  }
};

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

export class GoogleDriveService {
  private readonly drive;

  constructor() {
    this.drive = initializeDriveClient();
  }

  /**
   * List files and folders in a specific folder
   */
  async listFiles(folderId: string = 'root', pageSize: number = 100): Promise<{ files: DriveFile[], folders: DriveFolder[] }> {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        pageSize,
        fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,thumbnailLink,parents,owners)',
        orderBy: 'modifiedTime desc',
      });

      const items = response.data.files || [];
      
      const files: DriveFile[] = [];
      const folders: DriveFolder[] = [];

      for (const item of items) {
        if (item.mimeType === 'application/vnd.google-apps.folder') {
          folders.push({
            id: item.id!,
            name: item.name!,
            modifiedTime: item.modifiedTime!,
            parents: item.parents,
          });
        } else {
          files.push({
            id: item.id!,
            name: item.name!,
            mimeType: item.mimeType!,
            size: item.size,
            modifiedTime: item.modifiedTime!,
            webViewLink: item.webViewLink,
            webContentLink: item.webContentLink,
            thumbnailLink: item.thumbnailLink,
            parents: item.parents,
            owners: item.owners,
          });
        }
      }

      return { files, folders };
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  /**
   * Create a new folder
   */
  async createFolder(name: string, parentFolderId: string = 'root'): Promise<DriveFolder> {
    try {
      const response = await this.drive.files.create({
        requestBody: {
          name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentFolderId],
        },
        fields: 'id,name,modifiedTime,parents',
      });

      return {
        id: response.data.id!,
        name: response.data.name!,
        modifiedTime: response.data.modifiedTime!,
        parents: response.data.parents,
      };
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  /**
   * Upload a file to Google Drive
   */
  async uploadFile(
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string,
    parentFolderId: string = 'root'
  ): Promise<DriveFile> {
    try {
      const response = await this.drive.files.create({
        requestBody: {
          name: fileName,
          parents: [parentFolderId],
        },
        media: {
          mimeType,
          body: fileBuffer,
        },
        fields: 'id,name,mimeType,size,modifiedTime,webViewLink,webContentLink',
      });

      return {
        id: response.data.id!,
        name: response.data.name!,
        mimeType: response.data.mimeType!,
        size: response.data.size,
        modifiedTime: response.data.modifiedTime!,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Download a file from Google Drive
   */
  async downloadFile(fileId: string): Promise<Buffer> {
    try {
      const response = await this.drive.files.get({
        fileId,
        alt: 'media',
      }, { responseType: 'stream' });

      const chunks: Buffer[] = [];
      
      return new Promise((resolve, reject) => {
        response.data
          .on('data', (chunk: Buffer) => chunks.push(chunk))
          .on('end', () => resolve(Buffer.concat(chunks)))
          .on('error', reject);
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  /**
   * Delete a file or folder
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.drive.files.delete({
        fileId,
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Move file to another folder
   */
  async moveFile(fileId: string, newParentFolderId: string): Promise<DriveFile> {
    try {
      // Get current parents
      const file = await this.drive.files.get({
        fileId,
        fields: 'parents',
      });

      const previousParents = file.data.parents?.join(',') || '';

      const response = await this.drive.files.update({
        fileId,
        addParents: newParentFolderId,
        removeParents: previousParents,
        fields: 'id,name,mimeType,size,modifiedTime,parents',
      });

      return {
        id: response.data.id!,
        name: response.data.name!,
        mimeType: response.data.mimeType!,
        size: response.data.size,
        modifiedTime: response.data.modifiedTime!,
        parents: response.data.parents,
      };
    } catch (error) {
      console.error('Error moving file:', error);
      throw error;
    }
  }

  /**
   * Share a file with specific permissions
   */
  async shareFile(fileId: string, email: string, role: 'reader' | 'writer' | 'owner' = 'reader'): Promise<void> {
    try {
      await this.drive.permissions.create({
        fileId,
        requestBody: {
          role,
          type: 'user',
          emailAddress: email,
        },
      });
    } catch (error) {
      console.error('Error sharing file:', error);
      throw error;
    }
  }

  /**
   * Search files by name or content
   */
  async searchFiles(query: string, maxResults: number = 50): Promise<DriveFile[]> {
    try {
      const response = await this.drive.files.list({
        q: `name contains '${query}' and trashed=false`,
        pageSize: maxResults,
        fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,thumbnailLink)',
        orderBy: 'modifiedTime desc',
      });

      interface GoogleDriveFileResponse {
        id: string;
        name: string;
        mimeType: string;
        size?: string;
        modifiedTime: string;
        webViewLink?: string;
        webContentLink?: string;
        thumbnailLink?: string;
      }

      return response.data.files?.map((file: GoogleDriveFileResponse) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        thumbnailLink: file.thumbnailLink,
      })) || [];
    } catch (error) {
      console.error('Error searching files:', error);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<DriveFile> {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,thumbnailLink,parents,owners',
      });

      return {
        id: response.data.id!,
        name: response.data.name!,
        mimeType: response.data.mimeType!,
        size: response.data.size,
        modifiedTime: response.data.modifiedTime!,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink,
        thumbnailLink: response.data.thumbnailLink,
        parents: response.data.parents,
        owners: response.data.owners,
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw error;
    }
  }
}

// Singleton instance
export const googleDriveService = new GoogleDriveService();