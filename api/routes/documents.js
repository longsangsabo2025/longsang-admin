/**
 * Documents API Routes
 * Handle document upload and management for RAG
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { createClient } = require('@supabase/supabase-js');
const { processAndIndexDocument } = require('../services/ai-workspace/document-processor');
const { getAPIKeys } = require('../services/ai-workspace/env-loader');

const keys = getAPIKeys();
const supabase = createClient(
  keys.supabaseUrl,
  keys.supabaseServiceKey || keys.supabaseAnonKey
);

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../../tmp/uploads'),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT are allowed.'));
    }
  },
});

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../tmp/uploads');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

/**
 * POST /api/documents/upload
 * Upload and process document
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const { userId, assistantType } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    if (!assistantType) {
      return res.status(400).json({
        success: false,
        error: 'Assistant type is required',
      });
    }

    // Process and index document
    const result = await processAndIndexDocument({
      filePath: req.file.path,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      userId,
      assistantType,
    });

    // Store document metadata in a separate table (optional, for UI display)
    const { data: docRecord, error } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        source_type: 'upload',
        source_id: req.file.originalname,
        metadata: {
          file_name: req.file.originalname,
          file_type: req.file.mimetype,
          file_size: req.file.size,
          chunks_count: result.chunksCount,
          processed_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    res.json({
      success: true,
      document: docRecord,
      processing: result,
    });
  } catch (error) {
    console.error('[Documents] Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process document',
    });
  }
});

/**
 * GET /api/documents
 * List user documents
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'];
    const { assistantType } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    let query = supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .eq('source_type', 'upload')
      .order('created_at', { ascending: false });

    if (assistantType) {
      // Filter by assistant type if provided
      // Note: This requires checking metadata or adding assistant_type column
      // For now, we'll return all documents
    }

    const { data, error } = await query;

    if (error) {
      // If table doesn't exist, return empty array instead of error
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        return res.json({
          success: true,
          documents: [],
          message: 'Documents table not found. Please run migration first.',
        });
      }
      throw error;
    }

    res.json({
      success: true,
      documents: data || [],
    });
  } catch (error) {
    console.error('[Documents] List error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list documents',
    });
  }
});

/**
 * GET /api/documents/:id
 * Get document details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
      });
    }

    res.json({
      success: true,
      document: data,
    });
  } catch (error) {
    console.error('[Documents] Get error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get document',
    });
  }
});

/**
 * DELETE /api/documents/:id
 * Delete document
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    // Delete from documents table
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('[Documents] Delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete document',
    });
  }
});

module.exports = router;

