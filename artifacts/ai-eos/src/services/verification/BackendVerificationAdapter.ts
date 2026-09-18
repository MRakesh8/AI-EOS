import { VerificationResult, Task, ToolProfile } from '../../types';
import { LocalToolBridge } from '../LocalToolBridge';

export class BackendVerificationAdapter {
  private static instance: BackendVerificationAdapter;

  private constructor() {}

  public static getInstance(): BackendVerificationAdapter {
    if (!BackendVerificationAdapter.instance) {
      BackendVerificationAdapter.instance = new BackendVerificationAdapter();
    }
    return BackendVerificationAdapter.instance;
  }

  public async verify(task: Task, projectPath: string): Promise<{ result: VerificationResult; commandExecuted: string; stdout: string; stderr: string; exitCode: number | null }> {
    const bridge = LocalToolBridge.getInstance();

    const toolProfile: ToolProfile = {
      id: 'tool-node-backend',
      name: 'Node Backend',
      type: 'BUILD_TOOL',
      executablePath: 'npm',
      command: 'npm',
      arguments: [],
      supportedProjectTypes: ['Backend'],
      capabilities: ['Build', 'Testing'],
      enabled: true,
      status: 'Available',
      lastCheckedAt: new Date().toISOString(),
      version: null
    };

    const completedCriteria: string[] = [];
    const failedCriteria: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = ['Health verification unavailable (No safe health endpoint configured)'];

    const res = await bridge.executeTool(toolProfile, ['run', 'build'], projectPath);
    if (res.success) {
      completedCriteria.push('Backend build passed');
    } else {
      failedCriteria.push('Backend build failed');
      errors.push(res.stderr.slice(0, 300));
    }

    const passed = failedCriteria.length === 0;
    const completionPercentage = passed ? 100 : 0;

    return {
      result: {
        passed,
        completionPercentage,
        completedCriteria,
        failedCriteria,
        errors,
        warnings,
        nextActions: passed ? [] : ['Check backend compilation errors']
      },
      commandExecuted: res.commandExecuted,
      stdout: res.stdout,
      stderr: res.stderr,
      exitCode: res.exitCode
    };
  }
}
