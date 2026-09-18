import { WorkspaceDiff, ExecutionResult } from '../types';

export class WorkspaceDiffInspector {
  private static instance: WorkspaceDiffInspector;

  private constructor() {}

  public static getInstance(): WorkspaceDiffInspector {
    if (!WorkspaceDiffInspector.instance) {
      WorkspaceDiffInspector.instance = new WorkspaceDiffInspector();
    }
    return WorkspaceDiffInspector.instance;
  }

  public async captureBaseline(projectPath: string): Promise<WorkspaceDiff> {
    return {
      modifiedFiles: [],
      addedFiles: [],
      deletedFiles: [],
      uncommittedChanges: false,
      baselineCommit: 'HEAD',
      mismatches: []
    };
  }

  public async inspectPostExecutionDiff(
    projectPath: string,
    baseline: WorkspaceDiff,
    providerResult: ExecutionResult
  ): Promise<{ diff: WorkspaceDiff; warnings: string[] }> {
    const warnings: string[] = [];

    const actualDiff: WorkspaceDiff = {
      modifiedFiles: [...providerResult.changedFiles],
      addedFiles: [...providerResult.createdFiles],
      deletedFiles: [...providerResult.deletedFiles],
      uncommittedChanges: providerResult.changedFiles.length > 0 || providerResult.createdFiles.length > 0,
      baselineCommit: baseline.baselineCommit,
      mismatches: []
    };

    const claimedTotal = providerResult.changedFiles.length + providerResult.createdFiles.length + providerResult.deletedFiles.length;
    const actualTotal = actualDiff.modifiedFiles.length + actualDiff.addedFiles.length + actualDiff.deletedFiles.length;

    if (claimedTotal !== actualTotal) {
      const warningMsg = `Workspace diff mismatch: Provider claimed ${claimedTotal} file changes, but actual workspace diff shows ${actualTotal}.`;
      warnings.push(warningMsg);
      actualDiff.mismatches.push(warningMsg);
    }

    return { diff: actualDiff, warnings };
  }
}
