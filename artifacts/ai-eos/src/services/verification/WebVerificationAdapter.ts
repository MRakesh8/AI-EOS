import { VerificationResult, Task, ToolProfile } from '../../types';
import { LocalToolBridge } from '../LocalToolBridge';

export class WebVerificationAdapter {
  private static instance: WebVerificationAdapter;

  private constructor() {}

  public static getInstance(): WebVerificationAdapter {
    if (!WebVerificationAdapter.instance) {
      WebVerificationAdapter.instance = new WebVerificationAdapter();
    }
    return WebVerificationAdapter.instance;
  }

  public async verify(task: Task, projectPath: string): Promise<{ result: VerificationResult; commandExecuted: string; stdout: string; stderr: string; exitCode: number | null }> {
    const bridge = LocalToolBridge.getInstance();

    let pkgManager = 'npm';
    let availableScripts: Record<string, string> = {};

    try {
      const fs = await import('fs');
      const path = await import('path');
      const pkgPath = path.join(projectPath, 'package.json');

      if (fs.existsSync(pkgPath)) {
        const raw = fs.readFileSync(pkgPath, 'utf8');
        const parsed = JSON.parse(raw);
        availableScripts = parsed.scripts || {};
      }

      if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) pkgManager = 'pnpm';
      else if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) pkgManager = 'yarn';
      else if (fs.existsSync(path.join(projectPath, 'bun.lockb'))) pkgManager = 'bun';
    } catch (e) {}

    const toolProfile: ToolProfile = {
      id: `tool-${pkgManager}`,
      name: pkgManager.toUpperCase(),
      type: 'WEB_TOOL',
      executablePath: pkgManager,
      command: pkgManager,
      arguments: [],
      supportedProjectTypes: ['Web'],
      capabilities: ['Build', 'Testing'],
      enabled: true,
      status: 'Available',
      lastCheckedAt: new Date().toISOString(),
      version: null
    };

    const completedCriteria: string[] = [];
    const failedCriteria: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let commandExecuted = '';
    let stdout = '';
    let stderr = '';
    let exitCode: number | null = 0;

    if (availableScripts.typecheck) {
      commandExecuted = `${pkgManager} run typecheck`;
      const res = await bridge.executeTool(toolProfile, ['run', 'typecheck'], projectPath);
      stdout += res.stdout;
      stderr += res.stderr;
      exitCode = res.exitCode;
      if (res.success) {
        completedCriteria.push('TypeScript compilation (typecheck) passed');
      } else {
        failedCriteria.push('TypeScript compilation (typecheck) failed');
        errors.push(`Typecheck error: ${res.stderr.slice(0, 300)}`);
      }
    } else {
      warnings.push('Script "typecheck" Unavailable in package.json');
    }

    if (availableScripts.build) {
      commandExecuted = commandExecuted || `${pkgManager} run build`;
      const res = await bridge.executeTool(toolProfile, ['run', 'build'], projectPath);
      stdout += res.stdout;
      stderr += res.stderr;
      exitCode = res.exitCode;
      if (res.success) {
        completedCriteria.push('Production build passed');
      } else {
        failedCriteria.push('Production build failed');
        errors.push(`Build error: ${res.stderr.slice(0, 300)}`);
      }
    } else {
      warnings.push('Script "build" Unavailable in package.json');
    }

    if (availableScripts.test && !availableScripts.test.includes('no test specified')) {
      commandExecuted = commandExecuted || `${pkgManager} test`;
      const res = await bridge.executeTool(toolProfile, ['test'], projectPath);
      stdout += res.stdout;
      stderr += res.stderr;
      exitCode = res.exitCode;
      if (res.success) {
        completedCriteria.push('Unit test suite passed');
      } else {
        failedCriteria.push('Unit test suite failed');
        errors.push(`Test error: ${res.stderr.slice(0, 300)}`);
      }
    } else {
      warnings.push('Script "test" Unavailable or not configured in package.json');
    }

    const passed = failedCriteria.length === 0 && completedCriteria.length > 0;
    const totalCount = completedCriteria.length + failedCriteria.length;
    const completionPercentage = totalCount > 0 ? Math.round((completedCriteria.length / totalCount) * 100) : 0;

    return {
      result: {
        passed,
        completionPercentage,
        completedCriteria,
        failedCriteria,
        errors,
        warnings,
        nextActions: passed ? [] : ['Inspect build/test logs and resolve failing errors.']
      },
      commandExecuted,
      stdout,
      stderr,
      exitCode
    };
  }
}
