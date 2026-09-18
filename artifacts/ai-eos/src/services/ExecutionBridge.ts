import {
  Task,
  Project,
  Requirement,
  ExecutionCheckpoint,
  ExecutionResult,
  ExecutionError,
  ExecutionEvent,
  ProviderProfile,
  TaskVerifier,
  VerificationResult,
  RootCauseAnalysisReport,
  FixInstruction,
  CommitPlan
} from '../types';
import { TaskExecutionCore } from './TaskExecutionCore';
import { ProviderManager } from './ProviderManager';
import { WorkspaceContextBuilder } from './WorkspaceContextBuilder';
import { WorkspaceDiffInspector } from './WorkspaceDiffInspector';
import { RootCauseAnalysisEngine } from './RootCauseAnalysisEngine';
import { FixPlanner } from './FixPlanner';
import { GitCommitPlanner } from './GitCommitPlanner';
import { GitRepositoryService } from './GitRepositoryService';
import { AuditLogService } from './AuditLogService';
import { NetworkRecoveryService } from './NetworkRecoveryService';
import { ProjectVerificationEngine } from './ProjectVerificationEngine';

export interface BridgeExecuteOptions {
  task: Task;
  project: Project;
  allRequirements: Requirement[];
  allTasks: Task[];
  providerProfiles: ProviderProfile[];
  verifier: TaskVerifier;
  userApproved?: boolean;
  fixInstruction?: FixInstruction | null;
}

export class ExecutionBridge {
  private static instance: ExecutionBridge;

  private constructor() {}

  public static getInstance(): ExecutionBridge {
    if (!ExecutionBridge.instance) {
      ExecutionBridge.instance = new ExecutionBridge();
    }
    return ExecutionBridge.instance;
  }

