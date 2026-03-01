/**
 * PM2 Ecosystem Config — YouTube Agent Crew
 * 
 * Usage:
 *   pm2 start ecosystem.config.cjs
 *   pm2 restart youtube-crew
 *   pm2 logs youtube-crew
 *   pm2 monit
 */
module.exports = {
  apps: [
    {
      name: 'youtube-crew',
      script: 'src/server.js',
      cwd: __dirname,
      interpreter: 'node',
      node_args: '--experimental-modules',
      
      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 3099,
      },
      
      // Process management
      instances: 1,          // Single instance (stateful, in-memory runs)
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
      
      // Memory guard
      max_memory_restart: '1G',
      
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/youtube-crew-error.log',
      out_file: './logs/youtube-crew-out.log',
      merge_logs: true,
      log_type: 'json',
      
      // Graceful shutdown
      kill_timeout: 10000,
      listen_timeout: 8000,
      
      // Cron restart daily at 4 AM
      cron_restart: '0 4 * * *',
    },
  ],
};
