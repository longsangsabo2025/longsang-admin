// ================================================
// ENVIRONMENT VARIABLES API ENDPOINTS
// ================================================
// For centralized environment variable management

const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Define project paths for environment files
const PROJECT_PATHS = {
  'admin': path.join(__dirname, '../../'),
  'ainewbie': path.join(__dirname, '../../../01-MAIN-PRODUCTS/ainewbie-web'),
  'vungtau': path.join(__dirname, '../../../01-MAIN-PRODUCTS/vungtau-dream-homes'),
  'secretary': path.join(__dirname, '../../../01-MAIN-PRODUCTS/ai_secretary'),
  'portfolio': path.join(__dirname, '../../../01-MAIN-PRODUCTS/longsang-portfolio')
};

// Helper function to parse .env file
function parseEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return {};
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const vars = {};
    
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key) {
          vars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
    
    return vars;
  } catch (error) {
    console.error(`Error parsing .env file ${filePath}:`, error);
    return {};
  }
}

// Helper function to write .env file
function writeEnvFile(filePath, vars) {
  try {
    const content = Object.entries(vars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing .env file ${filePath}:`, error);
    return false;
  }
}

// GET /api/env/list - Load environment variables from system
router.get('/list', (req, res) => {
  try {
    const allVars = {};
    
    // Load from each project's .env file
    Object.entries(PROJECT_PATHS).forEach(([projectName, projectPath]) => {
      const envPath = path.join(projectPath, '.env');
      const envLocalPath = path.join(projectPath, '.env.local');
      
      // Load .env
      const envVars = parseEnvFile(envPath);
      Object.entries(envVars).forEach(([key, value]) => {
        allVars[`${projectName.toUpperCase()}_${key}`] = value;
      });
      
      // Load .env.local (higher priority)
      const localVars = parseEnvFile(envLocalPath);
      Object.entries(localVars).forEach(([key, value]) => {
        allVars[`${projectName.toUpperCase()}_${key}`] = value;
      });
    });
    
    // Also load system environment variables (common ones)
    const systemVars = [
      'NODE_ENV', 'PORT', 'DATABASE_URL', 'OPENAI_API_KEY',
      'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
      'RESEND_API_KEY', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET',
      'WEBHOOK_URL', 'API_BASE_URL'
    ];
    
    systemVars.forEach(varName => {
      if (process.env[varName]) {
        allVars[varName] = process.env[varName];
      }
    });
    
    res.json(allVars);
  } catch (error) {
    console.error('Error loading environment variables:', error);
    res.status(500).json({ error: 'Failed to load environment variables' });
  }
});

// POST /api/env/deploy - Deploy environment variables to projects
router.post('/deploy', (req, res) => {
  try {
    const { variables } = req.body;
    
    if (!variables || typeof variables !== 'object') {
      return res.status(400).json({ error: 'Invalid variables format' });
    }
    
    const results = {};
    
    // Group variables by project prefix
    const projectVars = {};
    const globalVars = {};
    
    Object.entries(variables).forEach(([key, value]) => {
      const upperKey = key.toUpperCase();
      let projectFound = false;
      
      Object.keys(PROJECT_PATHS).forEach(projectName => {
        if (upperKey.startsWith(`${projectName.toUpperCase()}_`)) {
          if (!projectVars[projectName]) projectVars[projectName] = {};
          projectVars[projectName][key.substring(projectName.length + 1)] = value;
          projectFound = true;
        }
      });
      
      if (!projectFound) {
        globalVars[key] = value;
      }
    });
    
    // Deploy to each project
    Object.entries(PROJECT_PATHS).forEach(([projectName, projectPath]) => {
      try {
        const envPath = path.join(projectPath, '.env.local');
        
        // Start with global variables
        const projectEnvVars = { ...globalVars };
        
        // Add project-specific variables
        if (projectVars[projectName]) {
          Object.assign(projectEnvVars, projectVars[projectName]);
        }
        
        // Write to .env.local file
        if (Object.keys(projectEnvVars).length > 0) {
          const success = writeEnvFile(envPath, projectEnvVars);
          results[projectName] = success ? 'deployed' : 'failed';
        } else {
          results[projectName] = 'skipped';
        }
      } catch (error) {
        console.error(`Error deploying to ${projectName}:`, error);
        results[projectName] = 'error';
      }
    });
    
    res.json({ 
      message: 'Environment variables deployment completed',
      results,
      deployed: Object.keys(variables).length
    });
  } catch (error) {
    console.error('Error deploying environment variables:', error);
    res.status(500).json({ error: 'Failed to deploy environment variables' });
  }
});

// GET /api/env/status - Get deployment status of environment variables
router.get('/status', (req, res) => {
  try {
    const status = {};
    
    Object.entries(PROJECT_PATHS).forEach(([projectName, projectPath]) => {
      const envPath = path.join(projectPath, '.env');
      const envLocalPath = path.join(projectPath, '.env.local');
      
      status[projectName] = {
        hasEnv: fs.existsSync(envPath),
        hasEnvLocal: fs.existsSync(envLocalPath),
        envCount: Object.keys(parseEnvFile(envPath)).length,
        envLocalCount: Object.keys(parseEnvFile(envLocalPath)).length,
        lastModified: {
          env: fs.existsSync(envPath) ? fs.statSync(envPath).mtime : null,
          envLocal: fs.existsSync(envLocalPath) ? fs.statSync(envLocalPath).mtime : null
        }
      };
    });
    
    res.json(status);
  } catch (error) {
    console.error('Error getting environment status:', error);
    res.status(500).json({ error: 'Failed to get environment status' });
  }
});

// DELETE /api/env/clear/:project - Clear environment variables for a specific project
router.delete('/clear/:project', (req, res) => {
  try {
    const { project } = req.params;
    
    if (!PROJECT_PATHS[project]) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const envLocalPath = path.join(PROJECT_PATHS[project], '.env.local');
    
    if (fs.existsSync(envLocalPath)) {
      fs.unlinkSync(envLocalPath);
    }
    
    res.json({ message: `Environment variables cleared for ${project}` });
  } catch (error) {
    console.error(`Error clearing environment for ${req.params.project}:`, error);
    res.status(500).json({ error: 'Failed to clear environment variables' });
  }
});

module.exports = router;