  public async executeTaskBridge(options: BridgeExecuteOptions): Promise<{
    updatedTask: Task;
    executionResult: ExecutionResult | null;
    checkpoint: ExecutionCheckpoint | null;
    events: ExecutionEvent[];
    rcaReport?: RootCauseAnalysisReport | null;
    fixInstruction?: FixInstruction | null;
    commitPlan?: CommitPlan | null;
    blockedReason?: string;
  }> {
    const { task, project, allRequirements, allTasks, providerProfiles, verifier, fixInstruction } = options;
    const core = TaskExecutionCore.getInstance();
    const providerMgr = ProviderManager.getInstance();
    const contextBuilder = WorkspaceContextBuilder.getInstance();
    const diffInspector = WorkspaceDiffInspector.getInstance();
    const rcaEngine = RootCauseAnalysisEngine.getInstance();
    const fixPlannerService = FixPlanner.getInstance();
    const gitPlanner = GitCommitPlanner.getInstance();
    const gitRepoService = GitRepositoryService.getInstance();
    const auditService = AuditLogService.getInstance();
    const netRecovery = NetworkRecoveryService.getInstance();

    const events: ExecutionEvent[] = [];

    // 1. Autonomous Policy Check
    const policy = project.autonomousExecutionPolicy || 'OFF';
    if (policy === 'OFF') {
      const msg = 'Autonomous execution policy is OFF. AI-EOS will plan tasks but will not modify workspace files.';
      events.push(core.createExecutionEvent(task.id, task.projectId, 'execution_warning', msg));
      const planningTask: Task = { ...task, status: 'PLANNING', updatedAt: new Date().toISOString() };
      const chk = core.createCheckpoint(planningTask, 'Execution Planning', [], [], 'Policy OFF: Plan created');
      return {
        updatedTask: planningTask,
        executionResult: null,
        checkpoint: chk,
        events,
        blockedReason: msg
      };
    }

    // 2. Human Approval Check
    const userApproved = options.userApproved ?? project.hasUserApprovedAutonomousExecution ?? false;
    if (!userApproved) {
      const msg = 'First execution requires explicit human approval before modifying workspace files.';
      events.push(core.createExecutionEvent(task.id, task.projectId, 'execution_warning', msg));
      const waitingTask: Task = { ...task, status: 'WAITING_FOR_USER', updatedAt: new Date().toISOString() };
      const chk = core.createCheckpoint(waitingTask, 'Human Approval', [], [], 'Waiting for human approval');
      return {
        updatedTask: waitingTask,
        executionResult: null,
        checkpoint: chk,
        events,
        blockedReason: msg
      };
    }

    // 3. Workspace Baseline Capture & Pre-Execution Checkpoint
    const baseline = await diffInspector.captureBaseline(project.path || '');
    if (baseline.externalChangesDetected) {
      const msg = 'External workspace changes detected prior to AI-EOS task execution.';
      events.push(core.createExecutionEvent(task.id, task.projectId, 'external_workspace_change', msg));
    }

    // 4. Provider & Model Selection
    const { profile, modelId } = providerMgr.getBestProviderAndModelForTask(task, providerProfiles);
    if (!profile) {
      const waitingTask: Task = { ...task, status: 'WAITING_FOR_PROVIDER', updatedAt: new Date().toISOString() };
      events.push(core.createExecutionEvent(task.id, task.projectId, 'provider_failed', 'No enabled provider profile available'));
      const chk = core.createCheckpoint(waitingTask, 'Provider Selection', [], [], 'No provider available');
      return {
        updatedTask: waitingTask,
        executionResult: null,
        checkpoint: chk,
        events,
        blockedReason: 'No enabled provider profile available'
      };
    }

    events.push(core.createExecutionEvent(task.id, task.projectId, 'provider_selected', `Provider selected: ${profile.providerName} (${profile.profileName})`));
    events.push(core.createExecutionEvent(task.id, task.projectId, 'model_selected', `Model selected: ${modelId || 'Default'}`));

    // 5. Start Task Execution & Pre-Execution Checkpoint
    const startResult = core.startTask(task, allTasks, providerProfiles);
    events.push(...startResult.events);
    if (startResult.error) {
      return {
        updatedTask: startResult.updatedTask,
        executionResult: null,
        checkpoint: startResult.checkpoint,
        events,
        blockedReason: startResult.error
      };
    }

    const context = contextBuilder.buildContext(
      project,
      startResult.updatedTask,
      allRequirements,
      allTasks,
      startResult.checkpoint,
      []
    );
    context.fixInstruction = fixInstruction || null;

    // 6. Provider Adapter Dispatch
    const adapter = providerMgr.getAdapter(profile.providerName);
    let rawResult: ExecutionResult;
    const startedAt = new Date().toISOString();

    if (!adapter) {
      rawResult = {
        success: false,
        status: 'FAILED',
        summary: `No registered ProviderAdapter found for provider ${profile.providerName}`,
        changedFiles: [],
        createdFiles: [],
        deletedFiles: [],
        commandsExecuted: [],
        errors: [{
          id: `ERR-${Date.now()}`,
          taskId: task.id,
          kind: 'Provider Failure',
          message: `ProviderAdapter ${profile.providerName} not registered`,
          timestamp: startedAt
        }],
        warnings: [],
        provider: profile.providerName,
        profile: profile.profileName,
        model: modelId || 'none',
        startedAt,
        completedAt: new Date().toISOString()
      };
    } else {
      rawResult = await adapter.submitTask(startResult.updatedTask, context);
    }

    events.push(core.createExecutionEvent(task.id, task.projectId, 'execution_started', `Submitted task to adapter ${profile.providerName}`));

    // 7. Workspace Diff & Safety Inspection
    const { diff, warnings } = await diffInspector.inspectPostExecutionDiff(project.path || '', baseline, rawResult);
    if (warnings.length > 0) {
      rawResult.warnings.push(...warnings);
      for (const w of warnings) {
        events.push(core.createExecutionEvent(task.id, task.projectId, 'execution_warning', w));
      }
    }

    // 8. Verification Dispatch
    events.push(core.createExecutionEvent(task.id, task.projectId, 'verification_started', 'Routing task execution result to verification stage'));

    const verifyResult = await core.completeStepAndVerify(startResult.updatedTask, verifier);
    events.push(...verifyResult.events);

    let finalTask = verifyResult.updatedTask;
    let rcaReport: RootCauseAnalysisReport | null = null;
    let generatedFixInstruction: FixInstruction | null = null;

    // 9. Root-Cause Analysis & Correction Loop
    if (!verifyResult.verificationResult.passed) {
      const feedback = ProjectVerificationEngine.getInstance().getLastStructuredErrorFeedback();
      rcaReport = rcaEngine.analyzeFailure(finalTask, feedback, diff, rawResult.errors);
      generatedFixInstruction = fixPlannerService.createFixInstruction(finalTask, rcaReport);

      events.push(core.createExecutionEvent(task.id, task.projectId, 'rca_generated', `Root cause analyzed: ${rcaReport.problem}`));
      events.push(core.createExecutionEvent(task.id, task.projectId, 'fix_instruction_generated', `Generated fix instruction for ${rcaReport.topCandidate?.cause || 'Task fix'}`));

      const maxRetries = finalTask.maxRetries || 3;
      if (finalTask.retryCount >= maxRetries) {
        finalTask = { ...finalTask, status: 'WAITING_FOR_USER', updatedAt: new Date().toISOString() };
        events.push(core.createExecutionEvent(task.id, task.projectId, 'execution_failed', `Maximum correction cycle cap reached (${maxRetries} cycles). Escalated to WAITING_FOR_USER.`));
      }
    }

    // 10. Commit Planning
    let commitPlan: CommitPlan | null = null;
    if (verifyResult.verificationResult.passed) {
      const req = allRequirements.find(r => r.id === task.requirementId) || null;
      commitPlan = gitPlanner.planCommit(finalTask, req, diff.modifiedFiles.concat(diff.addedFiles), diff.mismatches.join('; '), verifyResult.verificationResult);
      if (commitPlan) {
        events.push(core.createExecutionEvent(task.id, task.projectId, 'commit_planned', `Commit planned: ${commitPlan.fullMessage.split('\n')[0]}`));
      }
    }

    // 11. Engineering Audit Log Recording
    if (project.path) {
      await auditService.recordAuditLog(project.path, {
        projectId: project.id,
        taskId: task.id,
        requirementId: task.requirementId || null,
        provider: profile.providerName,
        account: profile.profileName,
        model: modelId || 'none',
        action: `Execution of ${task.title || task.name}`,
        commands: rawResult.commandsExecuted,
        filesChanged: diff.modifiedFiles.concat(diff.addedFiles),
        verification: verifyResult.verificationResult.passed ? 'PASSED' : 'FAILED',
        rootCauseReport: rcaReport,
        commitPlan,
        commitResult: null,
        pushResult: null,
        errors: rawResult.errors.map(e => e.message),
        recovery: finalTask.retryCount > 0 ? `Cycle ${finalTask.retryCount}` : null
      });
    }

    return {
      updatedTask: finalTask,
      executionResult: rawResult,
      checkpoint: verifyResult.checkpoint,
      events,
      rcaReport,
      fixInstruction: generatedFixInstruction,
      commitPlan
    };
  }
}
