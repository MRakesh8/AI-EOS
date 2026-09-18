import {
  Task,
  TaskExecutionStatus,
  ExecutionCheckpoint,
  ExecutionEvent,
  ExecutionEventType,
  ExecutionError,
  ExecutionErrorKind,
  TaskContinuationState,
  VerificationResult,
  TaskVerifier,
  ProviderProfile
} from '../types';
import { ProviderManager } from './ProviderManager';

export class TaskExecutionCore {
  private static instance: TaskExecutionCore;

  private constructor() {}

  public static getInstance(): TaskExecutionCore {
    if (!TaskExecutionCore.instance) {
      TaskExecutionCore.instance = new TaskExecutionCore();
    }
    return TaskExecutionCore.instance;
  }

  public sortTasksTopologically(tasks: Task[]): { sortedTasks: Task[]; hasCycle: boolean; cycleTaskIds: string[] } {
    const inDegree = new Map<string, number>();
    const graph = new Map<string, string[]>();
    const taskMap = new Map<string, Task>();

    for (const task of tasks) {
      taskMap.set(task.id, task);
      inDegree.set(task.id, 0);
      graph.set(task.id, []);
    }

    for (const task of tasks) {
      for (const depId of task.dependencies || []) {
        if (graph.has(depId)) {
          graph.get(depId)!.push(task.id);
          inDegree.set(task.id, (inDegree.get(task.id) || 0) + 1);
        }
      }
    }

    const queue: string[] = [];
    for (const [id, degree] of inDegree.entries()) {
      if (degree === 0) queue.push(id);
    }

    const sortedTasks: Task[] = [];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const task = taskMap.get(currentId)!;
      sortedTasks.push(task);

      for (const neighborId of graph.get(currentId) || []) {
        inDegree.set(neighborId, inDegree.get(neighborId)! - 1);
        if (inDegree.get(neighborId) === 0) {
          queue.push(neighborId);
        }
      }
    }

    if (sortedTasks.length !== tasks.length) {
      const unvisitedIds = tasks.filter(t => !sortedTasks.some(st => st.id === t.id)).map(t => t.id);
      return { sortedTasks, hasCycle: true, cycleTaskIds: unvisitedIds };
    }

