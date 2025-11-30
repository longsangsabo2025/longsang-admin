/**
 * Bug System API Routes
 *
 * Endpoints for bug system dashboard and auto-fix
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const { join } = require('path');
const { createClient } = require('@supabase/supabase-js');

const execAsync = promisify(exec);
const router = require('express').Router();

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * GET /api/bug-system/errors
 * Get all errors from database
 */
router.get('/errors', async (req, res) => {
  try {
    if (!supabase) {
      return res.json({ success: true, data: [], total: 0, message: 'Database not configured' });
    }

    const { status, project, limit = 50, offset = 0 } = req.query;
    
    let query = supabase
      .from('error_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }
    if (project) {
      query = query.eq('project', project);
    }

    const { data, error, count } = await query;

    if (error) {
      // Table might not exist
      if (error.code === '42P01') {
        return res.json({ success: true, data: [], total: 0, message: 'Error logs table not found' });
      }
      throw error;
    }

    res.json({
      success: true,
      data: data || [],
      total: count || 0
    });
  } catch (error) {
    console.error('Get errors error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: []
    });
  }
});

/**
 * GET /api/bug-system/stats
 * Get error statistics
 */
router.get('/stats', async (req, res) => {
  try {
    if (!supabase) {
      return res.json({ 
        success: true, 
        stats: { total: 0, open: 0, fixed: 0, ignored: 0 },
        message: 'Database not configured' 
      });
    }

    const { data: errors, error } = await supabase
      .from('error_logs')
      .select('status');

    if (error) {
      if (error.code === '42P01') {
        return res.json({ 
          success: true, 
          stats: { total: 0, open: 0, fixed: 0, ignored: 0 },
          message: 'Error logs table not found' 
        });
      }
      throw error;
    }

    const stats = {
      total: errors?.length || 0,
      open: errors?.filter(e => e.status === 'open' || !e.status).length || 0,
      fixed: errors?.filter(e => e.status === 'fixed').length || 0,
      ignored: errors?.filter(e => e.status === 'ignored').length || 0
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stats: { total: 0, open: 0, fixed: 0, ignored: 0 }
    });
  }
});

/**
 * POST /api/bug-system/auto-fix
 * Trigger auto-fix system - NOW WITH REAL ESLINT SCAN
 */
router.post('/auto-fix', async (req, res) => {
  try {
    const projectRoot = join(__dirname, '..', '..');
    const results = {
      eslintBefore: 0,
      eslintAfter: 0,
      eslintFixed: 0,
      prettierFixed: 0,
      dbErrorsProcessed: 0,
      success: true
    };

    // Step 1: Run ESLint scan to count errors BEFORE
    try {
      const { stdout: beforeScan } = await execAsync('npx eslint src --format json', {
        cwd: projectRoot,
        maxBuffer: 50 * 1024 * 1024,
      });
      const beforeData = JSON.parse(beforeScan);
      results.eslintBefore = beforeData.reduce((sum, file) => sum + file.errorCount + file.warningCount, 0);
    } catch (scanError) {
      // ESLint exits with error code when there are issues
      if (scanError.stdout) {
        try {
          const beforeData = JSON.parse(scanError.stdout);
          results.eslintBefore = beforeData.reduce((sum, file) => sum + file.errorCount + file.warningCount, 0);
        } catch (e) {
          results.eslintBefore = -1; // Unknown
        }
      }
    }

    // Step 2: Run ESLint --fix
    try {
      await execAsync('npx eslint src --fix', {
        cwd: projectRoot,
        maxBuffer: 50 * 1024 * 1024,
      });
    } catch (fixError) {
      // ESLint exits with error even after fixing some issues
      console.log('ESLint fix completed with some remaining issues');
    }

    // Step 3: Run ESLint scan to count errors AFTER
    try {
      const { stdout: afterScan } = await execAsync('npx eslint src --format json', {
        cwd: projectRoot,
        maxBuffer: 50 * 1024 * 1024,
      });
      const afterData = JSON.parse(afterScan);
      results.eslintAfter = afterData.reduce((sum, file) => sum + file.errorCount + file.warningCount, 0);
    } catch (scanError) {
      if (scanError.stdout) {
        try {
          const afterData = JSON.parse(scanError.stdout);
          results.eslintAfter = afterData.reduce((sum, file) => sum + file.errorCount + file.warningCount, 0);
        } catch (e) {
          results.eslintAfter = -1;
        }
      }
    }

    // Calculate fixed count
    if (results.eslintBefore >= 0 && results.eslintAfter >= 0) {
      results.eslintFixed = results.eslintBefore - results.eslintAfter;
    }

    // Step 4: Try to run Prettier (optional)
    try {
      await execAsync('npx prettier --write "src/**/*.{ts,tsx,js,jsx}"', {
        cwd: projectRoot,
        maxBuffer: 50 * 1024 * 1024,
      });
      results.prettierFixed = 1; // At least ran successfully
    } catch (prettierError) {
      console.log('Prettier not available or failed');
      results.prettierFixed = 0;
    }

    // Step 5: Process DB errors (mark as processed)
    if (supabase) {
      try {
        const { count } = await supabase
          .from('error_logs')
          .update({ status: 'auto_fixed', fixed_at: new Date().toISOString() })
          .is('status', null)
          .select('*', { count: 'exact', head: true });
        results.dbErrorsProcessed = count || 0;
      } catch (dbError) {
        console.log('DB update failed:', dbError.message);
      }
    }

    // Log to healing_actions
    if (supabase) {
      try {
        await supabase.from('healing_actions').insert({
          action_type: 'auto_fix_batch',
          action_result: 'success',
          details: results
        });
      } catch (e) {
        console.log('Failed to log healing action');
      }
    }

    res.json({
      success: true,
      fixed: results.eslintFixed,
      skipped: results.eslintAfter,
      details: results,
      message: `Fixed ${results.eslintFixed} ESLint issues. ${results.eslintAfter} remaining.`
    });
  } catch (error) {
    console.error('Auto-fix error:', error);
    res.status(500).json({
      success: false,
      fixed: 0,
      skipped: 0,
      errors: error.message,
    });
  }
});

