/**
 * PM2 Ecosystem - FORK MODE (Simple & Stable)
 * 
 * Commands:
 *   npx pm2 start ecosystem.config.cjs
 *   npx pm2 status
 *   npx pm2 logs
 *   npx pm2 restart <name>
 *   npx pm2 stop all
 */

module.exports = {
  apps: [
    {
      name: 'gemini-image',
      script: 'server.js',
      cwd: './services/gemini-image',
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 5,
      restart_delay: 3000,
      env: { NODE_ENV: 'production', PORT: 3010 }
    },
    {
      name: 'veo-video',
      script: 'server.js',
      cwd: './services/veo-video',
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 5,
      restart_delay: 3000,
      env: { NODE_ENV: 'production', PORT: 3011 }
    },
    {
      name: 'brain-rag',
      script: 'server.js',
      cwd: './services/brain-rag',
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 5,
      restart_delay: 3000,
      env: { NODE_ENV: 'production', PORT: 3012 }
    },
    {
      name: 'ai-assistant',
      script: 'server.js',
      cwd: './services/ai-assistant',
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 5,
      restart_delay: 3000,
      env: { NODE_ENV: 'production', PORT: 3013 }
    },
    {
      name: 'mcp-server',
      script: '.venv/Scripts/python.exe',
      args: 'server.py',
      cwd: './mcp-server',
      interpreter: 'none',
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 3,
      restart_delay: 5000,
      env: { PORT: 3002 }
    },
    {
      name: 'api-gateway',
      script: 'server.js',
      cwd: './api',
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 5,
      restart_delay: 3000,
      env: { NODE_ENV: 'production', PORT: 3001 }
    },
    {
      name: 'n8n',
      script: 'n8n',
      interpreter: 'none',
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 3,
      restart_delay: 5000,
      env: { 
        N8N_PORT: 5678,
        N8N_PROTOCOL: 'http',
        N8N_HOST: 'localhost',
        GENERIC_TIMEZONE: 'Asia/Ho_Chi_Minh'
      }
    }
  ]
};
