/**
 * 📚 Documentation Management Service
 * Auto-organize, categorize, and manage documentation files
 * 
 * Features:
 * - Auto-scan và categorize docs
 * - Search với full-text
 * - Generate summary/index
 * - Archive old docs
 * - Cross-project support
 */

const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Categories for auto-classification
const DOC_CATEGORIES = {
  ARCHITECTURE: {
    keywords: ['architecture', 'system', 'design', 'structure', 'diagram'],
    folder: '01-ARCHITECTURE',
    icon: '🏗️',
    priority: 1
  },
  FEATURES: {
    keywords: ['feature', 'complete', 'implementation', 'integration', 'setup'],
    folder: '02-FEATURES',
    icon: '✨',
    priority: 2
  },
  OPERATIONS: {
    keywords: ['operation', 'runbook', 'monitoring', 'alert', 'incident'],
    folder: '03-OPERATIONS',
    icon: '⚙️',
    priority: 3
  },
  DEPLOYMENT: {
    keywords: ['deploy', 'production', 'staging', 'ci', 'cd', 'pipeline'],
    folder: '04-DEPLOYMENT',
    icon: '🚀',
    priority: 4
  },
  GUIDES: {
    keywords: ['guide', 'tutorial', 'how-to', 'quickstart', 'getting-started'],
    folder: '05-GUIDES',
    icon: '📖',
    priority: 5
  },
  AI: {
    keywords: ['ai', 'llm', 'gpt', 'copilot', 'agent', 'rag', 'embedding'],
    folder: '06-AI',
    icon: '🤖',
    priority: 6
  },
  API: {
    keywords: ['api', 'endpoint', 'rest', 'graphql', 'webhook'],
    folder: '07-API',
    icon: '🔌',
    priority: 7
  },
  DATABASE: {
    keywords: ['database', 'migration', 'schema', 'sql', 'table'],
    folder: '08-DATABASE',
    icon: '🗄️',
    priority: 8
  },
  REPORTS: {
    keywords: ['report', 'bao_cao', 'summary', 'status', 'phase'],
    folder: '09-REPORTS',
    icon: '📊',
    priority: 9
  },
  ARCHIVE: {
    keywords: ['old', 'deprecated', 'archive', 'legacy'],
    folder: '99-ARCHIVE',
    icon: '📦',
    priority: 99
  }
};

// Doc status
const DOC_STATUS = {
  ACTIVE: 'active',
  OUTDATED: 'outdated',
  ARCHIVED: 'archived',
  DRAFT: 'draft'
};