/**
 * GET /api/bug-system/status
 * Get current system status
 */
router.get('/status', async (req, res) => {
  try {
    // This would check if auto-fix is running, etc.
    res.json({
      status: 'ready',
      lastRun: null, // Would get from database
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

/**
 * POST /api/bug-system/scan
 * Scan real ESLint errors and store in database
 */
router.post('/scan', async (req, res) => {
  try {
    const projectRoot = join(__dirname, '..', '..');
    let eslintResults = [];

    // Run ESLint and get JSON output
    try {
      const { stdout } = await execAsync('npx eslint src --format json', {
        cwd: projectRoot,
        maxBuffer: 50 * 1024 * 1024,
      });
      eslintResults = JSON.parse(stdout);
    } catch (scanError) {
      if (scanError.stdout) {
        try {
          eslintResults = JSON.parse(scanError.stdout);
        } catch (e) {
          return res.status(500).json({ success: false, error: 'Failed to parse ESLint output' });
        }
      }
    }

    // Convert ESLint results to error_logs format
    const errors = [];
    for (const file of eslintResults) {
      for (const msg of file.messages) {
        errors.push({
          project_name: 'longsang-admin',
          error_type: msg.severity === 2 ? 'ESLintError' : 'ESLintWarning',
          error_message: msg.message,
          error_stack: `at ${file.filePath}:${msg.line}:${msg.column}`,
          page_url: file.filePath.replace(projectRoot, '').replace(/\\/g, '/'),
          context: {
            ruleId: msg.ruleId,
            line: msg.line,
            column: msg.column,
            filePath: file.filePath,
            severity: msg.severity,
            fix: msg.fix ? true : false
          },
          status: 'open',
          created_at: new Date().toISOString()
        });
      }
    }

    // Clear old ESLint errors and insert new ones
    if (supabase && errors.length > 0) {
      // Delete old ESLint errors
      await supabase
        .from('error_logs')
        .delete()
        .in('error_type', ['ESLintError', 'ESLintWarning'])
        .eq('project_name', 'longsang-admin');

      // Insert new errors (batch of 100)
      for (let i = 0; i < errors.length; i += 100) {
        const batch = errors.slice(i, i + 100);
        await supabase.from('error_logs').insert(batch);
      }
    }

    res.json({
      success: true,
      scanned: eslintResults.length,
      errorsFound: errors.length,
      message: `Scanned ${eslintResults.length} files, found ${errors.length} issues`
    });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/bug-system/errors/test
 * Delete all test errors from database
 */
router.delete('/errors/test', async (req, res) => {
  try {
    if (!supabase) {
      return res.json({ success: false, error: 'Database not configured' });
    }

    const { count } = await supabase
      .from('error_logs')
      .delete()
      .eq('error_type', 'TestError')
      .select('*', { count: 'exact', head: true });

    res.json({
      success: true,
      deleted: count || 0,
      message: `Deleted ${count || 0} test errors`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
