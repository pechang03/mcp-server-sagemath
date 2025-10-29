import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { config } from '../config.js';

export interface SageRunResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  timedOut: boolean;
}

function getSageExecutable(): string {
  return (config.SagePath?.trim()) || (process.env.SAGE_PATH?.trim()) || 'sage';
}

async function runProcess(cmd: string, args: string[], timeoutMs: number): Promise<SageRunResult> {
  const start = Date.now();
  let stdout = '';
  let stderr = '';
  let timedOut = false;

  return new Promise<SageRunResult>((resolve) => {
    let child: ReturnType<typeof spawn> | undefined;
    try {
      child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err: any) {
      resolve({
        stdout: '',
        stderr: `Failed to spawn process: ${err?.message || String(err)}`,
        exitCode: null,
        durationMs: Date.now() - start,
        timedOut: false,
      });
      return;
    }

    const t = setTimeout(() => {
      timedOut = true;
      try { child?.kill('SIGKILL'); } catch {}
    }, Math.max(1, timeoutMs));

    // Handle asynchronous spawn errors (e.g., command not found)
    child.on('error', (err) => {
      clearTimeout(t);
      resolve({
        stdout: '',
        stderr: `Process error: ${err?.message || String(err)}`,
        exitCode: null,
        durationMs: Date.now() - start,
        timedOut,
      });
    });

    child.stdout?.on('data', (d) => { stdout += d.toString(); });
    child.stderr?.on('data', (d) => { stderr += d.toString(); });

    child.on('close', (code) => {
      clearTimeout(t);
      resolve({
        stdout,
        stderr,
        exitCode: code,
        durationMs: Date.now() - start,
        timedOut,
      });
    });
  });
}

export async function getSageVersion(timeoutMs = 5000): Promise<SageRunResult> {
  const sage = getSageExecutable();
  return runProcess(sage, ['--version'], timeoutMs);
}

export async function evaluateSage(code: string, timeoutMs = 10000): Promise<SageRunResult & { tmpDir?: string }> {
  const sage = getSageExecutable();
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-sage-'));
  const scriptPath = path.join(tmpRoot, 'script.sage');
  await fs.writeFile(scriptPath, code, 'utf8');

  const result = await runProcess(sage, [scriptPath], timeoutMs);

  // Attempt cleanup
  try { await fs.rm(tmpRoot, { recursive: true, force: true }); } catch {}

  return { ...result };
}