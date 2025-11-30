/**
 * 🧠 AUTO-INGEST WORKSPACE DOCS TO AI BRAIN
 * 
 * Tự động scan và nạp tất cả documentation từ workspace vào AI Second Brain
 * 
 * Usage: node scripts/auto-ingest-workspace-docs.js
 */

const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3001/api/brain';
const USER_ID = '6490f4e9-ed96-4121-9c70-bb4ad1feb71d';
const WORKSPACE_ROOT = 'D:\\0.PROJECTS';

const headers = {
  'Content-Type': 'application/json',
  'x-user-id': USER_ID
};

// ========================================
// 📁 PROJECTS TO SCAN
// ========================================

const PROJECTS_CONFIG = [
  {
    name: 'Longsang Admin',
    path: '00-MASTER-ADMIN/longsang-admin',
    domain: 'Longsang Admin',
    docFolders: ['docs', 'api/docs'],
    priority: 1
  },
  {
    name: 'SABO Arena',
    path: '02-SABO-ECOSYSTEM/sabo-arena',
    domain: 'SABO Ecosystem',
    docFolders: ['docs', 'app/docs', 'README.md'],
    priority: 2
  },
  {
    name: 'SABO Hub',
    path: '02-SABO-ECOSYSTEM/sabo-hub',
    domain: 'SABO Ecosystem',
    docFolders: ['docs'],
    priority: 2
  },
  {
    name: 'Vung Tau Dream Homes',
    path: '01-MAIN-PRODUCTS/vungtau-dream-homes',
    domain: 'Real Estate Projects',
    docFolders: ['docs'],
    priority: 3
  },
  {
    name: 'AI Secretary',
    path: '01-MAIN-PRODUCTS/ai_secretary',
    domain: 'AI Projects',
    docFolders: ['docs'],
    priority: 3
  },
  {
    name: 'AI Newbie Web',
    path: '01-MAIN-PRODUCTS/ainewbie-web',
    domain: 'AI Projects',
    docFolders: ['docs'],
    priority: 3
  },
  {
    name: 'Workspace Shared',
    path: '_SHARED',
    domain: 'Development Guides',
    docFolders: ['configs', 'templates'],
    priority: 1
  },
  {
    name: 'Workspace Docs',
    path: '_DOCS',
    domain: 'Development Guides',
    docFolders: ['.'],
    priority: 1
  }
];

// ========================================
// 📝 FILE PATTERNS
// ========================================

const DOC_PATTERNS = [
  /\.md$/i,           // Markdown
  /README/i,          // READMEs
  /CHANGELOG/i,       // Changelogs
  /\.txt$/i,          // Text files (guides)
];

const IGNORE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /dist/,
  /build/,
  /\.next/,
  /coverage/,
  /\.env/,
  /package-lock/,
  /yarn\.lock/,
];

// ========================================
// 🔧 HELPERS
// ========================================

function shouldProcessFile(filePath) {
  // Check ignore patterns
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.test(filePath)) return false;
  }
  
  // Check doc patterns
  for (const pattern of DOC_PATTERNS) {
    if (pattern.test(filePath)) return true;
  }
  
  return false;
}

function extractTitleFromContent(content, fileName) {
  // Try to extract title from markdown heading
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();
  
  // Use filename without extension
  return path.basename(fileName, path.extname(fileName))
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function extractTagsFromPath(filePath, projectName) {
  const tags = ['type:document', 'status:imported', 'source:auto-scan'];
  
  // Add project tag
  tags.push(`project:${projectName.toLowerCase().replace(/\s+/g, '-')}`);
  
  // Add folder-based tags
  const parts = filePath.toLowerCase().split(/[\/\\]/);
  if (parts.includes('api')) tags.push('domain:api');
  if (parts.includes('setup')) tags.push('domain:setup');
  if (parts.includes('deployment')) tags.push('domain:deployment');
  if (parts.includes('security')) tags.push('domain:security');
  if (parts.includes('guide') || parts.includes('guides')) tags.push('type:guide');
  if (parts.includes('reference')) tags.push('type:reference');
  
  return tags;
}

function truncateContent(content, maxLength = 8000) {
  if (content.length <= maxLength) return content;
  
  // Try to truncate at a paragraph break
  const truncated = content.substring(0, maxLength);
  const lastParagraph = truncated.lastIndexOf('\n\n');
  
  if (lastParagraph > maxLength * 0.7) {
    return truncated.substring(0, lastParagraph) + '\n\n... (truncated)';
  }
  
  return truncated + '\n\n... (truncated)';
}

// ========================================
// 📡 API HELPERS
// ========================================

async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers,
    ...options
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

async function getOrCreateDomain(domainName) {
  // Check if domain exists
  const domains = await fetchAPI(`/domains?userId=${USER_ID}`);
  const existing = domains.data?.find(d => d.name === domainName);
  
  if (existing) return existing.id;
  
  // Create domain
  const result = await fetchAPI('/domains', {
    method: 'POST',
    body: JSON.stringify({
      name: domainName,
      description: `Auto-created domain for ${domainName} documentation`,
      userId: USER_ID
    })
  });
  
  console.log(`  ✅ Created domain: ${domainName}`);
  return result.data.id;
}

async function checkDuplicate(title, domainId) {
  try {
    const result = await fetchAPI(`/knowledge/search?q=${encodeURIComponent(title)}&userId=${USER_ID}&matchThreshold=0.9&matchCount=1&domainId=${domainId}`);
    return result.data && result.data.length > 0 && result.data[0].similarity > 0.95;
  } catch (e) {
    return false;
  }
}

async function ingestDocument(domainId, title, content, tags, sourceFile) {
  // Skip if duplicate
  const isDuplicate = await checkDuplicate(title, domainId);
  if (isDuplicate) {
    return { success: false, reason: 'duplicate' };
  }
  
  // Truncate content if too long
  const processedContent = truncateContent(content);
  
  try {
    await fetchAPI('/knowledge/ingest', {
      method: 'POST',
      body: JSON.stringify({
        domainId,
        userId: USER_ID,
        title,
        content: processedContent,
        contentType: 'document',
        tags,
        sourceUrl: `file://${sourceFile}`,
        metadata: {
          originalLength: content.length,
          truncated: content.length > 8000,
          importedAt: new Date().toISOString()
        }
      })
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, reason: 'error', error: error.message };
  }
}

// ========================================
// 📂 FILE SCANNER
// ========================================

function scanDirectory(dirPath, maxDepth = 3, currentDepth = 0) {
  const files = [];
  
  if (currentDepth > maxDepth) return files;
  if (!fs.existsSync(dirPath)) return files;
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      // Skip ignored paths
      if (IGNORE_PATTERNS.some(p => p.test(fullPath))) continue;
      
      if (entry.isDirectory()) {
        files.push(...scanDirectory(fullPath, maxDepth, currentDepth + 1));
      } else if (entry.isFile() && shouldProcessFile(entry.name)) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`  ⚠️ Cannot read ${dirPath}: ${error.message}`);
  }
  
  return files;
}

