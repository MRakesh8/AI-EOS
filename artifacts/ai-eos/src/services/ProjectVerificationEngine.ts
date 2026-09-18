import {
  TaskVerifier,
  VerificationResult,
  Task,
  StructuredErrorFeedback,
  ProjectType
} from '../types';
import { WebVerificationAdapter } from './verification/WebVerificationAdapter';
import { BackendVerificationAdapter } from './verification/BackendVerificationAdapter';
import { AndroidVerificationAdapter } from './verification/AndroidVerificationAdapter';
import { DesktopVerificationAdapter } from './verification/DesktopVerificationAdapter';

export class ProjectVerificationEngine implements TaskVerifier {
  private static instance: ProjectVerificationEngine;
  private lastFeedback: StructuredErrorFeedback | null = null;

  private constructor() {}

  public static getInstance(): ProjectVerificationEngine {
    if (!ProjectVerificationEngine.instance) {
      ProjectVerificationEngine.instance = new ProjectVerificationEngine();
    }
    return ProjectVerificationEngine.instance;
  }

  public async verifyTask(task: Task, projectPath: string = process.cwd(), projectType: ProjectType = 'Web'): Promise<VerificationResult> {
    let runRes: { result: VerificationResult; commandExecuted: string; stdout: string; stderr: string; exitCode: number | null };

    if (projectType === 'Android') {
      runRes = await AndroidVerificationAdapter.getInstance().verify(task, projectPath);
    } else if (projectType === 'Backend') {
      runRes = await BackendVerificationAdapter.getInstance().verify(task, projectPath);
    } else if (projectType === 'Full Stack' || projectType === 'Other') {
      runRes = await DesktopVerificationAdapter.getInstance().verify(task, projectPath);
    } else {
      runRes = await WebVerificationAdapter.getInstance().verify(task, projectPath);
    }

    if (!runRes.result.passed) {
      this.lastFeedback = {
        taskId: task.id,
        requirementTitle: task.title || task.name,
        failedCriteria: runRes.result.failedCriteria,
        commandExecuted: runRes.commandExecuted,
        exitCode: runRes.exitCode,
        stderr: runRes.stderr,
        stdoutSummary: runRes.stdout.slice(-500),
        affectedFiles: [],
        workspaceDiffSummary: `Diff on failed step for task ${task.id}`,
        likelyFailureArea: runRes.result.errors[0] || 'Build/Test command failure',
        nextRecommendedAction: runRes.result.nextActions[0] || 'Inspect compilation errors and resolve',
        createdAt: new Date().toISOString()
      };
    } else {
      this.lastFeedback = null;
    }

    return runRes.result;
  }

  public getLastStructuredErrorFeedback(): StructuredErrorFeedback | null {
    return this.lastFeedback;
  }
}
