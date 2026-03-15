/**
 * 🚀 PM2 ECOSYSTEM CONFIG
 * 
 * Always-on services for Second Brain v3.0
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 status
 *   pm2 logs
 *   pm2 save     (persist across reboots)
 *   pm2 startup  (auto-start on boot)
 */

module.exports = {
  apps: [
    {
      name: 'brain-telegram-bot',
      script: '../api/integrations/telegram-brain-unified.js',
      cwd: __dirname + '/..',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/telegram-bot-error.log',
      out_file: './logs/telegram-bot-out.log',
      merge_logs: true,
    },
    {
      name: 'brain-morning-brief',
      script: '../api/cron/morning-brief-scheduler.js',
      cwd: __dirname + '/..',
      cron_restart: '0 7 * * *', // Restart at 7 AM daily (triggers the brief)
      watch: false,
      autorestart: false, // Runs once then exits
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/morning-brief-error.log',
      out_file: './logs/morning-brief-out.log',
    },
    {
      name: 'brain-weekly-digest',
      script: '../api/cron/weekly-digest-email.js',
      cwd: __dirname + '/..',
      cron_restart: '0 9 * * 0', // Sunday 9 AM
      watch: false,
      autorestart: false,
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/weekly-digest-error.log',
      out_file: './logs/weekly-digest-out.log',
    },
    {
      name: 'brain-weekly-distill',
      script: '../api/cron/weekly-core-logic-refresh.js',
      cwd: __dirname + '/..',
      cron_restart: '0 6 * * 0', // Sunday 6 AM (before digest)
      watch: false,
      autorestart: false,
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/weekly-distill-error.log',
      out_file: './logs/weekly-distill-out.log',
    },
    {
      name: 'brain-api-server',
      script: '../api/server.js',
      cwd: __dirname + '/..',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: './logs/api-server-error.log',
      out_file: './logs/api-server-out.log',
      merge_logs: true,
    },
  ],
};
