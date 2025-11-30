/**
 * Workspace API Routes
 * Read/Write/Search files in workspace - for AI Chat integration
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

// Workspace root - D:\0.PROJECTS
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || 'D:\\0.PROJECTS';

// Allowed file extensions for reading
const ALLOWED_EXTENSIONS = [
  '.js', '.ts', '.jsx', '.tsx', '.json', '.md', '.txt',
  '.css', '.scss', '.html', '.vue', '.svelte',
  '.py', '.sql', '.yml', '.yaml', '.env.example',
  '.gitignore', '.prettierrc', '.eslintrc'
];

// Max file size to read (500KB)
const MAX_FILE_SIZE = 500 * 1024;

/**
 * Helper: Validate path is within workspace
 */
function isPathSafe(filePath) {
  const resolved = path.resolve(filePath);
  const workspaceResolved = path.resolve(WORKSPACE_ROOT);
  return resolved.startsWith(workspaceResolved);
}

/**
 * GET /api/workspace/tree
 * Get directory tree structure
 */
router.get('/tree', async (req, res) => {
  try {
    const { dir = '', depth = 2 } = req.query;
    const targetDir = path.join(WORKSPACE_ROOT, dir);
    
    if (!isPathSafe(targetDir)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const tree = await buildTree(targetDir, parseInt(depth));
    
    res.json({
      success: true,
      root: WORKSPACE_ROOT,
      currentDir: dir || '/',
      tree
    });
  } catch (error) {
    console.error('Workspace tree error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/workspace/files
 * List files in a directory
 */
router.get('/files', async (req, res) => {
  try {
    const { dir = '', pattern = '*' } = req.query;
    const targetDir = path.join(WORKSPACE_ROOT, dir);
    
    if (!isPathSafe(targetDir)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const entries = await fs.readdir(targetDir, { withFileTypes: true });
    const files = entries.map(entry => ({
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file',
      path: path.join(dir, entry.name).replace(/\\/g, '/'),
      ext: entry.isFile() ? path.extname(entry.name) : null
    }));

    res.json({
      success: true,
      directory: dir || '/',
      files: files.sort((a, b) => {
        // Directories first, then files
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/workspace/read
 * Read file content
 */
router.get('/read', async (req, res) => {
  try {
    const { file } = req.query;
    
    if (!file) {
      return res.status(400).json({ success: false, error: 'File path required' });
    }

    const filePath = path.join(WORKSPACE_ROOT, file);
    
    if (!isPathSafe(filePath)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Check file exists
    const stat = await fs.stat(filePath);
    
    if (stat.isDirectory()) {
      return res.status(400).json({ success: false, error: 'Cannot read directory' });
    }

    if (stat.size > MAX_FILE_SIZE) {
      return res.status(400).json({ 
        success: false, 
        error: `File too large (${Math.round(stat.size/1024)}KB > ${MAX_FILE_SIZE/1024}KB)` 
      });
    }

    const ext = path.extname(filePath).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext) && ext !== '') {
      return res.status(400).json({ 
        success: false, 
        error: `File type not allowed: ${ext}` 
      });
    }

    const content = await fs.readFile(filePath, 'utf-8');
    
    res.json({
      success: true,
      file: file,
      filename: path.basename(filePath),
      extension: ext,
      size: stat.size,
      content,
      lines: content.split('\n').length
    });
  } catch (error) {
    console.error('Read file error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/workspace/search
 * Search for text in workspace files
 */
router.post('/search', async (req, res) => {
  try {
    const { query, dir = '', extensions = [], maxResults = 50 } = req.body;
    
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query required' });
    }

    const searchDir = path.join(WORKSPACE_ROOT, dir);
    
    if (!isPathSafe(searchDir)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Build glob pattern
    const exts = extensions.length > 0 
      ? extensions 
      : ['js', 'ts', 'jsx', 'tsx', 'md', 'json'];
    
    const pattern = `**/*.{${exts.join(',')}}`;
    
    // Find files
    const files = await glob(pattern, {
      cwd: searchDir,
      ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/build/**'],
      nodir: true
    });

    const results = [];
    const queryLower = query.toLowerCase();

    for (const file of files) {
      if (results.length >= maxResults) break;
      
      try {
        const filePath = path.join(searchDir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.size > MAX_FILE_SIZE) continue;
        
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        
        const matches = [];
        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(queryLower)) {
            matches.push({
              line: index + 1,
              content: line.trim().substring(0, 200)
            });
          }
        });

        if (matches.length > 0) {
          results.push({
            file: path.join(dir, file).replace(/\\/g, '/'),
            matches: matches.slice(0, 5) // Max 5 matches per file
          });
        }
      } catch (err) {
        // Skip unreadable files
      }
    }

    res.json({
      success: true,
      query,
      directory: dir || '/',
      totalFiles: files.length,
      results,
      resultCount: results.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/workspace/projects
 * List all projects in workspace
 */
router.get('/projects', async (req, res) => {
  try {
    const projects = [];
    const mainDirs = ['00-MASTER-ADMIN', '01-MAIN-PRODUCTS', '02-SABO-ECOSYSTEM', '05-TOOLS'];
    
    for (const mainDir of mainDirs) {
      const dirPath = path.join(WORKSPACE_ROOT, mainDir);
      
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            const projectPath = path.join(dirPath, entry.name);
            const hasPackageJson = await fileExists(path.join(projectPath, 'package.json'));
            const hasReadme = await fileExists(path.join(projectPath, 'README.md'));
            
            projects.push({
              name: entry.name,
              category: mainDir,
              path: `${mainDir}/${entry.name}`,
              hasPackageJson,
              hasReadme
            });
          }
        }
      } catch (err) {
        // Directory doesn't exist, skip
      }
    }

    res.json({
      success: true,
      projects,
      count: projects.length
    });
  } catch (error) {
    console.error('List projects error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/workspace/context
 * Get workspace context for AI - summary of current state
 */
router.get('/context', async (req, res) => {
  try {
    const { project } = req.query;
    
    const context = {
      workspace: WORKSPACE_ROOT,
      timestamp: new Date().toISOString(),
      project: null,
      recentFiles: [],
      errors: [],
      knowledge: []
    };

    // If specific project requested
    if (project) {
      const projectPath = path.join(WORKSPACE_ROOT, project);
      
      if (isPathSafe(projectPath)) {
        // Read package.json
        try {
          const pkgPath = path.join(projectPath, 'package.json');
          const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
          context.project = {
            name: pkg.name,
            version: pkg.version,
            description: pkg.description,
            dependencies: Object.keys(pkg.dependencies || {}),
            devDependencies: Object.keys(pkg.devDependencies || {})
          };
        } catch (err) {
          // No package.json
        }

        // Read README excerpt
        try {
          const readmePath = path.join(projectPath, 'README.md');
          const readme = await fs.readFile(readmePath, 'utf-8');
          context.project = context.project || {};
          context.project.readme = readme.substring(0, 1000);
        } catch (err) {
          // No README
        }
      }
    }

    res.json({
      success: true,
      context
    });
  } catch (error) {
    console.error('Get context error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper functions
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function buildTree(dir, depth, currentDepth = 0) {
  if (currentDepth >= depth) return null;
  
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const result = [];
  
  for (const entry of entries) {
    // Skip hidden and node_modules
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    
    const item = {
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file'
    };
    
    if (entry.isDirectory() && currentDepth < depth - 1) {
      item.children = await buildTree(
        path.join(dir, entry.name), 
        depth, 
        currentDepth + 1
      );
    }
    
    result.push(item);
  }
  
  return result.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

module.exports = router;
