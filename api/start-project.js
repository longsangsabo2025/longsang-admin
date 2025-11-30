import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_PATHS = {
  'longsang-portfolio': 'D:\\0.PROJECTS\\01-MAIN-PRODUCTS\\longsang-portfolio',
  'ainewbie-web': 'D:\\0.PROJECTS\\01-MAIN-PRODUCTS\\ainewbie-web',
  'ai-secretary': 'D:\\0.PROJECTS\\01-MAIN-PRODUCTS\\ai_secretary',
  'vungtau-dream-homes': 'D:\\0.PROJECTS\\01-MAIN-PRODUCTS\\vungtau-dream-homes',
  'music-video-app': 'D:\\0.PROJECTS\\01-MAIN-PRODUCTS\\music-video-app',
};

const runningProcesses = new Map();

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { projectId, action } = req.body;

  if (!PROJECT_PATHS[projectId]) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const projectPath = PROJECT_PATHS[projectId];

  if (action === 'start') {
    // Check if already running
    if (runningProcesses.has(projectId)) {
      return res.json({ 
        status: 'already_running',
        message: 'Project is already running',
        pid: runningProcesses.get(projectId).pid
      });
    }

    // Start the dev server
    const child = spawn('npm', ['run', 'dev'], {
      cwd: projectPath,
      shell: true,
      detached: true,
      stdio: 'ignore'
    });

    child.unref();

    runningProcesses.set(projectId, {
      pid: child.pid,
      startedAt: new Date()
    });

    return res.json({
      status: 'started',
      message: `Starting ${projectId}...`,
      pid: child.pid
    });
  }

  if (action === 'stop') {
    const process = runningProcesses.get(projectId);
    if (!process) {
      return res.json({ status: 'not_running', message: 'Project is not running' });
    }

    try {
      // Kill the process tree
      spawn('taskkill', ['/pid', process.pid.toString(), '/T', '/F'], {
        shell: true
      });

      runningProcesses.delete(projectId);

      return res.json({
        status: 'stopped',
        message: `Stopped ${projectId}`
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (action === 'status') {
    const isRunning = runningProcesses.has(projectId);
    return res.json({
      status: isRunning ? 'running' : 'stopped',
      process: runningProcesses.get(projectId) || null
    });
  }

  return res.status(400).json({ error: 'Invalid action' });
}
