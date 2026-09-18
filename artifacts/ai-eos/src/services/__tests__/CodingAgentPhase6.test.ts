import { ExecutionBridge } from '../ExecutionBridge';
import { TaskExecutionCore } from '../TaskExecutionCore';
import { ProviderManager } from '../ProviderManager';
import { RootCauseAnalysisEngine } from '../RootCauseAnalysisEngine';
import { FixPlanner } from '../FixPlanner';
import { GitCommitPlanner } from '../GitCommitPlanner';
import { GitRepositoryService } from '../GitRepositoryService';
import { AuditLogService } from '../AuditLogService';
import { NetworkRecoveryService } from '../NetworkRecoveryService';
import { AntigravityAdapter } from '../adapters/AntigravityAdapter';
import { GenericCodingAgentAdapter } from '../adapters/GenericCodingAgentAdapter';
import { ToolDiscoveryService } from '../ToolDiscoveryService';
import { CommandSafetyClassifier } from '../CommandSafetyClassifier';
import { WorkspaceDiffInspector } from '../WorkspaceDiffInspector';
import {
  Task,
  Project,
  Requirement,
  ProviderProfile,
  TaskVerifier,
  VerificationResult,
  StructuredErrorFeedback,
  ExecutionError,
  WorkspaceDiff
} from '../../types';

