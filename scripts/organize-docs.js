#!/usr/bin/env node
/**
 * 📚 Documentation Auto-Organize Script
 * Run this script to automatically organize documentation files
 * 
 * Usage:
 *   node scripts/organize-docs.js           # Preview changes (dry run)
 *   node scripts/organize-docs.js --execute # Actually move files
 *   node scripts/organize-docs.js --index   # Generate INDEX.md
 *   node scripts/organize-docs.js --archive # Archive old files (90+ days)
 */

const path = require('path');
const { DocsManagementService } = require('../api/services/docs-management');

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  const generateIndex = args.includes('--index');
  const archive = args.includes('--archive');
  const help = args.includes('--help') || args.includes('-h');
  
  if (help) {
    console.log(`
📚 Documentation Auto-Organize Script

Usage:
  node scripts/organize-docs.js [options]

Options:
  --execute    Actually move files (default is dry-run preview)
  --index      Generate INDEX.md file
  --archive    Archive documents older than 90 days
  --help, -h   Show this help message

Examples:
  node scripts/organize-docs.js           # Preview organize changes
  node scripts/organize-docs.js --execute # Execute organize
  node scripts/organize-docs.js --index   # Generate INDEX.md
  node scripts/organize-docs.js --archive --execute # Archive old docs
`);
    process.exit(0);
  }
  
  const projectPath = path.resolve(__dirname, '..');
  const manager = new DocsManagementService(projectPath);
  
  console.log('📚 Documentation Auto-Organize');
  console.log('================================\n');
  console.log(`📁 Project: ${projectPath}`);
  console.log(`📂 Docs Path: ${manager.docsPath}\n`);
  
  // Initialize and scan
  console.log('🔍 Scanning documents...\n');
  await manager.initialize();
  const documents = await manager.scanDocs();
  const stats = manager.getStats();
  
  // Print stats
  console.log('📊 Statistics:');
  console.log(`   Total Documents: ${stats.total}`);
  console.log(`   Total Words: ${stats.totalWords?.toLocaleString()}`);
  console.log(`   Average Age: ${stats.avgAge} days\n`);
  
  console.log('📂 By Category:');
  for (const [cat, count] of Object.entries(stats.byCategory || {})) {
    console.log(`   ${cat}: ${count}`);
  }
  console.log('');
  
  console.log('📈 By Status:');
  for (const [status, count] of Object.entries(stats.byStatus || {})) {
    console.log(`   ${status}: ${count}`);
  }
  console.log('');
  
  // Archive old docs
  if (archive) {
    console.log('📦 Archive Preview (90+ days old):');
    const toArchive = await manager.archiveOld(90, !execute);
    
    if (toArchive.length === 0) {
      console.log('   No documents to archive.\n');
    } else {
      toArchive.forEach(doc => {
        console.log(`   ${execute ? '✅ Archived:' : '→'} ${doc.title} (${doc.ageInDays} days old)`);
      });
      console.log(`\n   ${execute ? 'Archived' : 'Would archive'} ${toArchive.length} documents.\n`);
    }
  }
  
  // Auto-organize
  if (!archive) {
    console.log('🔄 Auto-Organize Preview:');
    const moves = await manager.autoOrganize(!execute);
    
    if (moves.length === 0) {
      console.log('   ✅ All documents are already organized!\n');
    } else {
      moves.forEach(move => {
        console.log(`   ${execute ? '✅ Moved:' : '→'} ${move.from}`);
        console.log(`      → ${move.to}`);
        console.log(`      (${move.reason})\n`);
      });
      console.log(`   ${execute ? 'Moved' : 'Would move'} ${moves.length} files.\n`);
    }
  }
  
  // Generate index
  if (generateIndex) {
    console.log('📝 Generating INDEX.md...');
    const markdown = await manager.generateIndexMarkdown();
    console.log('   ✅ INDEX.md generated successfully!\n');
    console.log('   Preview:');
    console.log('   ' + markdown.split('\n').slice(0, 10).join('\n   '));
    console.log('   ...\n');
  }
  
  // Final message
  if (!execute && (moves?.length > 0 || archive)) {
    console.log('💡 This was a preview (dry run).');
    console.log('   Run with --execute to actually move files.\n');
  }
  
  console.log('✅ Done!');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
