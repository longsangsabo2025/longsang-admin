/**
 * GPU Services Manager
 * 
 * Auto-start/stop TTS (VoxCPM) and ComfyUI servers for the pipeline.
 * Tracks spawned processes and cleans up on exit.
 * 
 * Usage:
 *   import { startAll, stopAll } from './utils/gpu-services.js';
 *   await startAll();   // before pipeline
 *   await stopAll();    // after pipeline (also called on process exit)
 */
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

// ── Configuration (all env-overridable) ─────────────────────────────────

const TTS_PYTHON = process.env.VOXCPM_PYTHON
  || 'D:/0.PROJECTS/00-MASTER-ADMIN/voxcpm-tts/.venv/Scripts/python.exe';
const TTS_SCRIPT = process.env.VOXCPM_SCRIPT
  || 'D:/0.PROJECTS/00-MASTER-ADMIN/voxcpm-tts/server.py';
const TTS_CWD = process.env.VOXCPM_CWD
  || 'D:/0.PROJECTS/00-MASTER-ADMIN/voxcpm-tts';
const TTS_PORT = process.env.VOXCPM_PORT || '8100';
const TTS_URL = process.env.VOXCPM_API_URL || `http://localhost:${TTS_PORT}`;

const COMFYUI_DIR = process.env.COMFYUI_DIR || 'D:/Private_AI_Workspace/ComfyUI';
const COMFYUI_PYTHON = join(COMFYUI_DIR, 'venv/Scripts/python.exe').replace(/\\/g, '/');
const COMFYUI_MAIN = join(COMFYUI_DIR, 'main.py').replace(/\\/g, '/');
const COMFYUI_PORT = process.env.COMFYUI_PORT || '8188';
const COMFYUI_URL = process.env.COMFYUI_URL || `http://127.0.0.1:${COMFYUI_PORT}`;

export { TTS_PYTHON };

const tracked = { tts: null, comfyui: null };

// ── Health-check primitives ─────────────────────────────────────────────

async function isUp(url, endpoint, timeoutMs = 3000) {
  try {
    const res = await fetch(`${url}${endpoint}`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function pollReady(url, endpoint, maxWaitMs, label, intervalMs = 2000) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxWaitMs) {
    if (await isUp(url, endpoint)) {
      log(`✅ ${label} ready (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
      return true;
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  log(`⚠️  ${label} not ready after ${(maxWaitMs / 1000).toFixed(0)}s`);
  return false;
}

// ── Start individual services ───────────────────────────────────────────

export async function startTTS() {
  if (await isUp(TTS_URL, '/v1/health')) {
    log('TTS already running');
    return true;
  }

  if (!existsSync(TTS_PYTHON)) {
    log(`⚠️  TTS Python not found: ${TTS_PYTHON}`);
    return false;
  }

  log('Starting TTS (VoxCPM)...');
  const args = [TTS_SCRIPT, '--port', TTS_PORT];

  if (process.env.VOXCPM_VOICE_REF) {
    args.push('--voice_ref', process.env.VOXCPM_VOICE_REF);
    if (process.env.VOXCPM_VOICE_REF_TEXT) {
      args.push('--voice_ref_text', process.env.VOXCPM_VOICE_REF_TEXT);
    }
  }

  const child = spawn(TTS_PYTHON, args, {
    cwd: TTS_CWD,
    stdio: 'ignore',
    detached: true,
    env: { ...process.env, PYTORCH_CUDA_ALLOC_CONF: 'max_split_size_mb:512' },
  });
  child.unref();
  tracked.tts = child;

  // Model loading + optional voice-ref transcription takes 30–90s
  return pollReady(TTS_URL, '/v1/health', 120_000, 'TTS (VoxCPM)');
}

export async function startComfyUI() {
  if (await isUp(COMFYUI_URL, '/system_stats')) {
    log('ComfyUI already running');
    return true;
  }

  if (!existsSync(COMFYUI_PYTHON)) {
    log(`⚠️  ComfyUI venv not found: ${COMFYUI_PYTHON}`);
    return false;
  }

  log('Starting ComfyUI...');
  const child = spawn(COMFYUI_PYTHON, [
    COMFYUI_MAIN,
    '--highvram', '--fast', '--fp16-vae',
    '--listen', '127.0.0.1', '--port', COMFYUI_PORT,
  ], {
    cwd: COMFYUI_DIR,
    stdio: 'ignore',
    detached: true,
    env: { ...process.env, PYTORCH_CUDA_ALLOC_CONF: 'max_split_size_mb:512' },
  });
  child.unref();
  tracked.comfyui = child;

  return pollReady(COMFYUI_URL, '/system_stats', 90_000, 'ComfyUI');
}

// ── Orchestration ───────────────────────────────────────────────────────

export async function startAll() {
  log('══════════════════════════════════════');
  log('Starting GPU services...');
  log('══════════════════════════════════════');

  // Start both in parallel — they use different GPU memory pools initially
  const [tts, comfyui] = await Promise.all([startTTS(), startComfyUI()]);

  log(`Services: TTS=${tts ? '✅' : '❌'}  ComfyUI=${comfyui ? '✅' : '❌'}`);
  return { tts, comfyui };
}

function killTree(child, label) {
  if (!child || child.killed) return;
  try {
    if (process.platform === 'win32') {
      // /T kills the entire process tree, /F forces termination
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
      });
    } else {
      process.kill(-child.pid, 'SIGTERM');
    }
    log(`Stopped ${label} (pid ${child.pid})`);
  } catch {
    // Process already exited — safe to ignore
  }
}

export async function stopAll() {
  log('══════════════════════════════════════');
  log('Stopping GPU services...');
  log('══════════════════════════════════════');
  killTree(tracked.tts, 'TTS');
  killTree(tracked.comfyui, 'ComfyUI');
  tracked.tts = null;
  tracked.comfyui = null;
}

// ── Auto-cleanup on unexpected exit ─────────────────────────────────────

function cleanup() {
  killTree(tracked.tts, 'TTS');
  killTree(tracked.comfyui, 'ComfyUI');
}

process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(0); });
process.on('SIGTERM', () => { cleanup(); process.exit(0); });

// ── Logging ─────────────────────────────────────────────────────────────

function log(msg) {
  console.log(`[GPU Services] ${msg}`);
}
