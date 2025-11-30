#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, '..', 'api', 'server.js');

process.chdir(path.join(__dirname, '..'));
process.env.PORT = '3001';

const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..')
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
});
