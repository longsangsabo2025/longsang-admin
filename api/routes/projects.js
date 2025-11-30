const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Project configurations
const PROJECTS = {
  'portfolio': {
    name: 'LongSang Portfolio',
    batFile: 'START_PORTFOLIO.bat',
    port: 5000,
    path: path.join(__dirname, '..', '..', '01-MAIN-PRODUCTS', 'longsang-portfolio')
  },
  'ainewbie': {
    name: 'AI Newbie Web',
    batFile: 'START_AINEWBIE.bat',
    port: 5174,
    path: path.join(__dirname, '..', '..', '01-MAIN-PRODUCTS', 'ainewbie-web')
  },
  'secretary': {
    name: 'AI Secretary',
    batFile: 'START_AI_SECRETARY.bat',
    port: 5173,
    path: path.join(__dirname, '..', '..', '01-MAIN-PRODUCTS', 'ai_secretary')
  },
  'vungtau': {
    name: 'Vung Tau Dream Homes',
    batFile: 'START_VUNGTAU.bat',
    port: 5175,
    path: path.join(__dirname, '..', '..', '01-MAIN-PRODUCTS', 'vungtau-dream-homes')
  }
};

// Start a project
router.post('/start/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const project = PROJECTS[projectId];

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  try {
    const batPath = path.join(__dirname, '..', project.batFile);
    
    // Spawn bat file process
    const child = spawn('cmd.exe', ['/c', batPath], {
      detached: true,
      stdio: 'ignore',
      cwd: path.dirname(batPath)
    });

    child.unref(); // Allow parent to exit independently

    res.json({
      success: true,
      project: project.name,
      port: project.port,
      message: `Starting ${project.name} on port ${project.port}...`,
      url: `http://localhost:${project.port}`
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to start project',
      message: error.message
    });
  }
});

// Check if a project is running
router.get('/status/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const project = PROJECTS[projectId];

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  try {
    const net = require('net');
    const server = net.createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Port is in use - project is running
        res.json({
          running: true,
          project: project.name,
          port: project.port,
          url: `http://localhost:${project.port}`
        });
      } else {
        res.status(500).json({ error: err.message });
      }
    });

    server.once('listening', () => {
      // Port is available - project is NOT running
      server.close();
      res.json({
        running: false,
        project: project.name,
        port: project.port
      });
    });

    server.listen(project.port, '127.0.0.1');
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check status',
      message: error.message
    });
  }
});

// Get all projects
router.get('/list', (req, res) => {
  res.json({
    projects: Object.entries(PROJECTS).map(([id, project]) => ({
      id,
      name: project.name,
      port: project.port,
      batFile: project.batFile
    }))
  });
});

// GET /api/projects - Get projects from database
router.get('/', async (req, res) => {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name, slug, status, description, icon, color, local_url, production_url, github_url, tagline, tech_stack, priority, is_active')
      .order('priority', { ascending: true, nullsFirst: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      projects: projects || [],
      count: projects?.length || 0
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      projects: []
    });
  }
});

module.exports = router;
