import {
  ProviderAdapter,
  ProviderModel,
  ProviderCapability,
  ProviderUsageStatus,
  Task,
  WorkspaceContext,
  ExecutionResult,
  ExecutionErrorKind
} from '../../types';

export class AntigravityAdapter implements ProviderAdapter {
  public providerId = 'antigravity';
  public providerName = 'Antigravity';

  public async validateReadiness(profileId: string): Promise<{ isReady: boolean; message: string }> {
    return {
      isReady: false,
      message: 'Integration unavailable: Official Antigravity execution API / local bridge not configured'
    };
  }

  public async getModels(profileId: string): Promise<ProviderModel[]> {
    return [
      { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', providerId: 'antigravity', capabilities: ['Code Editing', 'Terminal', 'Filesystem'], isAvailable: false },
      { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', providerId: 'antigravity', capabilities: ['Code Editing', 'Terminal', 'Filesystem'], isAvailable: false }
    ];
  }

  public async getCapabilities(profileId: string): Promise<ProviderCapability[]> {
    return ['Code Editing', 'Terminal', 'Filesystem', 'Git', 'Build', 'Testing'];
  }

  public async checkAvailability(profileId: string): Promise<boolean> {
    return false;
  }

  public async submitTask(task: Task, context: WorkspaceContext): Promise<ExecutionResult> {
    const now = new Date().toISOString();
    return {
      success: false,
      status: 'FAILED',
      summary: 'Antigravity execution is not currently connected. No supported headless API bridge detected.',
      changedFiles: [],
      createdFiles: [],
      deletedFiles: [],
      commandsExecuted: [],
      errors: [
        {
          id: `ERR-${Date.now()}`,
          taskId: task.id,
          kind: 'Provider Failure',
          message: 'Antigravity integration unavailable: Local headless bridge API endpoint not configured.',
          timestamp: now
        }
      ],
      warnings: ['Antigravity adapter requires a local bridge or official Agent API endpoint to submit tasks.'],
      provider: this.providerName,
      profile: task.currentProviderProfileId || 'antigravity-profile',
      model: 'none',
      startedAt: now,
      completedAt: now
    };
  }

  public async getExecutionProgress(taskId: string): Promise<{ progressPercentage: number; currentStep: string }> {
    return { progressPercentage: 0, currentStep: 'Integration unavailable' };
  }

  public async getExecutionResult(taskId: string): Promise<ExecutionResult | null> {
    return null;
  }

  public async stopExecution(taskId: string): Promise<boolean> {
    return true;
  }

  public async getUsageStatus(profileId: string): Promise<ProviderUsageStatus> {
    return {
      isAvailable: false,
      statusMessage: 'Not Available: Official Antigravity execution API / local bridge not configured'
    };
  }

  public classifyError(error: any): ExecutionErrorKind {
    if (typeof error === 'string' && error.includes('network')) return 'Network Failure';
    if (typeof error === 'string' && error.includes('limit')) return 'Usage Limit';
    return 'Provider Failure';
  }
}
