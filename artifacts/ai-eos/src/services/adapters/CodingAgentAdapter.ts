import { Task, WorkspaceContext, ExecutionResult, ExecutionErrorKind } from '../../types';

export interface CodingAgentAdapter {
  agentId: string;
  agentName: string;
  validateReadiness(profileId: string): Promise<{ isReady: boolean; message: string }>;
  executeTask(task: Task, context: WorkspaceContext): Promise<ExecutionResult>;
  streamOutput(taskId: string): Promise<{ stdout: string; stderr: string; currentActivity: string }>;
  getProgress(taskId: string): Promise<{ progressPercentage: number | null; currentStep: string }>;
  getResult(taskId: string): Promise<ExecutionResult | null>;
  stopExecution(taskId: string): Promise<boolean>;
  classifyFailure(error: any): ExecutionErrorKind;
}
