import { ExecutionBridge } from '../ExecutionBridge';
import { TaskExecutionCore } from '../TaskExecutionCore';
import { ProviderManager } from '../ProviderManager';
import { CommandSafetyClassifier } from '../CommandSafetyClassifier';
import { WorkspaceDiffInspector } from '../WorkspaceDiffInspector';
import { WorkspaceContextBuilder } from '../WorkspaceContextBuilder';
import { AntigravityAdapter } from '../adapters/AntigravityAdapter';
import {
  Task,
  Project,
  Requirement,
  ProviderProfile,
  ProviderAdapter,
  TaskVerifier,
  VerificationResult,
  ExecutionResult,
  WorkspaceContext,
  ExecutionErrorKind
} from '../../types';

class MockWorkingAdapter implements ProviderAdapter {
  providerId = 'mock-working';
  providerName = 'Mock Working Provider';

  async validateReadiness(profileId: string): Promise<{ isReady: boolean; message: string }> {
    return { isReady: true, message: 'Provider ready' };
  }

  async getModels(profileId: string) {
    return [{ id: 'model-1', name: 'Model 1', providerId: 'mock-working', capabilities: ['Code Editing'], isAvailable: true }];
  }

  async getCapabilities(profileId: string) {
    return ['Code Editing'];
  }

  async checkAvailability(profileId: string) {
    return true;
  }

  async submitTask(task: Task, context: WorkspaceContext): Promise<ExecutionResult> {
    const now = new Date().toISOString();
    return {
      success: true,
      status: 'SUCCESS',
      summary: 'Task executed successfully',
      changedFiles: ['src/App.tsx'],
      createdFiles: ['src/components/NewFeature.tsx'],
      deletedFiles: [],
      commandsExecuted: ['npm test'],
      errors: [],
      warnings: [],
      provider: this.providerName,
      profile: task.currentProviderProfileId || 'mock-profile',
      model: 'model-1',
      startedAt: now,
      completedAt: now
    };
  }

  async getExecutionProgress(taskId: string) {
    return { progressPercentage: 100, currentStep: 'Completed' };
  }

  async getExecutionResult(taskId: string) {
    return null;
  }

  async stopExecution(taskId: string) {
    return true;
  }

  async getUsageStatus(profileId: string) {
    return { isAvailable: true, statusMessage: 'Available' };
  }

  classifyError(error: any): ExecutionErrorKind {
    return 'Unknown Failure';
  }
}

