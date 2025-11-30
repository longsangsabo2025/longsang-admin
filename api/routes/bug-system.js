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
 * Trigger auto-fix system
 */
router.post('/auto-fix', async (req, res) => {
  try {
    const projectRoot = join(__dirname, '..', '..');
    const scriptPath = join(projectRoot, 'scripts', 'auto-fix-errors-from-db.mjs');

    // Run auto-fix script
    const { stdout, stderr } = await execAsync(`node "${scriptPath}"`, {
      cwd: projectRoot,
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    // Parse output to extract results
    const fixedMatch = stdout.match(/✅ Fixed: (\d+) errors/);
    const skippedMatch = stdout.match(/⏭️  Skipped: (\d+) errors/);

    const fixed = fixedMatch ? parseInt(fixedMatch[1], 10) : 0;
    const skipped = skippedMatch ? parseInt(skippedMatch[1], 10) : 0;

    res.json({
      success: true,
      fixed,
      skipped,
      output: stdout,
      errors: stderr || null,
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

module.exports = router;
