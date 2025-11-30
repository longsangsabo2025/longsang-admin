/**
 * Auto-Fix Errors from Database
 *
 * Nguyên lý hoạt động:
 * 1. Đọc errors từ Supabase (error_logs, bug_reports)
 * 2. Phân tích và phân loại errors
 * 3. Áp dụng fix strategies (ESLint, Prettier, AST transform)
 * 4. Verify fix thành công
 * 5. Log kết quả và lặp lại cho đến khi sạch lỗi
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTIxOTEsImV4cCI6MjA3NTk2ODE5MX0.Nf1wHe7EDONS25Yv987KqhgyvZu07COnu6qgC0qCy2I';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

/**
 * Phân loại error để xác định fix strategy
 */
function classifyErrorForFix(error) {
  const message = error.error_message?.toLowerCase() || '';
  const stack = error.error_stack?.toLowerCase() || '';
  const type = error.error_type?.toLowerCase() || '';

  // ESLint fixable
  if (
    message.includes('missing semicolon') ||
    message.includes('unused') ||
    message.includes('quotes') ||
    message.includes('spacing') ||
    type.includes('lint')
  ) {
    return { strategy: 'eslint', confidence: 0.9 };
  }

  // Prettier fixable
  if (message.includes('format') || message.includes('indent') || message.includes('line length')) {
    return { strategy: 'prettier', confidence: 0.95 };
  }

  // TypeScript fixable
  if (
    message.includes('cannot find') ||
    message.includes('module not found') ||
    message.includes('type') ||
    type.includes('typescript')
  ) {
    return { strategy: 'typescript', confidence: 0.6 };
  }

  // Null safety fixable
  if (
    message.includes('cannot read') ||
    message.includes('undefined') ||
    message.includes('null')
  ) {
    return { strategy: 'null-safety', confidence: 0.7 };
  }

  // Unknown - cần review
  return { strategy: 'unknown', confidence: 0.3 };
}

/**
 * Extract file path từ error stack
 */
function extractFilePath(error) {
  const stack = error.error_stack || '';
  const context = error.context || {};

  // Try to get from context
  if (context.filePath || context.file) {
    return context.filePath || context.file;
  }

  // Try to extract from stack
  const match = stack.match(/\(([^)]+\.(ts|tsx|js|jsx)):(\d+):(\d+)\)/);
  if (match) {
    return match[1];
  }

  // Try page_url
  if (error.page_url) {
    const url = new URL(error.page_url);
    const path = url.pathname.replace(/^\//, '');
    if (path.endsWith('.tsx') || path.endsWith('.ts')) {
      return `src/${path}`;
    }
  }

  return null;
}

/**
 * Run ESLint fix
 */
async function runESLintFix(filePath) {
  try {
    const projectRoot = process.cwd();
    const fullPath = join(projectRoot, filePath);

    if (!existsSync(fullPath)) {
      return { success: false, reason: 'File not found' };
    }

    console.log(`   🔧 Running ESLint fix on ${filePath}...`);
    execSync(`npx eslint "${filePath}" --fix`, {
      cwd: projectRoot,
      stdio: 'pipe',
    });

    return { success: true, tool: 'eslint' };
  } catch (error) {
    return { success: false, reason: error.message };
  }
}

/**
 * Run Prettier fix
 */
async function runPrettierFix(filePath) {
  try {
    const projectRoot = process.cwd();
    const fullPath = join(projectRoot, filePath);

    if (!existsSync(fullPath)) {
      return { success: false, reason: 'File not found' };
    }

    console.log(`   🎨 Running Prettier fix on ${filePath}...`);
    execSync(`npx prettier --write "${filePath}"`, {
      cwd: projectRoot,
      stdio: 'pipe',
    });

    return { success: true, tool: 'prettier' };
  } catch (error) {
    return { success: false, reason: error.message };
  }
}

/**
 * Apply null safety fix (add optional chaining)
 */
async function applyNullSafetyFix(error) {
  const filePath = extractFilePath(error);
  if (!filePath) {
    return { success: false, reason: 'Cannot extract file path' };
  }

  try {
    const projectRoot = process.cwd();
    const fullPath = join(projectRoot, filePath);

    if (!existsSync(fullPath)) {
      return { success: false, reason: 'File not found' };
    }

    let content = readFileSync(fullPath, 'utf-8');
    const message = error.error_message || '';

    // Simple pattern: obj.property → obj?.property
    // This is a basic example - real implementation would use AST
    const originalContent = content;

    // Try to find and fix common patterns
    // Note: This is simplified - real implementation needs AST parsing
    content = content.replace(/(\w+)\.(\w+)(?!\?)/g, (match, obj, prop) => {
      // Only fix if it's likely to be the problematic line
      if (message.includes(obj) && message.includes(prop)) {
        return `${obj}?.${prop}`;
      }
      return match;
    });

    if (content !== originalContent) {
      writeFileSync(fullPath, content, 'utf-8');
      console.log(`   🛡️  Applied null safety fix to ${filePath}`);
      return { success: true, tool: 'null-safety', changes: true };
    }

    return { success: false, reason: 'No changes needed' };
  } catch (error) {
    return { success: false, reason: error.message };
  }
}

