import { spawn, execSync } from 'child_process';
import http from 'http';
import path from 'path';
import fileURLToPath from 'url';

const nodeExe = process.execPath;
const projectDir = path.resolve(import.meta.dirname, '..');
const tscBin = path.join(projectDir, '../../node_modules/typescript/bin/tsc');
const viteBin = path.join(projectDir, 'node_modules/vite/bin/vite.js');
const electronBin = path.join(projectDir, '../../node_modules/electron/cli.js');

console.log('[AI-EOS] Compiling Electron main and preload scripts...');
try {
  execSync(`"${nodeExe}" "${tscBin}" -p tsconfig.electron.json`, { cwd: projectDir, stdio: 'inherit' });
} catch (e) {
  console.error('[AI-EOS] Electron TypeScript compilation failed:', e);
  process.exit(1);
}

function checkPort(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(true);
    });
    req.on('error', () => {
      resolve(false);
    });
    req.end();
  });
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const isUp = await checkPort(url);
    if (isUp) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function main() {
  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';
  let viteProcess = null;

  const serverAlreadyRunning = await checkPort(devUrl);
  if (serverAlreadyRunning) {
    console.log(`[AI-EOS] Vite dev server already active at ${devUrl}`);
  } else {
    console.log('[AI-EOS] Starting Vite dev server...');
    viteProcess = spawn(nodeExe, [viteBin, '--config', 'vite.config.ts', '--host', '0.0.0.0'], {
      cwd: projectDir,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    });
  }

  console.log('[AI-EOS] Waiting for Vite server readiness...');
  const ready = await waitForServer(devUrl);
  if (!ready) {
    console.error('[AI-EOS] Timeout waiting for Vite server.');
    if (viteProcess) viteProcess.kill();
    process.exit(1);
  }

  console.log('[AI-EOS] Launching Electron desktop window...');
  const electronProcess = spawn(nodeExe, [electronBin, '.'], {
    cwd: projectDir,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development', VITE_DEV_SERVER_URL: devUrl }
  });

  electronProcess.on('close', (code) => {
    console.log(`[AI-EOS] Electron exited with code ${code}`);
    if (viteProcess) viteProcess.kill();
    process.exit(code || 0);
  });
}

main().catch((err) => {
  console.error('[AI-EOS] Error in dev runner:', err);
  process.exit(1);
});