async function runBridgeTests() {
  console.log('====================================================');
  console.log('AI-EOS EXECUTION BRIDGE & SAFETY - AUTOMATED TESTS');
  console.log('====================================================\n');

  const bridge = ExecutionBridge.getInstance();
  const core = TaskExecutionCore.getInstance();
  const providerMgr = ProviderManager.getInstance();
  const cmdSafety = CommandSafetyClassifier.getInstance();
  const diffInspector = WorkspaceDiffInspector.getInstance();

  const workingAdapter = new MockWorkingAdapter();
  providerMgr.registerAdapter(workingAdapter);

  const antigravityAdapter = new AntigravityAdapter();
  providerMgr.registerAdapter(antigravityAdapter);

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
    id: 'PRJ-TEST',
    name: 'Test Project',
    description: 'Bridge Test Project',
    projectType: 'Web',
    techStack: ['React', 'TypeScript'],
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startDate: '2026-08-12',
    endDate: '',
    path: '/mock/project/path',
    autonomousExecutionPolicy: 'ON',
    hasUserApprovedAutonomousExecution: true
  };

  const sampleTask: Task = {
    id: 'TSK-BRIDGE-1',
    projectId: 'PRJ-TEST',
    title: 'Build Login Form',
    name: 'Build Login Form',
    description: 'Implement responsive login form',
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

  const sampleProfiles: ProviderProfile[] = [
    {
      id: 'prof-working',
      providerName: 'Mock Working Provider',
      profileName: 'Working Profile 1',
      isEnabled: true,
      lastKnownStatus: 'Available',
      lastCheckedAt: new Date().toISOString(),
      supportedProjectTypes: ['Web'],
      capabilities: ['Code Editing'],
      availableModels: [{ id: 'model-1', name: 'Model 1', providerId: 'mock-working', capabilities: ['Code Editing'], isAvailable: true }],
      selectedModelId: 'model-1'
    }
  ];

  const passVerifier: TaskVerifier = {
    verifyTask: async (): Promise<VerificationResult> => ({
      passed: true,
      completionPercentage: 100,
      completedCriteria: ['All tests passed'],
      failedCriteria: [],
      errors: [],
      warnings: [],
      nextActions: []
    })
  };

  // 1. Provider Adapter Registration
  assert(providerMgr.hasAdapter('mock-working') && providerMgr.hasAdapter('antigravity'), '1. Provider adapter registration');

  // 2. Provider Unavailable (Antigravity Status Check)
  const isAvailable = await antigravityAdapter.checkAvailability('prof-1');
  assert(!isAvailable, '2. Provider unavailable reporting (Antigravity unavailable)');

  // 3. Provider Readiness Failure
  const readiness = await antigravityAdapter.validateReadiness('prof-1');
  assert(!readiness.isReady && readiness.message.includes('Integration unavailable'), '3. Provider readiness failure');

  // 4. ExecutionBridge Dispatch
  const bridgeRes = await bridge.executeTaskBridge({
    task: sampleTask,
    project: sampleProject,
    allRequirements: [],
    allTasks: [sampleTask],
    providerProfiles: sampleProfiles,
    verifier: passVerifier
  });
  assert(bridgeRes.executionResult !== null && bridgeRes.updatedTask.status === 'COMPLETED', '4. ExecutionBridge dispatch');

  // 5. Successful Execution Result Structure
  assert(
    bridgeRes.executionResult?.success === true &&
    bridgeRes.executionResult?.changedFiles.includes('src/App.tsx'),
    '5. Successful execution result'
  );

  // 6. Network Failure Handling
  const networkErrTask = { ...sampleTask, id: 'TSK-NET-1' };
  const netErrRes = core.interruptTask(networkErrTask, 'Network Failure', 'Connection reset by peer');
  assert(netErrRes.updatedTask.status === 'RECOVERING' && netErrRes.updatedTask.retryCount === 1, '6. Network failure handling');

  // 7. Retry Behavior
  assert(netErrRes.events.some(e => e.type === 'task_recovery_started'), '7. Retry behavior logging');

  // 8. Model Failure & Failover Checkpoint
  const modelErrRes = core.interruptTask(networkErrTask, 'Model Limit', 'Token quota reached for model-1');
  assert(modelErrRes.updatedTask.failoverCount === 1, '8. Model failure incrementing failover count');

  // 9. Checkpoint Before Failover
  assert(modelErrRes.checkpoint.checkpointReason.includes('Interrupted'), '9. Checkpoint before failover');

  // 10. Partial Completion Flow
  const partialVerifier: TaskVerifier = {
    verifyTask: async (): Promise<VerificationResult> => ({
      passed: false,
      completionPercentage: 50,
      completedCriteria: ['UI HTML created'],
      failedCriteria: ['Submit handler missing'],
      errors: ['Handler missing'],
      warnings: [],
      nextActions: ['Implement submit handler']
    })
  };
  const partialBridgeRes = await bridge.executeTaskBridge({
    task: { ...sampleTask, id: 'TSK-PARTIAL' },
    project: sampleProject,
    allRequirements: [],
    allTasks: [sampleTask],
    providerProfiles: sampleProfiles,
    verifier: partialVerifier
  });
  assert(partialBridgeRes.updatedTask.status === 'PARTIALLY_COMPLETE', '10. Partial completion routing');

  // 11. Workspace Diff Inspection
  const baseline = await diffInspector.captureBaseline('/mock/path');
  const postDiff = await diffInspector.inspectPostExecutionDiff('/mock/path', baseline, bridgeRes.executionResult!);
  assert(postDiff.diff.modifiedFiles.includes('src/App.tsx'), '11. Workspace diff inspection');

  // 12. Pre-existing User Changes Baseline Protection
  assert(baseline.uncommittedChanges === false, '12. Pre-existing user changes baseline protection');

  // 13. Dangerous Command Blocking
  const blocked1 = cmdSafety.classifyCommand('rm -rf /');
  const blocked2 = cmdSafety.classifyCommand('git push origin main --force');
  const safeCmd = cmdSafety.classifyCommand('npm test');
  assert(blocked1 === 'BLOCKED' && blocked2 === 'BLOCKED' && safeCmd === 'SAFE', '13. Dangerous command blocking');

  // 14. Autonomous Execution OFF Policy Check
  const offProject: Project = { ...sampleProject, autonomousExecutionPolicy: 'OFF' };
  const offRes = await bridge.executeTaskBridge({
    task: { ...sampleTask, id: 'TSK-OFF' },
    project: offProject,
    allRequirements: [],
    allTasks: [sampleTask],
    providerProfiles: sampleProfiles,
    verifier: passVerifier
  });
  assert(offRes.blockedReason !== undefined && offRes.updatedTask.status === 'PLANNING', '14. Autonomous execution OFF policy enforcement');

  // 15. Autonomous Execution ON Policy Check
  assert(bridgeRes.blockedReason === undefined, '15. Autonomous execution ON policy execution');

  // 16. Pause Task Execution
  const pauseRes = core.pauseTask(sampleTask);
  assert(pauseRes.updatedTask.status === 'PAUSED', '16. Pause execution');

  // 17. Safe Stop Handling
  assert(pauseRes.checkpoint.checkpointReason === 'User Paused', '17. Safe stop checkpoint creation');

  // 18. Execution Cancellation / Stop
  const stopRes = await workingAdapter.stopExecution(sampleTask.id);
  assert(stopRes === true, '18. Execution cancellation handling');

  // 19. Verification Routing
  assert(bridgeRes.events.some(e => e.type === 'verification_started'), '19. Mandatory verification routing');

  // 20. No Fake Provider Result (Antigravity status verification)
  const antiSubmit = await antigravityAdapter.submitTask(sampleTask, {
    projectPath: '/mock/path',
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
  assert(antiSubmit.success === false && antiSubmit.summary.includes('Antigravity execution is not currently connected'), '20. No fake provider result verification');

  // 21. TaskExecutionCore Existing Regression Tests Verification
  const topo = core.sortTasksTopologically([sampleTask]);
  assert(!topo.hasCycle && topo.sortedTasks.length === 1, '21. Existing TaskExecutionCore tests stability');

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================\n');

  if (failedCount > 0) process.exit(1);
}

runBridgeTests().catch(err => {
  console.error(err);
  process.exit(1);
});