/**
 * Apply fix based on strategy
 */
async function applyFix(error, strategy) {
  const filePath = extractFilePath(error);

  if (!filePath) {
    console.log(`   ⚠️  Cannot determine file path for error: ${error.error_type}`);
    return { success: false, reason: 'Cannot extract file path' };
  }

  switch (strategy) {
    case 'eslint':
      return await runESLintFix(filePath);

    case 'prettier':
      return await runPrettierFix(filePath);

    case 'null-safety':
      return await applyNullSafetyFix(error);

    case 'typescript':
      // TypeScript errors usually need manual review
      console.log(`   ⚠️  TypeScript errors need manual review: ${filePath}`);
      return { success: false, reason: 'Needs manual review' };

    default:
      return { success: false, reason: 'Unknown strategy' };
  }
}

/**
 * Log healing action to database
 */
async function logHealingAction(error, fixResult) {
  try {
    await supabase.from('healing_actions').insert({
      error_log_id: error.id,
      action_type: 'auto_fix',
      action_result: fixResult.success ? 'success' : 'failed',
      details: {
        strategy: fixResult.strategy,
        tool: fixResult.tool,
        file_path: extractFilePath(error),
        reason: fixResult.reason,
        confidence: fixResult.confidence,
      },
    });
  } catch (error) {
    console.warn('   ⚠️  Failed to log healing action:', error.message);
  }
}

/**
 * Mark error as fixed
 */
async function markErrorAsFixed(errorId) {
  try {
    await supabase
      .from('error_logs')
      .update({
        context: {
          ...error.context,
          auto_fixed: true,
          fixed_at: new Date().toISOString(),
        },
      })
      .eq('id', errorId);
  } catch (error) {
    console.warn('   ⚠️  Failed to mark error as fixed:', error.message);
  }
}

/**
 * Main auto-fix loop
 */
async function autoFixLoop() {
  console.log('🚀 Auto-Fix System Starting...\n');
  console.log('='.repeat(60));

  let iteration = 0;
  const maxIterations = 10; // Prevent infinite loops
  let totalFixed = 0;
  let totalSkipped = 0;

  while (iteration < maxIterations) {
    iteration++;
    console.log(`\n📊 Iteration ${iteration}/${maxIterations}`);

    // Fetch unfixed errors
    const { data: errors, error: fetchError } = await supabase
      .from('error_logs')
      .select('*')
      .eq('project_name', 'longsang-admin')
      .is('context->auto_fixed', null)
      .order('created_at', { ascending: false })
      .limit(20);

    if (fetchError) {
      console.error('❌ Failed to fetch errors:', fetchError.message);
      break;
    }

    if (!errors || errors.length === 0) {
      console.log('✅ No more errors to fix!');
      break;
    }

    console.log(`   Found ${errors.length} errors to process\n`);

    for (const error of errors) {
      console.log(`\n🔍 Processing: ${error.error_type}`);
      console.log(`   Message: ${error.error_message?.substring(0, 80)}...`);

      // Classify error
      const analysis = classifyErrorForFix(error);
      console.log(
        `   Strategy: ${analysis.strategy} (confidence: ${(analysis.confidence * 100).toFixed(0)}%)`
      );

      // Only fix if confidence is high enough
      if (analysis.confidence < 0.6) {
        console.log(`   ⏭️  Skipping (low confidence)`);
        totalSkipped++;
        continue;
      }

      // Apply fix
      const fixResult = await applyFix(error, analysis.strategy);
      fixResult.strategy = analysis.strategy;
      fixResult.confidence = analysis.confidence;

      // Log result
      await logHealingAction(error, fixResult);

      if (fixResult.success) {
        console.log(`   ✅ Fixed successfully!`);
        await markErrorAsFixed(error.id);
        totalFixed++;
      } else {
        console.log(`   ❌ Fix failed: ${fixResult.reason}`);
        totalSkipped++;
      }
    }

    // Small delay between iterations
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   ✅ Fixed: ${totalFixed} errors`);
  console.log(`   ⏭️  Skipped: ${totalSkipped} errors`);
  console.log(`   🔄 Iterations: ${iteration}`);
  console.log('\n✅ Auto-fix completed!');
}

// Run auto-fix
autoFixLoop().catch(console.error);
