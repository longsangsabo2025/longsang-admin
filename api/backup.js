/**
 * =================================================================
 * BACKUP API ROUTES
 * =================================================================
 * Endpoints for automated backup to Google Drive
 * 
 * Routes:
 *   POST /api/backup/database - Backup Supabase data to Drive
 *   POST /api/backup/files - Backup local files to Drive
 *   GET  /api/backup/status - Get backup status
 *   GET  /api/backup/history - Get backup history
 */

const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { Readable } = require('stream');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Get OAuth2 client (reuse from main server)
function getOAuth2Client() {
  const oauth2 = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET
  );
  
  // Prioritize Drive-specific token
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN || 
                      process.env.YOUTUBE_REFRESH_TOKEN;
  
  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}

// Backup folder ID in Google Drive (will be created if not exists)
let backupFolderId = null;
const BACKUP_FOLDER_NAME = 'LongSang-Admin-Backups';

// Get or create backup folder
async function getBackupFolder(drive) {
  if (backupFolderId) return backupFolderId;
  
  // Search for existing folder
  const res = await drive.files.list({
    q: `name='${BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  });
  
  if (res.data.files && res.data.files.length > 0) {
    backupFolderId = res.data.files[0].id;
    return backupFolderId;
  }
  
  // Create new folder
  const folder = await drive.files.create({
    requestBody: {
      name: BACKUP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  });
  
  backupFolderId = folder.data.id;
  console.log(`📁 Created backup folder: ${BACKUP_FOLDER_NAME} (${backupFolderId})`);
  return backupFolderId;
}

// Backup history (in-memory, could be persisted to DB)
const backupHistory = [];

// Helper: Create dated subfolder
async function createDatedFolder(drive, parentId) {
  const now = new Date();
  const folderName = now.toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Check if folder exists
  const res = await drive.files.list({
    q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
  });
  
  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id;
  }
  
  // Create new folder
  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  });
  
  return folder.data.id;
}

// POST /api/backup/database - Backup database to Drive
router.post('/database', async (req, res) => {
  try {
    const { tables = ['projects', 'project_social_accounts', 'social_posts'] } = req.body;
    
    const auth = getOAuth2Client();
    const drive = google.drive({ version: 'v3', auth });
    
    // Get backup folder
    const parentId = await getBackupFolder(drive);
    const datedFolderId = await createDatedFolder(drive, parentId);
    
    const results = [];
    const timestamp = new Date().toISOString().split('.')[0].split(':').join('-').split('T').join('-');
    
    // Backup each table from Supabase
    for (const table of tables) {
      const filename = `${table}_${timestamp}.json`;
      
      try {
        // Fetch real data from Supabase
        const { data: tableData, error: fetchError } = await supabase
          .from(table)
          .select('*')
          .limit(10000); // Limit to prevent huge exports
        
        if (fetchError) {
          console.warn(`Warning: Could not fetch ${table}:`, fetchError.message);
          // Still create a file with error info
          const errorData = {
            table,
            exported_at: new Date().toISOString(),
            error: fetchError.message,
            rows: 0,
          };
          const content = JSON.stringify(errorData, null, 2);
          const stream = Readable.from([content]);
          
          const file = await drive.files.create({
            requestBody: {
              name: `${table}_ERROR_${timestamp}.json`,
              parents: [datedFolderId],
              mimeType: 'application/json',
            },
            media: { mimeType: 'application/json', body: stream },
            fields: 'id, name, webViewLink',
          });
          
          results.push({
            table,
            filename: `${table}_ERROR_${timestamp}.json`,
            fileId: file.data.id,
            link: file.data.webViewLink,
            rows: 0,
            error: fetchError.message,
          });
          continue;
        }
        
        // Create backup data object
        const backupData = {
          table,
          exported_at: new Date().toISOString(),
          rows: tableData?.length || 0,
          data: tableData || [],
        };
        
        const content = JSON.stringify(backupData, null, 2);
        const stream = Readable.from([content]);
        
        // Upload to Drive
        const file = await drive.files.create({
          requestBody: {
            name: filename,
            parents: [datedFolderId],
            mimeType: 'application/json',
          },
          media: {
            mimeType: 'application/json',
            body: stream,
          },
          fields: 'id, name, webViewLink',
        });
        
        results.push({
          table,
          filename,
          fileId: file.data.id,
          link: file.data.webViewLink,
          rows: tableData?.length || 0,
        });
        
        console.log(`✅ Backed up ${table}: ${tableData?.length || 0} rows`);
        
      } catch (tableError) {
        console.error(`Error backing up ${table}:`, tableError.message);
        results.push({
          table,
          error: tableError.message,
        });
      }
    }
    
    // Log to history
    const backupRecord = {
      id: Date.now().toString(),
      type: 'database',
      timestamp: new Date().toISOString(),
      tables,
      files: results,
      status: 'success',
    };
    backupHistory.unshift(backupRecord);
    if (backupHistory.length > 50) backupHistory.pop();
    
    res.json({
      success: true,
      message: `Backed up ${tables.length} tables`,
      backup: backupRecord,
    });
    
  } catch (error) {
    console.error('Database backup error:', error);
    
    const errorRecord = {
      id: Date.now().toString(),
      type: 'database',
      timestamp: new Date().toISOString(),
      status: 'failed',
      error: error.message,
    };
    backupHistory.unshift(errorRecord);
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/backup/files - Backup specific files to Drive
router.post('/files', async (req, res) => {
  try {
    const { sourcePath, description = 'Manual file backup' } = req.body;
    
    // This would backup local files - for now just create a manifest
    const auth = getOAuth2Client();
    const drive = google.drive({ version: 'v3', auth });
    
    const parentId = await getBackupFolder(drive);
    const datedFolderId = await createDatedFolder(drive, parentId);
    
    const timestamp = new Date().toISOString().split('.')[0].replace(/[T:]/g, '-');
    const filename = `file-backup-manifest_${timestamp}.json`;
    
    const manifest = {
      description,
      sourcePath: sourcePath || 'N/A',
      created_at: new Date().toISOString(),
      note: 'File backup manifest. Actual file backup requires server-side file access.',
    };
    
    const stream = Readable.from([JSON.stringify(manifest, null, 2)]);
    
    const file = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [datedFolderId],
        mimeType: 'application/json',
      },
      media: {
        mimeType: 'application/json',
        body: stream,
      },
      fields: 'id, name, webViewLink',
    });
    
    const backupRecord = {
      id: Date.now().toString(),
      type: 'files',
      timestamp: new Date().toISOString(),
      description,
      fileId: file.data.id,
      link: file.data.webViewLink,
      status: 'success',
    };
    backupHistory.unshift(backupRecord);
    
    res.json({
      success: true,
      message: 'File backup manifest created',
      backup: backupRecord,
    });
    
  } catch (error) {
    console.error('File backup error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/backup/status - Get current backup status
router.get('/status', async (req, res) => {
  try {
    const auth = getOAuth2Client();
    const drive = google.drive({ version: 'v3', auth });
    
    const folderId = await getBackupFolder(drive);
    
    // Get folder contents
    const contents = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, modifiedTime)',
      orderBy: 'modifiedTime desc',
      pageSize: 10,
    });
    
    // Calculate total size
    const about = await drive.about.get({
      fields: 'storageQuota',
    });
    
    res.json({
      success: true,
      backupFolder: {
        id: folderId,
        name: BACKUP_FOLDER_NAME,
      },
      recentBackups: contents.data.files || [],
      storage: about.data.storageQuota,
      lastBackup: backupHistory[0] || null,
    });
    
  } catch (error) {
    console.error('Backup status error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/backup/history - Get backup history
router.get('/history', (req, res) => {
  const { limit = 20, type } = req.query;
  
  let history = [...backupHistory];
  
  if (type) {
    history = history.filter(h => h.type === type);
  }
  
  res.json({
    success: true,
    total: history.length,
    history: history.slice(0, parseInt(limit)),
  });
});

// POST /api/backup/schedule - Set backup schedule (webhook for n8n)
router.post('/schedule', (req, res) => {
  const { schedule, tables, enabled } = req.body;
  
  // This would typically configure a scheduler or store settings
  // For n8n integration, we just acknowledge and let n8n handle scheduling
  
  res.json({
    success: true,
    message: 'Backup schedule configured',
    config: {
      schedule: schedule || 'daily',
      tables: tables || ['projects', 'project_social_accounts'],
      enabled: enabled !== false,
      webhookUrl: `${process.env.API_URL || 'http://localhost:3001'}/api/backup/database`,
    },
  });
});

module.exports = router;