class DocsManagementService {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.docsPath = path.join(projectPath, '_DOCS');
    this.indexPath = path.join(this.docsPath, '.docs-index.json');
    this.index = null;
  }

  /**
   * Initialize service - load or create index
   */
  async initialize() {
    try {
      const indexContent = await fs.readFile(this.indexPath, 'utf-8');
      this.index = JSON.parse(indexContent);
    } catch {
      this.index = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        documents: [],
        categories: DOC_CATEGORIES,
        stats: {}
      };
      await this.saveIndex();
    }
    return this;
  }

  /**
   * Save index to file
   */
  async saveIndex() {
    this.index.lastUpdated = new Date().toISOString();
    await fs.writeFile(this.indexPath, JSON.stringify(this.index, null, 2));
  }

  /**
   * Scan all docs in _DOCS folder
   */
  async scanDocs() {
    const documents = [];
    await this._scanDirectory(this.docsPath, documents);
    
    this.index.documents = documents;
    this.index.stats = this._calculateStats(documents);
    await this.saveIndex();
    
    return documents;
  }

  /**
   * Recursive scan directory
   */
  async _scanDirectory(dirPath, documents, relativePath = '') {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relPath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          // Skip hidden folders and node_modules
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await this._scanDirectory(fullPath, documents, relPath);
          }
        } else if (entry.name.endsWith('.md')) {
          const doc = await this._parseDocument(fullPath, relPath);
          documents.push(doc);
        }
      }
    } catch (error) {
      console.error(`Error scanning ${dirPath}:`, error.message);
    }
  }

  /**
   * Parse a single document
   */
  async _parseDocument(filePath, relativePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);
    
    // Extract title from first heading or filename
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : path.basename(filePath, '.md');
    
    // Extract description from first paragraph
    const descMatch = content.match(/^#.+\n+([^#\n].+)/m);
    const description = descMatch ? descMatch[1].substring(0, 200) : '';
    
    // Auto-categorize
    const category = this._categorize(relativePath, content);
    
    // Check status based on age
    const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
    let status = DOC_STATUS.ACTIVE;
    if (ageInDays > 90) status = DOC_STATUS.OUTDATED;
    if (relativePath.toLowerCase().includes('archive')) status = DOC_STATUS.ARCHIVED;
    
    // Extract tags from content
    const tags = this._extractTags(content);
    
    return {
      id: Buffer.from(relativePath).toString('base64'),
      path: relativePath,
      fullPath: filePath,
      title: this._cleanTitle(title),
      description,
      category: category.name,
      categoryIcon: category.icon,
      status,
      tags,
      size: stats.size,
      lines: content.split('\n').length,
      words: content.split(/\s+/).length,
      createdAt: stats.birthtime.toISOString(),
      modifiedAt: stats.mtime.toISOString(),
      ageInDays: Math.round(ageInDays)
    };
  }

  /**
   * Clean title - remove emojis, special chars
   */
  _cleanTitle(title) {
    return title
      .replace(/[✅❌⚠️🔴🟡🟢📚🚀✨🎯💡🔥⭐]/g, '')
      .replace(/_/g, ' ')
      .trim();
  }

  /**
   * Auto-categorize document based on path and content
   */
  _categorize(relativePath, content) {
    const lowerPath = relativePath.toLowerCase();
    const lowerContent = content.toLowerCase();
    
    // Check current folder first
    for (const [name, config] of Object.entries(DOC_CATEGORIES)) {
      if (lowerPath.includes(config.folder.toLowerCase())) {
        return { name, ...config };
      }
    }
    
    // Check keywords in filename and content
    for (const [name, config] of Object.entries(DOC_CATEGORIES)) {
      for (const keyword of config.keywords) {
        if (lowerPath.includes(keyword) || lowerContent.includes(keyword)) {
          return { name, ...config };
        }
      }
    }
    
    // Default to REPORTS for uncategorized
    return { name: 'REPORTS', ...DOC_CATEGORIES.REPORTS };
  }

  /**
   * Extract tags from content
   */
  _extractTags(content) {
    const tags = new Set();
    
    // Extract from explicit tags line
    const tagsMatch = content.match(/tags?:\s*(.+)/i);
    if (tagsMatch) {
      tagsMatch[1].split(/[,;]/).forEach(tag => tags.add(tag.trim().toLowerCase()));
    }
    
    // Extract common tech terms
    const techTerms = ['react', 'typescript', 'supabase', 'n8n', 'api', 'database', 
                       'ai', 'seo', 'google', 'email', 'auth', 'deploy'];
    const lowerContent = content.toLowerCase();
    techTerms.forEach(term => {
      if (lowerContent.includes(term)) tags.add(term);
    });
    
    return Array.from(tags).slice(0, 10);
  }

  /**
   * Calculate stats
   */
  _calculateStats(documents) {
    const stats = {
      total: documents.length,
      byCategory: {},
      byStatus: {},
      totalWords: 0,
      totalLines: 0,
      avgAge: 0
    };
    
    let totalAge = 0;
    
    documents.forEach(doc => {
      // By category
      stats.byCategory[doc.category] = (stats.byCategory[doc.category] || 0) + 1;
      
      // By status
      stats.byStatus[doc.status] = (stats.byStatus[doc.status] || 0) + 1;
      
      // Totals
      stats.totalWords += doc.words;
      stats.totalLines += doc.lines;
      totalAge += doc.ageInDays;
    });
    
    stats.avgAge = documents.length > 0 ? Math.round(totalAge / documents.length) : 0;
    
    return stats;
  }

  /**
   * Search documents
   */
  async search(query, options = {}) {
    const { category, status, limit = 20 } = options;
    const lowerQuery = query.toLowerCase();
    
    let results = this.index.documents.filter(doc => {
      // Text search
      const matchText = 
        doc.title.toLowerCase().includes(lowerQuery) ||
        doc.description.toLowerCase().includes(lowerQuery) ||
        doc.path.toLowerCase().includes(lowerQuery) ||
        doc.tags.some(tag => tag.includes(lowerQuery));
      
      // Category filter
      const matchCategory = !category || doc.category === category;
      
      // Status filter
      const matchStatus = !status || doc.status === status;
      
      return matchText && matchCategory && matchStatus;
    });
    
    // Sort by relevance (title match first, then recent)
    results.sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(lowerQuery) ? 1 : 0;
      const bTitle = b.title.toLowerCase().includes(lowerQuery) ? 1 : 0;
      if (aTitle !== bTitle) return bTitle - aTitle;
      return new Date(b.modifiedAt) - new Date(a.modifiedAt);
    });
    
    return results.slice(0, limit);
  }

  /**
   * Get documents by category
   */
  getByCategory(category) {
    return this.index.documents.filter(doc => doc.category === category);
  }

  /**
   * Get recent documents
   */
  getRecent(limit = 10) {
    return [...this.index.documents]
      .sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt))
      .slice(0, limit);
  }

  /**
   * Get outdated documents
   */
  getOutdated() {
    return this.index.documents.filter(doc => doc.status === DOC_STATUS.OUTDATED);
  }

  /**
   * Auto-organize: Move docs to correct folders
   */
  async autoOrganize(dryRun = true) {
    const moves = [];
    
    for (const doc of this.index.documents) {
      const currentFolder = path.dirname(doc.path);
      const suggestedFolder = DOC_CATEGORIES[doc.category]?.folder || '09-REPORTS';
      
      // Check if doc is in root or wrong folder
      if (!currentFolder.includes(suggestedFolder) && 
          !currentFolder.startsWith(suggestedFolder)) {
        moves.push({
          doc,
          from: doc.path,
          to: path.join(suggestedFolder, path.basename(doc.path)),
          reason: `Auto-categorized as ${doc.category}`
        });
      }
    }
    
    if (!dryRun) {
      for (const move of moves) {
        try {
          const newDir = path.join(this.docsPath, path.dirname(move.to));
          await fs.mkdir(newDir, { recursive: true });
          await fs.rename(
            path.join(this.docsPath, move.from),
            path.join(this.docsPath, move.to)
          );
          console.log(`Moved: ${move.from} -> ${move.to}`);
        } catch (error) {
          console.error(`Failed to move ${move.from}:`, error.message);
        }
      }
      
      // Re-scan after organize
      await this.scanDocs();
    }
    
    return moves;
  }

  /**
   * Archive old documents
   */
  async archiveOld(daysOld = 90, dryRun = true) {
    const toArchive = this.index.documents.filter(doc => 
      doc.ageInDays > daysOld && 
      doc.status !== DOC_STATUS.ARCHIVED &&
      !doc.path.includes('ARCHITECTURE') // Don't archive architecture docs
    );
    
    if (!dryRun) {
      const archiveDir = path.join(this.docsPath, '99-ARCHIVE');
      await fs.mkdir(archiveDir, { recursive: true });
      
      for (const doc of toArchive) {
        try {
          const archivePath = path.join(archiveDir, path.basename(doc.path));
          await fs.rename(doc.fullPath, path.join(this.docsPath, archivePath));
          console.log(`Archived: ${doc.path}`);
        } catch (error) {
          console.error(`Failed to archive ${doc.path}:`, error.message);
        }
      }
      
      await this.scanDocs();
    }
    
    return toArchive;
  }

  /**
   * Generate index/summary markdown
   */
  async generateIndexMarkdown() {
    const lines = [
      '# 📚 Documentation Index',
      '',
      `> Auto-generated on ${new Date().toLocaleString('vi-VN')}`,
      `> Total: ${this.index.stats.total} documents | ${this.index.stats.totalWords.toLocaleString()} words`,
      '',
      '## 📊 Quick Stats',
      '',
      '| Category | Count |',
      '|----------|-------|',
    ];
    
    // Category stats
    for (const [cat, count] of Object.entries(this.index.stats.byCategory)) {
      const icon = DOC_CATEGORIES[cat]?.icon || '📄';
      lines.push(`| ${icon} ${cat} | ${count} |`);
    }
    
    lines.push('');
    lines.push('## 📂 By Category');
    lines.push('');
    
    // Group by category
    const byCategory = {};
    this.index.documents.forEach(doc => {
      if (!byCategory[doc.category]) byCategory[doc.category] = [];
      byCategory[doc.category].push(doc);
    });
    
    for (const [category, docs] of Object.entries(byCategory)) {
      const config = DOC_CATEGORIES[category];
      lines.push(`### ${config?.icon || '📄'} ${category}`);
      lines.push('');
      
      docs.slice(0, 10).forEach(doc => {
        const status = doc.status === 'outdated' ? '⚠️' : '✅';
        lines.push(`- ${status} [${doc.title}](${doc.path})`);
      });
      
      if (docs.length > 10) {
        lines.push(`- ... and ${docs.length - 10} more`);
      }
      lines.push('');
    }
    
    // Recent updates
    lines.push('## 🕐 Recently Updated');
    lines.push('');
    
    const recent = this.getRecent(5);
    recent.forEach(doc => {
      const date = new Date(doc.modifiedAt).toLocaleDateString('vi-VN');
      lines.push(`- [${doc.title}](${doc.path}) - ${date}`);
    });
    
    const markdown = lines.join('\n');
    const indexFilePath = path.join(this.docsPath, 'INDEX.md');
    await fs.writeFile(indexFilePath, markdown);
    
    return markdown;
  }

  /**
   * Get full index data
   */
  getIndex() {
    return this.index;
  }

  /**
   * Get stats
   */
  getStats() {
    return this.index.stats;
  }

  /**
   * Get categories
   */
  getCategories() {
    return DOC_CATEGORIES;
  }
}

// Singleton factory
const instances = new Map();

function getDocsManager(projectPath) {
  if (!instances.has(projectPath)) {
    instances.set(projectPath, new DocsManagementService(projectPath));
  }
  return instances.get(projectPath);
}

module.exports = {
  DocsManagementService,
  getDocsManager,
  DOC_CATEGORIES,
  DOC_STATUS
};
