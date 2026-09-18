import { Task, Requirement, CommitPlan, VerificationResult } from '../types';

export class GitCommitPlanner {
  private static instance: GitCommitPlanner;

  private constructor() {}

  public static getInstance(): GitCommitPlanner {
    if (!GitCommitPlanner.instance) {
      GitCommitPlanner.instance = new GitCommitPlanner();
    }
    return GitCommitPlanner.instance;
  }

  public planCommit(
    task: Task,
    requirement: Requirement | null,
    changedFiles: string[],
    diffSummary: string,
    verification: VerificationResult | null
  ): CommitPlan | null {
    if (changedFiles.length === 0) {
      return null;
    }

    let type: CommitPlan['type'] = 'feat';
    const titleLower = (task.title || task.name || '').toLowerCase();

    if (titleLower.includes('fix') || titleLower.includes('bug') || titleLower.includes('error')) {
      type = 'fix';
    } else if (titleLower.includes('refactor') || titleLower.includes('clean')) {
      type = 'refactor';
    } else if (titleLower.includes('test') || titleLower.includes('coverage')) {
      type = 'test';
    } else if (titleLower.includes('perf') || titleLower.includes('speed')) {
      type = 'perf';
    } else if (titleLower.includes('doc') || titleLower.includes('readme')) {
      type = 'docs';
    }

    const scope = task.category ? task.category.toLowerCase().replace(/[^a-z0-9]/g, '') : 'task';
    const rawSubject = task.title || task.name || `complete task ${task.id}`;
    const subject = rawSubject.toLowerCase().replace(/^feat:|^fix:|^refactor:|^test:|^perf:|^docs:/i, '').trim();

    const verificationStatus = verification?.passed ? 'PASSED' : 'UNVERIFIED';
    const fullMessage = `${type}(${scope}): ${subject}\n\nTask: ${task.id}\nRequirement: ${requirement ? requirement.id : 'N/A'}\nVerification: ${verificationStatus}`;

    return {
      type,
      scope,
      subject,
      fullMessage,
      changedFiles,
      verificationStatus,
      diffSummary: diffSummary || `Changed ${changedFiles.length} file(s)`
    };
  }
}
