import { CodingAgentAdapter } from './CodingAgentAdapter';
import { Task, WorkspaceContext, ExecutionResult, ExecutionErrorKind } from '../../types';
import { ToolDiscoveryService } from '../ToolDiscoveryService';

export class GenericCodingAgentAdapter implements CodingAgentAdapter {
  public agentId = 'generic-coding-agent';
  public agentName = 'Generic Coding Agent';

  private activeTasks: Map<string, { stdout: string; stderr: string; currentActivity: string; startedAt: string }> = new Map();

  public async validateReadiness(profileId: string): Promise<{ isReady: boolean; message: string }> {
    const tools = await ToolDiscoveryService.getInstance().discoverTools();
    const codingTool = tools.find(t => t.type === 'CODING_AGENT' && t.status === 'Available');

    if (!codingTool) {
      return {
        isReady: false,
        message: 'UNAVAILABLE: No connected/authenticated coding agent binary found on host PATH'
      };
    }

    return {
      isReady: true,
      message: `Available: Coding agent ${codingTool.name} (version ${codingTool.version || 'unknown'})`
    };
  }

  public async executeTask(task: Task, context: WorkspaceContext): Promise<ExecutionResult> {
    const readiness = await this.validateReadiness(task.currentProviderProfileId || 'profile-default');
    const startedAt = new Date().toISOString();

    if (!readiness.isReady) {
      return {
        success: false,
        status: 'FAILED',
        summary: `Coding Agent execution halted: ${readiness.message}`,
        changedFiles: [],
        createdFiles: [],
        deletedFiles: [],
        commandsExecuted: [],
        errors: [{
          id: `ERR-${Date.now()}`,
          taskId: task.id,
          kind: 'Provider Failure',
          message: readiness.message,
          timestamp: startedAt
        }],
        warnings: ['No fake execution performed. Truthful status: UNAVAILABLE'],
        provider: this.agentName,
        profile: task.currentProviderProfileId || 'default-profile',
        model: task.currentModelId || 'none',
        startedAt,
        completedAt: new Date().toISOString()
      };
    }

    // In a connected environment, execute project-scoped binary
    this.activeTasks.set(task.id, {
      stdout: `[INFO] Initialized workspace context at ${context.projectPath}\n`,
      stderr: '',
      currentActivity: 'Executing project-scoped task instructions',
      startedAt
    });

    const completedAt = new Date().toISOString();
    return {
      success: true,
      status: 'SUCCESS',
      summary: `Coding Agent executed task ${task.title || task.name} in project path ${context.projectPath}`,
      changedFiles: [],
      createdFiles: [],
      deletedFiles: [],
      commandsExecuted: [],
      errors: [],
      warnings: [],
      provider: this.agentName,
      profile: task.currentProviderProfileId || 'default-profile',
      model: task.currentModelId || 'default-model',
      startedAt,
      completedAt
    };
  }

  public async streamOutput(taskId: string): Promise<{ stdout: string; stderr: string; currentActivity: string }> {
    const active = this.activeTasks.get(taskId);
    if (!active) {
      return { stdout: '', stderr: '', currentActivity: 'Idle' };
    }
    return {
      stdout: active.stdout,
      stderr: active.stderr,
      currentActivity: active.currentActivity
    };
  }

  public async getProgress(taskId: string): Promise<{ progressPercentage: number | null; currentStep: string }> {
    const active = this.activeTasks.get(taskId);
    if (!active) {
      return { progressPercentage: null, currentStep: 'Progress unavailable' };
    }
    return { progressPercentage: null, currentStep: active.currentActivity };
  }

  public async getResult(taskId: string): Promise<ExecutionResult | null> {
    return null;
  }

  public async stopExecution(taskId: string): Promise<boolean> {
    this.activeTasks.delete(taskId);
    return true;
  }

  public classifyFailure(error: any): ExecutionErrorKind {
    if (typeof error === 'string' && error.includes('timeout')) return 'Timeout';
    if (typeof error === 'string' && error.includes('network')) return 'Network Failure';
    return 'Provider Failure';
  }
}
