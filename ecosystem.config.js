/**
 * PM2 Ecosystem Configuration
 * 
 * Để sử dụng:
 * 1. Install PM2: npm install -g pm2
 * 2. Start: pm2 start ecosystem.config.js
 * 3. Monitor: pm2 monit
 * 4. Logs: pm2 logs longsang-api
 * 5. Restart: pm2 restart longsang-api
 * 6. Stop: pm2 stop longsang-api
 * 7. Auto-start on boot: pm2 startup && pm2 save
 */

module.exports = {
  apps: [
    {
      // =============================================
      // 🚀 MAIN API SERVER
      // =============================================
      name: 'longsang-api',
      script: './api/server.js',
      cwd: __dirname,
      
      // Instance configuration
      instances: 1,  // Use 'max' for cluster mode (all CPUs)
      exec_mode: 'fork',  // 'cluster' for load balancing
      
      // Auto-restart settings
      watch: false,  // Set true for development
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      
      // Memory management
      max_memory_restart: '500M',
      
      // Logging
      log_file: './logs/api-combined.log',
      out_file: './logs/api-out.log',
      error_file: './logs/api-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
        API_PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        API_PORT: 3001
      },
      
      // Health check
      listen_timeout: 8000,
      kill_timeout: 5000,
      
      // Graceful shutdown
      wait_ready: true,
      shutdown_with_message: true
    },
    
    {
      // =============================================
      // 🌐 VITE FRONTEND (Development only)
      // =============================================
      name: 'longsang-frontend',
      script: 'npm',
      args: 'run dev:frontend',
      cwd: __dirname,
      
      // Only run in development
      env: {
        NODE_ENV: 'development'
      },
      
      // Auto-restart
      autorestart: true,
      watch: false,
      
      // Logging
      log_file: './logs/frontend-combined.log',
      out_file: './logs/frontend-out.log',
      error_file: './logs/frontend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ],
  
  // Deploy configuration (for future VPS deployment)
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:longsang/longsang-admin.git',
      path: '/var/www/longsang-admin',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
