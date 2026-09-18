import { Task, ExecutionCheckpoint, ExecutionError, ExecutionEvent } from '../types';
import { TaskExecutionCore } from './TaskExecutionCore';

export interface NetworkRetryState {
  attemptCount: number;
  maxAttempts: number;
  delayMs: number;
  isRetryable: boolean;
  checkpointId: string | null;
}

export class NetworkRecoveryService {
  private static instance: NetworkRecoveryService;
  private retryStates: Map<string, NetworkRetryState> = new Map();

  private constructor() {}

  public static getInstance(): NetworkRecoveryService {
    if (!NetworkRecoveryService.instance) {
      NetworkRecoveryService.instance = new NetworkRecoveryService();
    }
    return NetworkRecoveryService.instance;
  }

  public isRetryableError(kind: string, message: string): boolean {
    const msg = message.toLowerCase();
    if (kind === 'Network Failure' || kind === 'Timeout') return true;
    if (msg.includes('network') || msg.includes('timeout') || msg.includes('econnreset') || msg.includes('etimedout')) {
      return true;
    }
    return false;
  }

  public calculateBackoffDelay(attempt: number, baseMs: number = 1000, maxMs: number = 30000): number {
    const delay = baseMs * Math.pow(2, attempt - 1);
    return Math.min(delay, maxMs);
  }

  public handleNetworkFailure(
    task: Task,
    checkpoint: ExecutionCheckpoint | null,
    error: ExecutionError
  ): {
    updatedTask: Task;
    retryState: NetworkRetryState;
    events: ExecutionEvent[];
    shouldRetry: boolean;
  } {
    const core = TaskExecutionCore.getInstance();
    const isRetryable = this.isRetryableError(error.kind, error.message);
    const existing = this.retryStates.get(task.id) || {
      attemptCount: 0,
      maxAttempts: 3,
      delayMs: 1000,
      isRetryable,
      checkpointId: checkpoint?.id || null
    };

    const newAttempt = existing.attemptCount + 1;
    const delayMs = this.calculateBackoffDelay(newAttempt);
    const shouldRetry = isRetryable && newAttempt <= existing.maxAttempts;

    const retryState: NetworkRetryState = {
      attemptCount: newAttempt,
      maxAttempts: existing.maxAttempts,
      delayMs,
      isRetryable,
      checkpointId: checkpoint?.id || null
    };

    this.retryStates.set(task.id, retryState);

    const updatedTask: Task = {
      ...task,
      status: shouldRetry ? 'RECOVERING' : 'WAITING_FOR_USER',
      retryCount: newAttempt,
      updatedAt: new Date().toISOString()
    };

    const events: ExecutionEvent[] = [
      core.createExecutionEvent(
        task.id,
        task.projectId,
        'execution_warning',
        `Network failure detected (attempt ${newAttempt}/${existing.maxAttempts}): ${error.message}. ${shouldRetry ? `Retrying in ${delayMs}ms` : 'Max retries reached, waiting for user.'}`
      )
    ];

    return { updatedTask, retryState, events, shouldRetry };
  }

  public clearRetryState(taskId: string): void {
    this.retryStates.delete(taskId);
  }
}
