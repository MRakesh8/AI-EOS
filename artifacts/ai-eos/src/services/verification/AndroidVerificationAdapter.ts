import { VerificationResult, Task, ToolProfile } from '../../types';
import { LocalToolBridge } from '../LocalToolBridge';

export class AndroidVerificationAdapter {
  private static instance: AndroidVerificationAdapter;

  private constructor() {}

  public static getInstance(): AndroidVerificationAdapter {
    if (!AndroidVerificationAdapter.instance) {
      AndroidVerificationAdapter.instance = new AndroidVerificationAdapter();
    }
    return AndroidVerificationAdapter.instance;
  }

  public async verify(task: Task, projectPath: string): Promise<{ result: VerificationResult; commandExecuted: string; stdout: string; stderr: string; exitCode: number | null }> {
    const bridge = LocalToolBridge.getInstance();

    let gradleCmd = 'gradle';
    let isWrapper = false;

    try {
      const fs = await import('fs');
      const path = await import('path');
      const winWrapper = path.join(projectPath, 'gradlew.bat');
      const unixWrapper = path.join(projectPath, 'gradlew');

      if (fs.existsSync(winWrapper) || fs.existsSync(unixWrapper)) {
        gradleCmd = process.platform === 'win32' ? '.\\gradlew.bat' : './gradlew';
        isWrapper = true;
      }
    } catch (e) {}

    const toolProfile: ToolProfile = {
      id: 'tool-gradle-android',
      name: isWrapper ? 'Gradle Wrapper' : 'Global Gradle',
      type: 'ANDROID_TOOL',
      executablePath: gradleCmd,
      command: gradleCmd,
      arguments: [],
      supportedProjectTypes: ['Android'],
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

    const res = await bridge.executeTool(toolProfile, ['assembleDebug'], projectPath);
    if (res.success) {
      completedCriteria.push('Gradle APK build (assembleDebug) passed');
    } else {
      failedCriteria.push('Gradle APK build (assembleDebug) failed');
      errors.push(res.stderr.slice(0, 300));
    }

    const passed = failedCriteria.length === 0;

    return {
      result: {
        passed,
        completionPercentage: passed ? 100 : 0,
        completedCriteria,
        failedCriteria,
        errors,
        warnings,
        nextActions: passed ? [] : ['Inspect Android Gradle build errors']
      },
      commandExecuted: res.commandExecuted,
      stdout: res.stdout,
      stderr: res.stderr,
      exitCode: res.exitCode
    };
  }
}