    return { sortedTasks, hasCycle: false, cycleTaskIds: [] };
  }

  public canExecuteTask(task: Task, allTasks: Task[]): { canExecute: boolean; reason?: string } {
    const taskMap = new Map<string, Task>(allTasks.map(t => [t.id, t]));
    for (const depId of task.dependencies || []) {
      const depTask = taskMap.get(depId);
      if (!depTask || depTask.status !== 'COMPLETED') {
        return { canExecute: false, reason: `Dependency task ${depId} is not completed.` };
      }
    }
    return { canExecute: true };
  }

  public inspectWorkspaceAndDetermineRemainingWork(
    task: Task,
    checkpoint: ExecutionCheckpoint | null
  ): { completedSteps: string[]; remainingSteps: string[] } {
    if (!checkpoint) {
      return {
        completedSteps: [],
        remainingSteps: ['Execute initial task work', 'Run verification criteria']
      };
    }
    return {
      completedSteps: checkpoint.completedSteps,
      remainingSteps: checkpoint.remainingSteps
    };
  }

  public createExecutionEvent(
    taskId: string,
    projectId: string,
    type: ExecutionEventType,
    message: string,
    metadata?: Record<string, any>
  ): ExecutionEvent {
    return {
      id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      taskId,
      projectId,
      type,
      timestamp: new Date().toISOString(),
      message,
      metadata
    };
  }

  public createCheckpoint(
    task: Task,
    currentStep: string,
    completedSteps: string[],
    remainingSteps: string[],
    reason: string,
    verificationState: VerificationResult | null = null,
    filesChanged: string[] = []
  ): ExecutionCheckpoint {
    return {
      id: `CHK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      taskId: task.id,
      projectId: task.projectId,
      timestamp: new Date().toISOString(),
      currentStep,
      completedSteps,
      remainingSteps,
      providerProfileId: task.currentProviderProfileId || null,
      modelId: task.currentModelId || null,
      filesChanged,
      verificationState,
      retryCount: task.retryCount,
      failoverCount: task.failoverCount,
      taskStatus: task.status,
      gitState: { branch: 'main', commitHash: 'HEAD', hasUncommittedChanges: filesChanged.length > 0 },
      buildStatus: 'Unknown',
      testStatus: 'Unknown',
      executionSummary: `Checkpoint captured for ${task.title || task.name}`,
      checkpointReason: reason
    };
  }

  public startTask(
    task: Task,
    allTasks: Task[],
    providerProfiles: ProviderProfile[]
  ): { updatedTask: Task; checkpoint: ExecutionCheckpoint; events: ExecutionEvent[]; error?: string } {
    const readiness = this.canExecuteTask(task, allTasks);
    if (!readiness.canExecute) {
      const blockedTask: Task = { ...task, status: 'WAITING_FOR_USER', updatedAt: new Date().toISOString() };
      const chk = this.createCheckpoint(blockedTask, 'Blocked check', [], ['Resolve dependencies'], readiness.reason || 'Blocked');
      return {
        updatedTask: blockedTask,
        checkpoint: chk,
        events: [this.createExecutionEvent(task.id, task.projectId, 'execution_failed', readiness.reason || 'Blocked')],
        error: readiness.reason
      };
    }

    const { profile, modelId } = ProviderManager.getInstance().getBestProviderAndModelForTask(task, providerProfiles);
    const updatedTask: Task = {
      ...task,
      status: 'EXECUTING',
      currentProviderProfileId: profile ? profile.id : null,
      currentModelId: modelId,
      updatedAt: new Date().toISOString()
    };

    const chk = this.createCheckpoint(updatedTask, 'Executing task', ['Readiness verified'], ['Submit execution'], 'Task started');
    updatedTask.checkpointId = chk.id;

    const events: ExecutionEvent[] = [
      this.createExecutionEvent(task.id, task.projectId, 'task_started', `Started execution for task ${task.title || task.name}`),
      this.createExecutionEvent(task.id, task.projectId, 'checkpoint_created', `Pre-execution checkpoint ${chk.id} created`)
    ];

    return { updatedTask, checkpoint: chk, events };
  }

  public pauseTask(task: Task): { updatedTask: Task; checkpoint: ExecutionCheckpoint; events: ExecutionEvent[] } {
    const updatedTask: Task = { ...task, status: 'PAUSED', updatedAt: new Date().toISOString() };
    const chk = this.createCheckpoint(updatedTask, 'Paused by user', [], ['Resume execution'], 'User Paused');
    updatedTask.checkpointId = chk.id;

    const events: ExecutionEvent[] = [
      this.createExecutionEvent(task.id, task.projectId, 'task_paused', `Paused task ${task.title || task.name}`),
      this.createExecutionEvent(task.id, task.projectId, 'checkpoint_created', `Checkpoint ${chk.id} created on pause`)
    ];

    return { updatedTask, checkpoint: chk, events };
  }

  public resumeTask(
    task: Task,
    checkpoint: ExecutionCheckpoint | null
  ): { updatedTask: Task; checkpoint: ExecutionCheckpoint; events: ExecutionEvent[] } {
    const work = this.inspectWorkspaceAndDetermineRemainingWork(task, checkpoint);
    const updatedTask: Task = { ...task, status: 'EXECUTING', updatedAt: new Date().toISOString() };

    const newChk = this.createCheckpoint(updatedTask, 'Resuming execution', work.completedSteps, work.remainingSteps, 'Task Resumed');
    updatedTask.checkpointId = newChk.id;

    const events: ExecutionEvent[] = [
      this.createExecutionEvent(task.id, task.projectId, 'task_resumed', `Resumed task ${task.title || task.name} from checkpoint`),
      this.createExecutionEvent(task.id, task.projectId, 'checkpoint_created', `Checkpoint ${newChk.id} created on resume`)
    ];

    return { updatedTask, checkpoint: newChk, events };
  }

  public interruptTask(
    task: Task,
    kind: ExecutionErrorKind,
    message: string
  ): { updatedTask: Task; checkpoint: ExecutionCheckpoint; events: ExecutionEvent[]; error: ExecutionError } {
    const err: ExecutionError = {
      id: `ERR-${Date.now()}`,
      taskId: task.id,
      kind,
      message,
      timestamp: new Date().toISOString()
    };

    const isLimit = kind === 'Usage Limit' || kind === 'Model Limit';
    const newRetryCount = task.retryCount + 1;
    const newFailoverCount = isLimit ? task.failoverCount + 1 : task.failoverCount;
    const maxRetries = task.maxRetries || 3;

    let nextStatus: TaskExecutionStatus = 'RECOVERING';
    if (newRetryCount >= maxRetries) {
      nextStatus = 'WAITING_FOR_USER';
    }

    const updatedTask: Task = {
      ...task,
      status: nextStatus,
      retryCount: newRetryCount,
      failoverCount: newFailoverCount,
      updatedAt: new Date().toISOString()
    };

    const chk = this.createCheckpoint(updatedTask, 'Interrupted execution', [], ['Recover state'], `Interrupted: ${kind}`);
    updatedTask.checkpointId = chk.id;

    const events: ExecutionEvent[] = [
      this.createExecutionEvent(task.id, task.projectId, 'execution_failed', `Task interrupted (${kind}): ${message}`),
      this.createExecutionEvent(task.id, task.projectId, 'task_recovery_started', `Recovery started (retry ${newRetryCount}/${maxRetries})`)
    ];

    return { updatedTask, checkpoint: chk, events, error: err };
  }

  public async completeStepAndVerify(
    task: Task,
    verifier: TaskVerifier
  ): Promise<{
    updatedTask: Task;
    verificationResult: VerificationResult;
    checkpoint: ExecutionCheckpoint;
    continuationState: TaskContinuationState | null;
    events: ExecutionEvent[];
  }> {
    const events: ExecutionEvent[] = [];
    events.push(this.createExecutionEvent(task.id, task.projectId, 'verification_started', 'Verification started'));

    const vResult = await verifier.verifyTask(task);

    let updatedStatus: TaskExecutionStatus = 'COMPLETED';
    let continuation: TaskContinuationState | null = null;

    if (vResult.passed) {
      updatedStatus = 'COMPLETED';
      events.push(this.createExecutionEvent(task.id, task.projectId, 'verification_passed', 'Verification passed cleanly'));
      events.push(this.createExecutionEvent(task.id, task.projectId, 'task_completed', `Task ${task.title || task.name} COMPLETED`));
    } else {
      const hasProgress = vResult.completionPercentage > 0;
      updatedStatus = hasProgress ? 'PARTIALLY_COMPLETE' : 'FAILED';
      events.push(this.createExecutionEvent(task.id, task.projectId, 'verification_failed', `Verification failed. Completion: ${vResult.completionPercentage}%`));

      if (hasProgress) {
        events.push(this.createExecutionEvent(task.id, task.projectId, 'task_partially_complete', 'Task marked PARTIALLY_COMPLETE'));
      }

      continuation = {
        id: `CNT-${Date.now()}`,
        taskId: task.id,
        projectId: task.projectId,
        checkpointId: '',
        completed: vResult.completedCriteria,
        remaining: vResult.failedCriteria,
        errors: vResult.errors,
        nextActions: vResult.nextActions,
        inspectedAt: new Date().toISOString()
      };
    }

    const updatedTask: Task = {
      ...task,
      status: updatedStatus,
      progress: vResult.completionPercentage,
      updatedAt: new Date().toISOString()
    };

    const chk = this.createCheckpoint(
      updatedTask,
      'Post-verification checkpoint',
      vResult.completedCriteria,
      vResult.failedCriteria,
      `Verified: ${vResult.passed ? 'Passed' : 'Failed'}`,
      vResult
    );

    updatedTask.checkpointId = chk.id;
    if (continuation) continuation.checkpointId = chk.id;

    events.push(this.createExecutionEvent(task.id, task.projectId, 'checkpoint_created', `Checkpoint ${chk.id} created post-verification`));

    return {
      updatedTask,
      verificationResult: vResult,
      checkpoint: chk,
      continuationState: continuation,
      events
    };
  }

  public detectUnfinishedTasks(tasks: Task[]): Task[] {
    return tasks.filter(t =>
      ['EXECUTING', 'PLANNING', 'VERIFYING', 'RECOVERING', 'PAUSED'].includes(t.status)
    );
  }
}
