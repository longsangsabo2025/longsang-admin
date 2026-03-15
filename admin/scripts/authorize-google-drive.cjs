/**
 * Google Drive OAuth2 Authorization Script
 * 
 * This script helps you get a refresh token with Google Drive permissions.
 * Run this once to authorize, then add the refresh token to your .env file.
 */

const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const path = require('path');
const { exec } = require('child_process');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Import centralized config
const config = require('../api/config');

const CLIENT_ID = config.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = config.GOOGLE_CLIENT_SECRET;
const PORT = config.OAUTH_CALLBACK_PORT;

// Chuẩn hóa: Dùng OAUTH_CALLBACK_PORT từ config (mặc định 3333)
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

// Scopes needed for Google Drive
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.upload',
];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Missing YOUTUBE_CLIENT_ID or YOUTUBE_CLIENT_SECRET in .env');
  process.exit(1);
}

// Print config for reference
config.printConfig();

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Open URL in default browser
function openBrowser(url) {
  const cmd = process.platform === 'win32' ? 'start' :
              process.platform === 'darwin' ? 'open' : 'xdg-open';
  exec(`${cmd} "${url}"`);
}

async function authorize() {
  // Generate auth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('\n' + '='.repeat(70));
  console.log('🔐 GOOGLE DRIVE AUTHORIZATION');
  console.log('='.repeat(70));
  console.log(`\n🌐 Starting local server on port ${PORT}...`);
  console.log('📱 Opening browser for authorization...\n');

  return new Promise((resolve, reject) => {
    // Create local server to receive the callback
    const server = http.createServer(async (req, res) => {
      try {
        const queryParams = url.parse(req.url, true).query;
        
        if (req.url.includes('/oauth2callback') && queryParams.code) {
          console.log('✅ Authorization code received!');
          
          // Exchange code for tokens
          const { tokens } = await oauth2Client.getToken(queryParams.code);
          
          // Send success page to browser
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <!DOCTYPE html>
            <html>
            <head><title>Authorization Successful</title></head>
            <body style="font-family: Arial; padding: 50px; text-align: center; background: #f0f9ff;">
              <h1 style="color: #059669;">✅ Authorization Successful!</h1>
              <p style="font-size: 18px;">You can close this window now.</p>
              <p style="color: #666;">Check your terminal for the refresh token.</p>
            </body>
            </html>
          `);

          console.log('\n' + '='.repeat(70));
          console.log('🎉 SUCCESS! Add this to your .env file:');
          console.log('='.repeat(70));
          console.log(`\nGOOGLE_DRIVE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
          console.log('='.repeat(70));
          console.log('\n✅ Done! Restart the API server to use Google Drive.\n');
          
          server.close();
          resolve(tokens);
        } else if (queryParams.error) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`<h1>Error: ${queryParams.error}</h1>`);
          server.close();
          reject(new Error(queryParams.error));
        } else {
          res.writeHead(404);
          res.end('Not found');
        }
      } catch (err) {
        console.error('Error:', err.message);
        res.writeHead(500);
        res.end('Error during authorization');
        server.close();
        reject(err);
      }
    });

    server.listen(PORT, () => {
      console.log(`🌐 Waiting for authorization on http://localhost:${PORT}...`);
      console.log('\n📋 If browser does not open, visit this URL manually:\n');
      console.log(authUrl);
      console.log('\n' + '='.repeat(70));
      
      // Open browser automatically
      openBrowser(authUrl);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Kill the process and try again.`);
      }
      reject(err);
    });
  });
}

// Run
authorize()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Authorization failed:', err.message);
    process.exit(1);
  });
