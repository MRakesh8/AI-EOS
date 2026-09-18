import { LocalToolResult, ToolProfile } from '../types';
import { CommandSafetyClassifier } from './CommandSafetyClassifier';

export class LocalToolBridge {
  private static instance: LocalToolBridge;

  private constructor() {}

  public static getInstance(): LocalToolBridge {
    if (!LocalToolBridge.instance) {
      LocalToolBridge.instance = new LocalToolBridge();
    }
    return LocalToolBridge.instance;
  }

  public async executeTool(
    tool: ToolProfile,
    args: string[] = [],
    workingDir: string = process.cwd(),
    timeoutMs: number = 60000
  ): Promise<LocalToolResult> {
    const fullCmd = `${tool.command} ${args.join(' ')}`.trim();
    const safety = CommandSafetyClassifier.getInstance().classifyCommand(fullCmd);

    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    if (safety === 'BLOCKED') {
      const completedAt = new Date().toISOString();
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: `Command BLOCKED by safety policy: ${fullCmd}`,
        durationMs: Date.now() - startTime,
        timedOut: false,
        startedAt,
        completedAt,
        commandExecuted: fullCmd
      };
    }

    try {
      const childProcess = await import('child_process');
      const { exec } = childProcess;

      return await new Promise<LocalToolResult>((resolve) => {
        let timedOut = false;
        const timer = setTimeout(() => {
          timedOut = true;
        }, timeoutMs);

        exec(fullCmd, { cwd: workingDir, timeout: timeoutMs }, (error, stdout, stderr) => {
          clearTimeout(timer);
          const endTime = Date.now();
          const completedAt = new Date().toISOString();
          const exitCode = error ? (error.code ?? 1) : 0;

          resolve({
            success: !error && !timedOut,
            exitCode: typeof exitCode === 'number' ? exitCode : 1,
            stdout: stdout ? stdout.toString() : '',
            stderr: stderr ? stderr.toString() : (error ? error.message : ''),
            durationMs: endTime - startTime,
            timedOut,
            startedAt,
            completedAt,
            commandExecuted: fullCmd
          });
        });
      });
    } catch (err: any) {
      const completedAt = new Date().toISOString();
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: err?.message || 'Failed to execute child process',
        durationMs: Date.now() - startTime,
        timedOut: false,
        startedAt,
        completedAt,
        commandExecuted: fullCmd
      };
    }
  }
}