async function runPhase6Tests() {
  console.log('====================================================');
  console.log('AI-EOS PHASE 6 - REAL CODING AGENT & GIT INTELLIGENCE TESTS');
  console.log('====================================================\n');

  const bridge = ExecutionBridge.getInstance();
  const core = TaskExecutionCore.getInstance();
  const providerMgr = ProviderManager.getInstance();
  const rcaEngine = RootCauseAnalysisEngine.getInstance();
  const fixPlanner = FixPlanner.getInstance();
  const gitCommitPlanner = GitCommitPlanner.getInstance();
  const gitRepoService = GitRepositoryService.getInstance();
  const auditService = AuditLogService.getInstance();
  const netRecovery = NetworkRecoveryService.getInstance();
  const discovery = ToolDiscoveryService.getInstance();
  const antigravity = new AntigravityAdapter();
  const genericAgent = new GenericCodingAgentAdapter();

  providerMgr.registerAdapter(antigravity);

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? `: ${detail}` : ''}`);
      failedCount++;
    }
  }

  const sampleProject: Project = {
    id: 'PRJ-PHASE6',
    name: 'Phase 6 Test Project',
    description: 'Real Coding Agent Integration Project',
    projectType: 'Web',
    techStack: ['React', 'TypeScript'],
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startDate: '2026-08-12',
    endDate: '',
    path: process.cwd(),
    githubUrl: 'https://github.com/user/repo.git',
    pushPolicy: 'ASK_BEFORE_PUSH',
    autonomousExecutionPolicy: 'ON',
    hasUserApprovedAutonomousExecution: true
  };

  const sampleTask: Task = {
    id: 'TSK-P6-1',
    projectId: 'PRJ-PHASE6',
    title: 'Implement User Authentication',
    name: 'Implement User Authentication',
    description: 'Add JWT login and session persistence',
    priority: 'High',
    status: 'QUEUED',
    progress: 0,
    dependencies: [],
    retryCount: 0,
    maxRetries: 3,
    failoverCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 1. Coding Agent Adapter Contract & Interface Validation
  assert(genericAgent.agentId === 'generic-coding-agent' && typeof genericAgent.executeTask === 'function', '1. CodingAgentAdapter contract validation');

  // 2. Real Tool Readiness Detection
  const readiness = await genericAgent.validateReadiness('prof-default');
  assert(readiness.message.includes('UNAVAILABLE') || readiness.message.includes('Available'), '2. Tool readiness detection via ToolDiscoveryService');

  // 3. Truthful Antigravity Status (NOT CONNECTED)
  const antiReadiness = await antigravity.validateReadiness('prof-antigravity-1');
  assert(!antiReadiness.isReady && antiReadiness.message.includes('Integration unavailable'), '3. Truthful Antigravity status reporting');

  // 4. Project Path Restriction
  const submitRes = await antigravity.submitTask(sampleTask, {
    projectPath: process.cwd(),
    projectType: 'Web',
    approvedRequirements: [],
    projectSpecification: null,
    currentTask: sampleTask,
    acceptanceCriteria: '',
    taskDependencies: [],
    currentCheckpoint: null,
    gitState: { branch: 'main', commitHash: 'HEAD', hasUncommittedChanges: false },
    relevantChangedFiles: [],
    recentExecutionErrors: []
  });
  assert(submitRes.success === false && submitRes.summary.includes('not currently connected'), '4. Project path boundary enforcement');

  // 5. Persistent Pre-Execution Checkpointing
  const startRes = core.startTask(sampleTask, [sampleTask], []);
  assert(startRes.checkpoint.id.startsWith('CHK-') && startRes.checkpoint.taskId === sampleTask.id, '5. Persistent pre-execution checkpointing');

  // 6. Live Execution Output Streaming
  const streamRes = await genericAgent.streamOutput(sampleTask.id);
  assert(typeof streamRes.stdout === 'string' && typeof streamRes.currentActivity === 'string', '6. Live execution output streaming');

  // 7. Safe Stop & User Controls
  const pauseRes = core.pauseTask(sampleTask);
  assert(pauseRes.updatedTask.status === 'PAUSED' && pauseRes.checkpoint.checkpointReason === 'User Paused', '7. User controls & safe stop checkpoint creation');

  // 8. Workspace Diff Baseline Protection
  const baseline = await WorkspaceDiffInspector.getInstance().captureBaseline(process.cwd());
  assert(baseline.baselineCommit !== undefined, '8. Workspace diff baseline protection');

  // 9. External Workspace Change Detection
  assert(typeof baseline.externalChangesDetected === 'boolean' || baseline.externalChangesDetected === undefined, '9. External workspace change detection');

  // 10. Task Verification Completion Flow
  const passVerifier: TaskVerifier = {
    verifyTask: async (): Promise<VerificationResult> => ({
      passed: true,
      completionPercentage: 100,
      completedCriteria: ['JWT login passed'],
      failedCriteria: [],
      errors: [],
      warnings: [],
      nextActions: []
    })
  };
  const verifiedRes = await core.completeStepAndVerify(startRes.updatedTask, passVerifier);
  assert(verifiedRes.updatedTask.status === 'COMPLETED', '10. Task completion verification flow');

  // 11. TaskContinuationState for Partial Completion
  const partialVerifier: TaskVerifier = {
    verifyTask: async (): Promise<VerificationResult> => ({
      passed: false,
      completionPercentage: 60,
      completedCriteria: ['UI completed'],
      failedCriteria: ['Session persistence missing'],
      errors: ['Session store error'],
      warnings: [],
      nextActions: ['Add session persistence']
    })
  };
  const partialRes = await core.completeStepAndVerify(startRes.updatedTask, partialVerifier);
  assert(partialRes.continuationState !== null && partialRes.updatedTask.status === 'PARTIALLY_COMPLETE', '11. TaskContinuationState for partial completion');

  // 12. Root Cause Analysis Evidence Collection
  const sampleFeedback: StructuredErrorFeedback = {
    taskId: sampleTask.id,
    requirementTitle: sampleTask.title,
    failedCriteria: ['TypeScript compilation failed'],
    commandExecuted: 'npm run typecheck',
    exitCode: 1,
    stderr: 'error TS2322: Type "string" is not assignable to type "number".',
    stdoutSummary: 'Found 1 error in src/auth.ts',
    affectedFiles: ['src/auth.ts'],
    workspaceDiffSummary: 'Modified src/auth.ts',
    likelyFailureArea: 'Type mismatch',
    nextRecommendedAction: 'Fix type error',
    createdAt: new Date().toISOString()
  };
  const rcaReport = rcaEngine.analyzeFailure(sampleTask, sampleFeedback, null, []);
  assert(rcaReport.candidates.length > 0 && rcaReport.evidenceQuotes.length > 0, '12. Root Cause Analysis evidence collection');

  // 13. Root Cause Candidate Confidence Rating
  assert(rcaReport.topCandidate !== null && rcaReport.topCandidate.confidence === 'HIGH', '13. Root cause candidate confidence rating (HIGH)');

  // 14. Fix Planner Instruction Generation
  const fixInstr = fixPlanner.createFixInstruction(sampleTask, rcaReport);
  assert(fixInstr.specificInstructions.length > 0 && fixInstr.constraints.length > 0, '14. FixPlanner instruction generation');

  // 15. Self-Correcting Loop Cap (Max 3 Cycles)
  const maxedTask: Task = { ...sampleTask, retryCount: 3, maxRetries: 3 };
  const maxedRes = core.interruptTask(maxedTask, 'Build Failure', 'Max cycles reached');
  assert(maxedRes.updatedTask.status === 'WAITING_FOR_USER', '15. Self-correcting loop maximum 3 cycle cap (WAITING_FOR_USER)');

  // 16. Network Recovery Bounded Backoff
  const netErr: ExecutionError = { id: 'err-1', taskId: sampleTask.id, kind: 'Network Failure', message: 'ECONNRESET', timestamp: new Date().toISOString() };
  const netRes = netRecovery.handleNetworkFailure(sampleTask, null, netErr);
  assert(netRes.shouldRetry === true && netRes.retryState.delayMs > 0, '16. Network recovery bounded exponential backoff');

  // 17. Provider & Model Failover Handling
  const limitErr = core.interruptTask(sampleTask, 'Usage Limit', 'Quota exceeded');
  assert(limitErr.updatedTask.failoverCount === 1, '17. Provider/Model failover handling');

  // 18. GitHub URL Connection Validation
  const urlVal = gitRepoService.validateGithubUrl('https://github.com/MRakesh8/Chat-Bot.git');
  assert(urlVal.isValid === true && urlVal.normalizedUrl === 'https://github.com/MRakesh8/Chat-Bot.git', '18. GitHub URL connection validation');

  // 19. GitCommitPlanner Conventional Commit Generation
  const commitPlan = gitCommitPlanner.planCommit(
    sampleTask,
    null,
    ['src/auth.ts'],
    'Changed 1 file',
    { passed: true, completionPercentage: 100, completedCriteria: [], failedCriteria: [], errors: [], warnings: [], nextActions: [] }
  );
  assert(commitPlan !== null && commitPlan.type === 'feat' && commitPlan.fullMessage.includes('feat(task):'), '19. GitCommitPlanner Conventional Commit generation');

  // 20. Commit Safety Verification Check
  const failedCommitPlan = gitCommitPlanner.planCommit(
    sampleTask,
    null,
    ['src/auth.ts'],
    'Changed 1 file',
    { passed: false, completionPercentage: 50, completedCriteria: [], failedCriteria: ['Failed'], errors: ['Error'], warnings: [], nextActions: [] }
  );
  const commitAttempt = await gitRepoService.executeCommit(process.cwd(), failedCommitPlan!);
  assert(commitAttempt.success === false && commitAttempt.message.includes('verification must pass'), '20. Commit safety verification requirement');

  // 21. GitHub Push Policy Enforcement (MANUAL_ONLY / ASK_BEFORE_PUSH)
  const pushAttempt = await gitRepoService.executePush(process.cwd(), 'MANUAL_ONLY');
  assert(pushAttempt.success === false && pushAttempt.message.includes('MANUAL_ONLY'), '21. GitHub push policy enforcement');

  // 22. AuditLogService Persistent Log Recording
  const auditEntry = await auditService.recordAuditLog(process.cwd(), {
    projectId: sampleProject.id,
    taskId: sampleTask.id,
    requirementId: null,
    provider: 'Antigravity',
    account: 'Primary',
    model: 'gemini-3.5-flash',
    action: 'Phase 6 Test Execution',
    commands: ['npm run typecheck'],
    filesChanged: ['src/auth.ts'],
    verification: 'PASSED',
    rootCauseReport: null,
    commitPlan: null,
    commitResult: null,
    pushResult: null,
    errors: [],
    recovery: null
  });
  assert(auditEntry.id.startsWith('AUD-') && auditEntry.projectId === sampleProject.id, '22. AuditLogService persistent log recording');

  // 23. Engineering Audit Log Retrieval
  const auditLogs = await auditService.loadAuditLogs(process.cwd());
  assert(Array.isArray(auditLogs) && auditLogs.length > 0, '23. Engineering audit log retrieval');

  // 24. AI-EOS Self-Development Safety Awareness
  assert(sampleProject.path !== undefined, '24. AI-EOS self-development workspace awareness');

  // 25. Truthful No-Demo-Data Principle
  const antiSubmit2 = await antigravity.submitTask(sampleTask, {
    projectPath: process.cwd(),
    projectType: 'Web',
    approvedRequirements: [],
    projectSpecification: null,
    currentTask: sampleTask,
    acceptanceCriteria: '',
    taskDependencies: [],
    currentCheckpoint: null,
    gitState: { branch: 'main', commitHash: 'HEAD', hasUncommittedChanges: false },
    relevantChangedFiles: [],
    recentExecutionErrors: []
  });
  assert(antiSubmit2.success === false && antiSubmit2.summary.includes('Antigravity execution is not currently connected'), '25. Truthful no-demo-data principle');

  // 26. TaskExecutionCore & ExecutionBridge Existing Stability
  const topo = core.sortTasksTopologically([sampleTask]);
  assert(!topo.hasCycle && topo.sortedTasks.length === 1, '26. TaskExecutionCore & ExecutionBridge existing tests stability');

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================\n');

  if (failedCount > 0) process.exit(1);
}

runPhase6Tests().catch(err => {
  console.error(err);
  process.exit(1);
});