// ========================================
// 🚀 MAIN
// ========================================

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║   🧠 AUTO-INGEST WORKSPACE DOCS TO AI BRAIN                      ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  // Check API
  console.log('📡 Checking API connection...');
  try {
    await fetchAPI('/health');
    console.log('✅ API is running\n');
  } catch (error) {
    console.error('❌ API not running! Start with: npm run dev');
    process.exit(1);
  }

  const stats = {
    scanned: 0,
    ingested: 0,
    skipped: 0,
    duplicates: 0,
    errors: 0
  };

  // Sort by priority
  const sortedProjects = PROJECTS_CONFIG.sort((a, b) => a.priority - b.priority);

  for (const project of sortedProjects) {
    const projectPath = path.join(WORKSPACE_ROOT, project.path);
    
    if (!fs.existsSync(projectPath)) {
      console.log(`⏭️ Skipping ${project.name} (path not found)`);
      continue;
    }

    console.log(`\n📂 ${project.name}`);
    console.log(`   Path: ${project.path}`);
    
    // Get or create domain
    const domainId = await getOrCreateDomain(project.domain);
    
    // Scan doc folders
    let projectFiles = [];
    
    for (const docFolder of project.docFolders) {
      const folderPath = path.join(projectPath, docFolder);
      
      if (docFolder.endsWith('.md')) {
        // It's a file, not a folder
        if (fs.existsSync(folderPath)) {
          projectFiles.push(folderPath);
        }
      } else {
        projectFiles.push(...scanDirectory(folderPath));
      }
    }

    console.log(`   Found ${projectFiles.length} documentation files`);
    stats.scanned += projectFiles.length;

    // Process files
    for (const filePath of projectFiles) {
      const fileName = path.relative(projectPath, filePath);
      
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Skip empty or very small files
        if (content.trim().length < 100) {
          console.log(`   ⏭️ Skipped (too small): ${fileName}`);
          stats.skipped++;
          continue;
        }
        
        const title = extractTitleFromContent(content, fileName);
        const tags = extractTagsFromPath(filePath, project.name);
        
        const result = await ingestDocument(domainId, title, content, tags, filePath);
        
        if (result.success) {
          console.log(`   ✅ ${title}`);
          stats.ingested++;
        } else if (result.reason === 'duplicate') {
          console.log(`   ⏭️ Duplicate: ${title}`);
          stats.duplicates++;
        } else {
          console.log(`   ❌ ${title}: ${result.error}`);
          stats.errors++;
        }
        
        // Rate limiting
        await new Promise(r => setTimeout(r, 200));
        
      } catch (error) {
        console.log(`   ❌ Error reading ${fileName}: ${error.message}`);
        stats.errors++;
      }
    }
  }

  // Summary
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                         📊 SUMMARY                               ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  📁 Files scanned:      ${stats.scanned.toString().padEnd(4)}                                  ║`);
  console.log(`║  ✅ Successfully added: ${stats.ingested.toString().padEnd(4)}                                  ║`);
  console.log(`║  ⏭️  Duplicates:         ${stats.duplicates.toString().padEnd(4)}                                  ║`);
  console.log(`║  ⏭️  Skipped (small):    ${stats.skipped.toString().padEnd(4)}                                  ║`);
  console.log(`║  ❌ Errors:             ${stats.errors.toString().padEnd(4)}                                  ║`);
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');
  
  console.log('🧠 Your AI Brain has been updated with workspace knowledge!');
  console.log('   Test it: http://localhost:8080/admin/brain > Search tab\n');
}

main().catch(console.error);
