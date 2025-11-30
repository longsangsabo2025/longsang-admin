/**
 * 📚 LongSang Admin Documentation Organizer
 * Run: node scripts/organize-admin-docs.cjs
 */

const fs = require('fs');
const path = require('path');

const DOCS_ROOT = path.resolve(__dirname, '..', '_DOCS');

// Category definitions
const CATEGORIES = {
  '01-ARCHITECTURE': {
    keywords: ['architecture', 'system', 'structure', 'connection'],
    patterns: [/ARCHITECTURE/, /SYSTEM/, /CONNECTION/]
  },
  '02-FEATURES': {
    keywords: ['feature', 'complete', 'implementation', 'workspace', 'command', 'email'],
    patterns: [/FEATURE/, /IMPLEMENTATION/, /WORKSPACE/, /COMMAND/, /EMAIL/]
  },
  '03-OPERATIONS': {
    keywords: ['operations', 'monitoring', 'troubleshooting', 'fix', 'runbook', 'issues'],
    patterns: [/OPERATION/, /MONITORING/, /TROUBLESHOOT/, /FIX/, /RUNBOOK/, /ISSUES/]
  },
  '04-DEPLOYMENT': {
    keywords: ['deployment', 'deploy', 'production', 'setup', 'env', 'checklist'],
    patterns: [/DEPLOY/, /PRODUCTION/, /SETUP/, /ENV/, /CHECKLIST/]
  },
  '05-GUIDES': {
    keywords: ['guide', 'quick', 'start', 'reference', 'manual', 'tutorial', 'how', 'user', 'use_case', 'workflow', 'example'],
    patterns: [/GUIDE/, /QUICK/, /REFERENCE/, /MANUAL/, /TUTORIAL/, /USER/, /USE_CASE/, /WORKFLOW/, /EXAMPLE/]
  },
  '06-AI': {
    keywords: ['ai', 'copilot', 'cursor', 'agent'],
    patterns: [/^AI_/, /COPILOT/, /CURSOR/, /AGENT/]
  },
  '07-API': {
    keywords: ['api', 'endpoint', 'rest', 'documentation'],
    patterns: [/^API_/, /ENDPOINT/]
  },
  '08-DATABASE': {
    keywords: ['database', 'schema', 'migration', 'table'],
    patterns: [/DATABASE/, /SCHEMA/, /MIGRATION/, /TABLE/]
  },
  '09-REPORTS': {
    keywords: ['report', 'bao_cao', 'status', 'summary', 'test', 'execution', 'handoff', 'phase', 'tracker', 'deep_dive', 'roadmap', 'readiness'],
    patterns: [/REPORT/, /BAO_CAO/, /STATUS/, /SUMMARY/, /HANDOFF/, /PHASE/, /TRACKER/, /DEEP_DIVE/, /ROADMAP/, /READINESS/]
  },
  '10-ARCHIVE': {
    keywords: ['old', 'legacy', 'deprecated'],
    patterns: [/OLD/, /LEGACY/]
  }
};

// Ensure directories
function ensureDirs() {
  Object.keys(CATEGORIES).forEach(cat => {
    const catPath = path.join(DOCS_ROOT, cat);
    if (!fs.existsSync(catPath)) {
      fs.mkdirSync(catPath, { recursive: true });
    }
  });
}

// Categorize file
function categorizeFile(filename) {
  const upperName = filename.toUpperCase().replace(/\.MD$/, '');
  
  for (const [category, config] of Object.entries(CATEGORIES)) {
    if (config.patterns.some(p => p.test(upperName))) {
      return category;
    }
    if (config.keywords.some(k => upperName.includes(k.toUpperCase()))) {
      return category;
    }
  }
  
  // Defaults based on patterns
  if (upperName.includes('BAO_CAO') || upperName.includes('PHASE')) {
    return '09-REPORTS';
  }
  if (upperName.startsWith('AI_') || upperName.includes('AI_')) {
    return '06-AI';
  }
  if (upperName.includes('COMPLETE')) {
    return '09-REPORTS';
  }
  
  return '10-ARCHIVE';
}

// Organize
function organize() {
  ensureDirs();
  
  const files = fs.readdirSync(DOCS_ROOT)
    .filter(f => f.endsWith('.md') && !fs.statSync(path.join(DOCS_ROOT, f)).isDirectory());
  
  let moved = 0;
  const stats = {};
  
  files.forEach(file => {
    const sourcePath = path.join(DOCS_ROOT, file);
    const category = categorizeFile(file);
    const destPath = path.join(DOCS_ROOT, category, file);
    
    if (fs.existsSync(destPath)) {
      console.log(`⚠️ Skip ${file} (already exists)`);
      return;
    }
    
    try {
      fs.renameSync(sourcePath, destPath);
      moved++;
      stats[category] = (stats[category] || 0) + 1;
      console.log(`✅ ${file} → ${category}`);
    } catch (err) {
      console.error(`❌ Failed: ${file}`);
    }
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Moved ${moved} files`);
  Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => console.log(`   ${cat}: ${count}`));
}

organize();
