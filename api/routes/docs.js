/**
 * 📚 Documentation Management API Routes
 * REST API for managing documentation across projects
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const { getDocsManager, DOC_CATEGORIES, DOC_STATUS } = require('../services/docs-management');

// Default project path
const DEFAULT_PROJECT_PATH = path.resolve(__dirname, '../..');

/**
 * GET /api/docs/scan
 * Scan and index all documents
 */
router.get('/scan', async (req, res) => {
  try {
    const projectPath = req.query.projectPath || DEFAULT_PROJECT_PATH;
    const manager = getDocsManager(projectPath);
    await manager.initialize();
    const documents = await manager.scanDocs();
    
    res.json({
      success: true,
      message: `Scanned ${documents.length} documents`,
      stats: manager.getStats(),
      documents,
      docs: documents // Also include as 'docs' for frontend compatibility
    });
  } catch (error) {
    console.error('[Docs API] Scan error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/docs/index
 * Get current index without re-scanning
 */
router.get('/index', async (req, res) => {
  try {
    const projectPath = req.query.projectPath || DEFAULT_PROJECT_PATH;
    const manager = getDocsManager(projectPath);
    await manager.initialize();
    
    res.json({
      success: true,
      index: manager.getIndex()
    });
  } catch (error) {
    console.error('[Docs API] Index error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/docs/stats
 * Get documentation statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const projectPath = req.query.projectPath || DEFAULT_PROJECT_PATH;
    const manager = getDocsManager(projectPath);
    await manager.initialize();
    
    res.json({
      success: true,
      stats: manager.getStats(),
      categories: DOC_CATEGORIES
    });
  } catch (error) {
    console.error('[Docs API] Stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/docs/search
 * Search documents
 */
router.get('/search', async (req, res) => {
  try {
    const { q, category, status, limit } = req.query;
    const projectPath = req.query.projectPath || DEFAULT_PROJECT_PATH;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required'
      });
    }
    
    const manager = getDocsManager(projectPath);
    await manager.initialize();
    
    const results = await manager.search(q, {
      category,
      status,
      limit: parseInt(limit) || 20
    });
    
    res.json({
      success: true,
      query: q,
      count: results.length,
      results
    });
  } catch (error) {
    console.error('[Docs API] Search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/docs/category/:category
 * Get documents by category
 */
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const projectPath = req.query.projectPath || DEFAULT_PROJECT_PATH;
    
    const manager = getDocsManager(projectPath);
    await manager.initialize();
    
    const documents = manager.getByCategory(category.toUpperCase());
    
    res.json({
      success: true,
      category,
      count: documents.length,
      documents
    });
  } catch (error) {
    console.error('[Docs API] Category error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/docs/recent
 * Get recently updated documents
 */
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const projectPath = req.query.projectPath || DEFAULT_PROJECT_PATH;
    
    const manager = getDocsManager(projectPath);
    await manager.initialize();
    
    const documents = manager.getRecent(limit);
    
    res.json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    console.error('[Docs API] Recent error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/docs/outdated
 * Get outdated documents
 */
router.get('/outdated', async (req, res) => {
  try {
    const projectPath = req.query.projectPath || DEFAULT_PROJECT_PATH;
    
    const manager = getDocsManager(projectPath);
    await manager.initialize();
    
    const documents = manager.getOutdated();
    
    res.json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    console.error('[Docs API] Outdated error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/docs/organize
 * Auto-organize documents into correct folders
 */
router.post('/organize', async (req, res) => {
  try {
    const { dryRun = true } = req.body;
    const projectPath = req.query.projectPath || DEFAULT_PROJECT_PATH;
    
    const manager = getDocsManager(projectPath);
    await manager.initialize();
    await manager.scanDocs();
    
    const moves = await manager.autoOrganize(dryRun);
    
    res.json({
      success: true,
      dryRun,
      message: dryRun ? 'Preview of changes (no files moved)' : `Moved ${moves.length} files`,
      moves
    });
  } catch (error) {
    console.error('[Docs API] Organize error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/docs/archive
 * Archive old documents
 */
router.post('/archive', async (req, res) => {
  try {
    const { daysOld = 90, dryRun = true } = req.body;
    const projectPath = req.query.projectPath || DEFAULT_PROJECT_PATH;
    
    const manager = getDocsManager(projectPath);
    await manager.initialize();
    await manager.scanDocs();
    
    const archived = await manager.archiveOld(daysOld, dryRun);
    
    res.json({
      success: true,
      dryRun,
      daysOld,
      message: dryRun ? 'Preview of archives (no files moved)' : `Archived ${archived.length} files`,
      documents: archived
    });
  } catch (error) {
    console.error('[Docs API] Archive error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/docs/generate-index
 * Generate INDEX.md file
 */
router.post('/generate-index', async (req, res) => {
  try {
    const projectPath = req.query.projectPath || DEFAULT_PROJECT_PATH;
    
    const manager = getDocsManager(projectPath);
    await manager.initialize();
    await manager.scanDocs();
    
    const markdown = await manager.generateIndexMarkdown();
    
    res.json({
      success: true,
      message: 'INDEX.md generated successfully',
      preview: markdown.substring(0, 500) + '...'
    });
  } catch (error) {
    console.error('[Docs API] Generate index error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/docs/categories
 * Get all available categories
 */
router.get('/categories', (req, res) => {
  res.json({
    success: true,
    categories: DOC_CATEGORIES,
    statuses: DOC_STATUS
  });
});

/**
 * GET /api/docs/content/:id
 * Get document content by ID or relative path
 */
router.get('/content/:id(*)', async (req, res) => {
  try {
    const { id } = req.params;
    const projectPath = req.query.projectPath || DEFAULT_PROJECT_PATH;
    const fs = require('fs').promises;
    
    const manager = getDocsManager(projectPath);
    await manager.initialize();
    
    // Find document by ID or relative path
    let doc = manager.getIndex().documents.find(d => 
      d.id === id || d.relativePath === id || d.name === id
    );
    
    // If not found, try to read directly from _DOCS folder
    if (!doc) {
      const directPath = path.join(projectPath, '_DOCS', id);
      try {
        await fs.access(directPath);
        const content = await fs.readFile(directPath, 'utf-8');
        const stats = await fs.stat(directPath);
        return res.json({
          success: true,
          document: {
            id,
            name: path.basename(id),
            relativePath: id,
            fullPath: directPath,
            modified: stats.mtime
          },
          content
        });
      } catch {
        // Try root _DOCS path
        const rootPath = path.join(projectPath, '_DOCS', id.replace(/^_DOCS\//, ''));
        try {
          await fs.access(rootPath);
          const content = await fs.readFile(rootPath, 'utf-8');
          const stats = await fs.stat(rootPath);
          return res.json({
            success: true,
            document: {
              id,
              name: path.basename(id),
              relativePath: id,
              fullPath: rootPath,
              modified: stats.mtime
            },
            content
          });
        } catch {
          return res.status(404).json({
            success: false,
            error: 'Document not found'
          });
        }
      }
    }
    
    const content = await fs.readFile(doc.fullPath, 'utf-8');
    
    res.json({
      success: true,
      document: doc,
      content
    });
  } catch (error) {
    console.error('[Docs API] Content error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/docs/projects
 * Get list of projects with _DOCS folders
 */
router.get('/projects', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const basePath = req.query.basePath || path.resolve(__dirname, '../../..');
    
    // Known project locations - expanded list
    const projectPaths = [
      // Master Admin
      path.join(basePath, '00-MASTER-ADMIN', 'longsang-admin'),
      // SABO Ecosystem
      path.join(basePath, '02-SABO-ECOSYSTEM', 'sabo-arena', 'app'),
      path.join(basePath, '02-SABO-ECOSYSTEM', 'sabo-hub', 'sabohub-app', 'SABOHUB'),
      path.join(basePath, '02-SABO-ECOSYSTEM', 'sabo-hub', 'sabohub-nexus'),
      // Main Products
      path.join(basePath, '01-MAIN-PRODUCTS', 'ai_secretary'),
      path.join(basePath, '01-MAIN-PRODUCTS', 'ainewbie-web'),
      path.join(basePath, '01-MAIN-PRODUCTS', 'music-video-app'),
      path.join(basePath, '01-MAIN-PRODUCTS', 'long-sang-forge'),
      path.join(basePath, '01-MAIN-PRODUCTS', 'vungtau-dream-homes'),
    ];
    
    const projects = [];
    
    for (const projectPath of projectPaths) {
      try {
        const docsPath = path.join(projectPath, '_DOCS');
        await fs.access(docsPath);
        const stats = await fs.stat(docsPath);
        if (stats.isDirectory()) {
          // Count docs in this folder
          let docCount = 0;
          try {
            const files = await fs.readdir(docsPath, { recursive: true });
            docCount = files.filter(f => f.endsWith('.md')).length;
          } catch (e) {
            // ignore
          }
          
          projects.push({
            name: path.basename(projectPath),
            path: projectPath,
            docsPath,
            docCount,
            hasIndex: await fs.access(path.join(docsPath, 'INDEX.md')).then(() => true).catch(() => false),
            hasStartHere: await fs.access(path.join(docsPath, '00-START-HERE.md')).then(() => true).catch(() => false),
            hasInvestorPitch: await fs.access(path.join(docsPath, 'INVESTOR_PITCH.md')).then(() => true).catch(() => false),
          });
        }
      } catch {
        // Project doesn't have _DOCS
      }
    }
    
    // Sort by doc count descending
    projects.sort((a, b) => b.docCount - a.docCount);
    
    res.json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    console.error('[Docs API] Projects error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
