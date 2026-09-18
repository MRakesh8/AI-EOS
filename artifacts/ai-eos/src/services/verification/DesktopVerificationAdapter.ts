import { VerificationResult, Task, ToolProfile } from '../../types';
import { LocalToolBridge } from '../LocalToolBridge';

export class DesktopVerificationAdapter {
  private static instance: DesktopVerificationAdapter;

  private constructor() {}

  public static getInstance(): DesktopVerificationAdapter {
    if (!DesktopVerificationAdapter.instance) {
      DesktopVerificationAdapter.instance = new DesktopVerificationAdapter();
    }
    return DesktopVerificationAdapter.instance;
  }

  public async verify(task: Task, projectPath: string): Promise<{ result: VerificationResult; commandExecuted: string; stdout: string; stderr: string; exitCode: number | null }> {
    const bridge = LocalToolBridge.getInstance();

    const toolProfile: ToolProfile = {
      id: 'tool-npm-desktop',
      name: 'Electron Desktop',
      type: 'BUILD_TOOL',
      executablePath: 'npm',
      command: 'npm',
      arguments: [],
      supportedProjectTypes: ['Full Stack', 'Web'],
      capabilities: ['Build', 'Testing'],
      enabled: true,
      status: 'Available',
      lastCheckedAt: new Date().toISOString(),
      version: null
    };

    const res = await bridge.executeTool(toolProfile, ['run', 'build'], projectPath);
    const passed = res.success;

    return {
      result: {
        passed,
        completionPercentage: passed ? 100 : 0,
        completedCriteria: passed ? ['Electron app build passed'] : [],
        failedCriteria: passed ? [] : ['Electron app build failed'],
        errors: passed ? [] : [res.stderr.slice(0, 300)],
        warnings: [],
        nextActions: passed ? [] : ['Check Electron compilation logs']
      },
      commandExecuted: res.commandExecuted,
      stdout: res.stdout,
      stderr: res.stderr,
      exitCode: res.exitCode
    };
  }
}
