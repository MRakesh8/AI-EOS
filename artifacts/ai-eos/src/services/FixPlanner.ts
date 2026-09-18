import { RootCauseAnalysisReport, FixInstruction, Task } from '../types';

export class FixPlanner {
  private static instance: FixPlanner;

  private constructor() {}

  public static getInstance(): FixPlanner {
    if (!FixPlanner.instance) {
      FixPlanner.instance = new FixPlanner();
    }
    return FixPlanner.instance;
  }

  public createFixInstruction(task: Task, rca: RootCauseAnalysisReport): FixInstruction {
    const candidate = rca.topCandidate;

    return {
      taskId: task.id,
      problemSummary: rca.problem,
      rootCause: candidate?.cause || 'Unclassified error',
      affectedFiles: candidate?.affectedFiles || [],
      specificInstructions: [
        `Focus fix exclusively on root cause: ${candidate?.cause || 'Task failure'}`,
        `Investigate area: ${candidate?.recommendedInvestigation || 'Inspect workspace changes'}`,
        `Apply specific correction: ${candidate?.recommendedFix || 'Resolve reported error'}`
      ],
      constraints: [
        'Do NOT modify unrelated user files outside the task scope.',
        'Do NOT discard pre-existing user changes.',
        'Ensure all modified files maintain strict TypeScript type safety.'
      ],
      verificationSteps: rca.verificationRequired,
      createdAt: new Date().toISOString()
    };
  }
}
