import { Task, WorkspaceContext, ExecutionResult, ExecutionErrorKind } from '../../types';

export interface CodingToolAdapter {
  toolId: string;
  toolName: string;
  validateReadiness(profileId: string): Promise<{ isReady: boolean; message: string }>;
  execute(task: Task, context: WorkspaceContext): Promise<ExecutionResult>;
  streamOutput(taskId: string): Promise<{ stdout: string; stderr: string }>;
  stop(taskId: string): Promise<boolean>;
  classifyError(error: any): ExecutionErrorKind;
}
