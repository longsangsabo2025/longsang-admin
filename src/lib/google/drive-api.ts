/**
 * Google Drive API - Browser-Safe Version
 * All operations must be called through API server
 */

import { supabase } from '@/integrations/supabase/client';

export interface UploadOptions {
  name: string;
  mimeType: string;
  content: Buffer | string;
  folderId?: string;
  description?: string;
}

export interface FileResult {
  status: 'success' | 'error';
  fileId?: string;
  fileLink?: string;
  webViewLink?: string;
  message: string;
  timestamp: string;
}

// ============================================================
// STUB FUNCTIONS - CALL THROUGH API SERVER
// ============================================================

export async function uploadFile(
  _driveEmail: string,
  _options: UploadOptions
): Promise<FileResult> {
  throw new Error('uploadFile must be called through API server endpoint: POST /api/google/drive/upload');
}

export async function createFolder(
  _driveEmail: string,
  _folderName: string,
  _parentFolderId?: string
): Promise<FileResult> {
  throw new Error('createFolder must be called through API server endpoint: POST /api/google/drive/create-folder');
}

export async function deleteFile(
  _driveEmail: string,
  _fileId: string
): Promise<FileResult> {
  throw new Error('deleteFile must be called through API server endpoint: DELETE /api/google/drive/delete');
}

export async function shareFile(
  _driveEmail: string,
  _fileId: string,
  _email: string,
  _role: 'reader' | 'writer' | 'commenter' = 'reader'
): Promise<FileResult> {
  throw new Error('shareFile must be called through API server endpoint: POST /api/google/drive/share');
}

export async function listFiles(
  _driveEmail: string,
  _folderId?: string,
  _maxResults: number = 100
) {
  throw new Error('listFiles must be called through API server endpoint: GET /api/google/drive/list');
}

export async function getFileMetadata(
  _driveEmail: string,
  _fileId: string
) {
  throw new Error('getFileMetadata must be called through API server endpoint: GET /api/google/drive/metadata');
}

export async function autoBackupContent() {
  throw new Error('autoBackupContent must be called through API server endpoint: POST /api/google/drive/auto-backup');
}

export async function organizeDriveByProject() {
  throw new Error('organizeDriveByProject must be called through API server endpoint: POST /api/google/drive/organize-by-project');
}

// ============================================================
// WORKING FUNCTIONS - SUPABASE ONLY (SAFE IN BROWSER)
// ============================================================

/**
 * Get Drive file statistics from database
 */
export async function getDriveStats(days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('drive_files')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    const total = data?.length || 0;
    const totalSize = data?.reduce((sum, file) => sum + (file.size || 0), 0) || 0;

    return {
      total,
      totalSize,
      recentFiles: data?.slice(0, 10) || [],
    };
  } catch (error) {
    console.error('Error getting drive stats:', error);
    throw error;
  }
}

/**
 * Get files from database
 */
export async function getFilesFromDB(limit: number = 50) {
  try {
    const { data, error } = await supabase
      .from('drive_files')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting files from DB:', error);
    throw error;
  }
}

/**
 * Get file by ID from database
 */
export async function getFileFromDB(fileId: string) {
  try {
    const { data, error } = await supabase
      .from('drive_files')
      .select('*')
      .eq('google_file_id', fileId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting file from DB:', error);
    throw error;
  }
}

/**
 * Search files in database
 */
export async function searchFilesInDB(query: string, limit: number = 20) {
  try {
    const { data, error } = await supabase
      .from('drive_files')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching files:', error);
    throw error;
  }
}
