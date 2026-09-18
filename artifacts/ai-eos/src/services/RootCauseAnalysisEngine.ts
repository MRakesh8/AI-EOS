import {
  RootCauseAnalysisReport,
  RootCauseCandidate,
  ConfidenceLevel,
  StructuredErrorFeedback,
  Task,
  ExecutionError,
  WorkspaceDiff
} from '../types';

export class RootCauseAnalysisEngine {
  private static instance: RootCauseAnalysisEngine;

  private constructor() {}

  public static getInstance(): RootCauseAnalysisEngine {
    if (!RootCauseAnalysisEngine.instance) {
      RootCauseAnalysisEngine.instance = new RootCauseAnalysisEngine();
    }
    return RootCauseAnalysisEngine.instance;
  }

  public analyzeFailure(
    task: Task,
    feedback: StructuredErrorFeedback | null,
    diff: WorkspaceDiff | null,
    errors: ExecutionError[] = []
  ): RootCauseAnalysisReport {
    const evidenceQuotes: string[] = [];
    const candidates: RootCauseCandidate[] = [];

    const stderr = feedback?.stderr || errors.map(e => e.message).join('\n') || '';
    const stdout = feedback?.stdoutSummary || '';

    if (stderr.length > 0) {
      evidenceQuotes.push(`Stderr snippet: ${stderr.slice(0, 300)}`);
    }
    if (stdout.length > 0) {
      evidenceQuotes.push(`Stdout snippet: ${stdout.slice(-300)}`);
    }
    if (feedback?.failedCriteria && feedback.failedCriteria.length > 0) {
      evidenceQuotes.push(`Failed criteria: ${feedback.failedCriteria.join(', ')}`);
    }

    // Candidate 1: TypeScript / Compilation Error
    if (stderr.includes('TS') || stderr.includes('SyntaxError') || stderr.includes('typecheck')) {
      candidates.push({
        cause: 'TypeScript compilation failure due to type mismatch or syntax error',
        evidence: stderr.slice(0, 200),
        confidence: 'HIGH',
        affectedFiles: feedback?.affectedFiles || diff?.modifiedFiles || [],
        recommendedInvestigation: 'Inspect modified TypeScript files and fix compiler type errors',
        recommendedFix: 'Correct interface definitions, imports, or type signatures'
      });
    }

    // Candidate 2: Test Suite Assertion Failure
    if (stderr.includes('AssertionError') || stderr.includes('FAIL') || (feedback?.failedCriteria.some(c => c.toLowerCase().includes('test')))) {
      candidates.push({
        cause: 'Unit or integration test assertion failure',
        evidence: stderr.includes('AssertionError') ? stderr.slice(0, 200) : (feedback?.failedCriteria.join('; ') || 'Test failed'),
        confidence: candidates.length === 0 ? 'HIGH' : 'MEDIUM',
        affectedFiles: feedback?.affectedFiles || diff?.modifiedFiles || [],
        recommendedInvestigation: 'Review failed test suite assertions and trace logic implementation',
        recommendedFix: 'Update function implementation or test assertion parameters to match specification'
      });
    }

    // Candidate 3: Build or Script Configuration Error
    if (stderr.includes('ENOENT') || stderr.includes('Cannot find module') || stderr.includes('command not found')) {
      candidates.push({
        cause: 'Missing dependency or invalid file/module path',
        evidence: stderr.slice(0, 200),
        confidence: 'HIGH',
        affectedFiles: feedback?.affectedFiles || [],
        recommendedInvestigation: 'Verify package.json dependencies, file path imports, and module resolution',
        recommendedFix: 'Install missing package or correct file import path'
      });
    }

    // Default Fallback Candidate if no specific pattern matched
    if (candidates.length === 0) {
      const summaryMsg = feedback?.nextRecommendedAction || 'Execution failed during task step';
      candidates.push({
        cause: `Unclassified execution failure: ${feedback?.likelyFailureArea || 'Command failure'}`,
        evidence: evidenceQuotes[0] || 'Execution step failed without explicit stack trace',
        confidence: 'LOW',
        affectedFiles: diff?.modifiedFiles || [],
        recommendedInvestigation: 'Inspect raw process logs and workspace changes',
        recommendedFix: summaryMsg
      });
    }

    const topCandidate = candidates.find(c => c.confidence === 'HIGH') || candidates[0] || null;

    return {
      taskId: task.id,
      problem: feedback?.failedCriteria[0] || topCandidate?.cause || 'Task verification failure',
      evidenceQuotes,
      candidates,
      topCandidate,
      verificationRequired: ['Run project typecheck', 'Run project test suite'],
      createdAt: new Date().toISOString()
    };
  }
}
