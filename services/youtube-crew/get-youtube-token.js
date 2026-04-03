#!/usr/bin/env node
/**
 * YouTube OAuth2 Token Generator
 * Opens browser → user authorizes → saves tokens to .env
 * 
 * Usage: node get-youtube-token.js
 */

import dotenv from 'dotenv';
import { google } from 'googleapis';
import http from 'http';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import open from 'open';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = join(__dirname, '.env');
dotenv.config({ path: ENV_PATH });
const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}/oauth/callback`;

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Missing YOUTUBE_CLIENT_ID or YOUTUBE_CLIENT_SECRET in .env');
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
];

const authUrl = oauth2.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent', // Force refresh token generation
});

// Start local server to catch the callback
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  if (url.pathname === '/oauth/callback') {
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h1>❌ Authorization denied</h1><p>${error}</p>`);
      server.close();
      process.exit(1);
    }

    try {
      const { tokens } = await oauth2.getToken(code);
      console.log('\n✅ Tokens received!');
      console.log(`   Access Token:  ${tokens.access_token?.substring(0, 30)}...`);
      console.log(`   Refresh Token: ${tokens.refresh_token?.substring(0, 30)}...`);
      console.log(`   Expires:       ${new Date(tokens.expiry_date).toLocaleString()}`);

      // Update .env file
      let envContent = readFileSync(ENV_PATH, 'utf8');
      
      if (tokens.access_token) {
        envContent = envContent.replace(
          /^YOUTUBE_ACCESS_TOKEN=.*/m,
          `YOUTUBE_ACCESS_TOKEN=${tokens.access_token}`
        );
      }
      
      if (tokens.refresh_token) {
        envContent = envContent.replace(
          /^YOUTUBE_REFRESH_TOKEN=.*/m,
          `YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`
        );
      }

      writeFileSync(ENV_PATH, envContent, 'utf8');
      console.log('\n✅ .env updated with new tokens!');

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#0a0a0a;color:#fff">
          <h1 style="color:#22c55e">✅ Authorization Successful!</h1>
          <p>Tokens saved to .env</p>
          <p style="color:#888">You can close this tab now.</p>
        </body></html>
      `);
    } catch (err) {
      console.error('❌ Token exchange failed:', err.message);
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h1>❌ Token exchange failed</h1><p>${err.message}</p>`);
    }

    setTimeout(() => { server.close(); process.exit(0); }, 1000);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`\n🔐 YouTube OAuth2 Token Generator`);
  console.log(`   Client ID: ${CLIENT_ID.substring(0, 20)}...`);
  console.log(`   Channel:   @dungdaydi26 (UC3VSZ1COs21KIarn4wsKRnQ)`);
  console.log(`   Callback:  ${REDIRECT_URI}`);
  console.log(`\n📌 Opening browser for authorization...`);
  console.log(`   If browser doesn't open, visit:\n   ${authUrl}\n`);
  
  open(authUrl).catch(() => {
    console.log('⚠️  Could not open browser automatically. Please visit the URL above.');
  });
});
