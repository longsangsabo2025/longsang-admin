/**
 * Centralized Configuration
 * 
 * All ports and URLs are defined here to ensure consistency across the app.
 * DO NOT hardcode ports anywhere else - always import from this file!
 */

require('dotenv').config();

const config = {
  // ===========================================
  // SERVER PORTS (Chuẩn hóa - KHÔNG ĐỔI!)
  // ===========================================
  
  // Frontend Vite Dev Server
  VITE_PORT: parseInt(process.env.VITE_PORT || '8080', 10),
  
  // API Server (Express)
  API_PORT: parseInt(process.env.API_PORT || '3001', 10),
  
  // OAuth Callback Port (for authorization scripts)
  OAUTH_CALLBACK_PORT: parseInt(process.env.OAUTH_CALLBACK_PORT || '3333', 10),
  
  // ===========================================
  // URLs
  // ===========================================
  
  get API_URL() {
    return process.env.VITE_API_URL || `http://localhost:${this.API_PORT}`;
  },
  
  get FRONTEND_URL() {
    return `http://localhost:${this.VITE_PORT}`;
  },
  
  get OAUTH_REDIRECT_URI() {
    return `http://localhost:${this.OAUTH_CALLBACK_PORT}/oauth2callback`;
  },
  
  // ===========================================
  // Google OAuth
  // ===========================================
  
  GOOGLE_CLIENT_ID: process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_DRIVE_REFRESH_TOKEN || process.env.YOUTUBE_REFRESH_TOKEN,
  
  // ===========================================
  // Helper Methods
  // ===========================================
  
  getApiEndpoint(path) {
    return `${this.API_URL}${path.startsWith('/') ? path : '/' + path}`;
  },
  
  /**
   * Print current config for debugging
   */
  printConfig() {
    console.log('\n📋 Current Configuration:');
    console.log('='.repeat(50));
    console.log(`  Frontend (Vite):  http://localhost:${this.VITE_PORT}`);
    console.log(`  API Server:       http://localhost:${this.API_PORT}`);
    console.log(`  OAuth Callback:   http://localhost:${this.OAUTH_CALLBACK_PORT}`);
    console.log('='.repeat(50) + '\n');
  }
};

module.exports = config;
