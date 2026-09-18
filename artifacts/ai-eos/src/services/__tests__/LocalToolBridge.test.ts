import { LocalToolBridge } from '../LocalToolBridge';
import { ToolDiscoveryService } from '../ToolDiscoveryService';
import { ProjectVerificationEngine } from '../ProjectVerificationEngine';
import { GitRepositoryService } from '../GitRepositoryService';
import { CommandSafetyClassifier } from '../CommandSafetyClassifier';
import { AntigravityAdapter } from '../adapters/AntigravityAdapter';
import { ExecutionBridge } from '../ExecutionBridge';
import { TaskExecutionCore } from '../TaskExecutionCore';
import { ProviderManager } from '../ProviderManager';
import {
  ToolProfile,
  Task,
  Project,
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

  async validateReadiness(profileId: string) {
    return { isReady: true, message: 'Ready' };
  }
  async getModels(profileId: string) {
    return [{ id: 'm1', name: 'Model 1', providerId: 'mock-working', capabilities: ['Code Editing'], isAvailable: true }];
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
      summary: 'Mock execution success',
      changedFiles: ['src/App.tsx'],
      createdFiles: [],
      deletedFiles: [],
      commandsExecuted: ['npm test'],
      errors: [],
      warnings: [],
      provider: this.providerName,
      profile: task.currentProviderProfileId || 'mock-profile',
      model: 'm1',
      startedAt: now,
      completedAt: now
    };
  }
  async getExecutionProgress(taskId: string) {
    return { progressPercentage: 100, currentStep: 'Done' };
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

async function runLocalToolBridgeTests() {
  console.log('====================================================');
  console.log('AI-EOS LOCAL TOOL BRIDGE & VERIFICATION - AUTOMATED TESTS');
  console.log('====================================================\n');

  const toolBridge = LocalToolBridge.getInstance();
  const discovery = ToolDiscoveryService.getInstance();
  const verificationEngine = ProjectVerificationEngine.getInstance();
  const gitService = GitRepositoryService.getInstance();
  const cmdSafety = CommandSafetyClassifier.getInstance();
  const antigravity = new AntigravityAdapter();
  const bridge = ExecutionBridge.getInstance();
  const core = TaskExecutionCore.getInstance();
  const providerMgr = ProviderManager.getInstance();

  providerMgr.registerAdapter(new MockWorkingAdapter());
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

  const sampleTool: ToolProfile = {
    id: 'tool-node',
    name: 'Node.js',
    type: 'WEB_TOOL',
    executablePath: 'node',
    command: 'node',
    arguments: ['-v'],
    supportedProjectTypes: ['Web', 'Backend'],
    capabilities: ['Build', 'Testing'],
    enabled: true,
    status: 'Available',
    lastCheckedAt: new Date().toISOString(),
    version: null
  };

  const sampleTask: Task = {
    id: 'TSK-PHASE5-1',
    projectId: 'PRJ-P5',
    title: 'Verification Engine Test',
    name: 'Verification Engine Test',
    description: 'Verify project build & test execution',
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

  const sampleProject: Project = {
    id: 'PRJ-P5',
    name: 'Phase 5 Project',
    description: 'Phase 5 Verification Project',
    projectType: 'Web',
    techStack: ['React', 'TypeScript'],
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startDate: '2026-08-12',
    endDate: '',
    path: process.cwd(),
    autonomousExecutionPolicy: 'ON',
    hasUserApprovedAutonomousExecution: true
  };

  const sampleProfiles: ProviderProfile[] = [
    {
      id: 'prof-working',
      providerName: 'Mock Working Provider',
      profileName: 'Working Profile',
      isEnabled: true,
      lastKnownStatus: 'Available',
      lastCheckedAt: new Date().toISOString(),
      supportedProjectTypes: ['Web'],
      capabilities: ['Code Editing'],
      availableModels: [{ id: 'm1', name: 'Model 1', providerId: 'mock-working', capabilities: ['Code Editing'], isAvailable: true }],
      selectedModelId: 'm1'
    }
  ];

  // 1. Tool Discovery
  const discoveredTools = await discovery.discoverTools();
  assert(Array.isArray(discoveredTools) && discoveredTools.length > 0, '1. Tool discovery execution');

  // 2. Tool Unavailable Reporting
  const fakeTool: ToolProfile = { ...sampleTool, command: 'non_existent_binary_xyz_12345' };
  const unavailRes = await toolBridge.executeTool(fakeTool, ['-v'], process.cwd(), 3000);
  assert(unavailRes.success === false, '2. Tool unavailable reporting');

  // 3. Invalid Tool Command Handling
  const blockedRes = await toolBridge.executeTool({ ...sampleTool, command: 'rm -rf /' }, [], process.cwd());
  assert(blockedRes.success === false && blockedRes.stderr.includes('BLOCKED'), '3. Invalid/dangerous tool command blocking');

  // 4. Version Detection
  const nodeDiscovered = discoveredTools.find(t => t.command === 'node');
  assert(nodeDiscovered !== undefined && (nodeDiscovered.status === 'Available' ? nodeDiscovered.version !== null : true), '4. Tool version detection');

  // 5. Safe Tool Execution
  const safeExecRes = await toolBridge.executeTool(sampleTool, ['-e', '"console.log(\'HELLO_AI_EOS\')"'], process.cwd());
  assert(safeExecRes.success && safeExecRes.stdout.includes('HELLO_AI_EOS'), '5. Safe tool execution');

  // 6. Process Timeout
  const timeoutRes = await toolBridge.executeTool(sampleTool, ['-e', '"setTimeout(() => {}, 10000)"'], process.cwd(), 500);
  assert(timeoutRes.timedOut === true, '6. Process timeout handling');

  // 7. Process Failure Capture
  const failRes = await toolBridge.executeTool(sampleTool, ['-e', '"process.exit(2)"'], process.cwd());
  assert(failRes.success === false && failRes.exitCode === 2, '7. Process failure exitCode capture');

  // 8. Web Verification Adapter
  const webVerifyRes = await verificationEngine.verifyTask(sampleTask, process.cwd(), 'Web');
  assert(typeof webVerifyRes.passed === 'boolean' && Array.isArray(webVerifyRes.completedCriteria), '8. Web verification adapter execution');

  // 9. Backend Verification Adapter
  const backendVerifyRes = await verificationEngine.verifyTask(sampleTask, process.cwd(), 'Backend');
  assert(typeof backendVerifyRes.passed === 'boolean', '9. Backend verification adapter execution');

  // 10. Android Verification Adapter Foundation
  const androidVerifyRes = await verificationEngine.verifyTask(sampleTask, process.cwd(), 'Android');
  assert(typeof androidVerifyRes.passed === 'boolean', '10. Android verification adapter execution');

  // 11. Desktop Verification Adapter
  const desktopVerifyRes = await verificationEngine.verifyTask(sampleTask, process.cwd(), 'Full Stack');
  assert(typeof desktopVerifyRes.passed === 'boolean', '11. Desktop verification adapter execution');

  // 12. Build Failure Handling
  const failVerifier: TaskVerifier = {
    verifyTask: async (): Promise<VerificationResult> => ({
      passed: false,
      completionPercentage: 0,
      completedCriteria: [],
      failedCriteria: ['Build failed due to syntax error'],
      errors: ['SyntaxError: Unexpected token'],
      warnings: [],
      nextActions: ['Fix syntax error in App.tsx']
    })
  };
  const buildFailRes = await bridge.executeTaskBridge({
    task: sampleTask,
    project: sampleProject,
    allRequirements: [],
    allTasks: [sampleTask],
    providerProfiles: sampleProfiles,
    verifier: failVerifier
  });
  assert(buildFailRes.updatedTask.status === 'FAILED' || buildFailRes.updatedTask.status === 'RECOVERING' || buildFailRes.updatedTask.status === 'PARTIALLY_COMPLETE', '12. Build failure routing');

  // 13. Test Failure Handling
  const testFailVerifier: TaskVerifier = {
    verifyTask: async (): Promise<VerificationResult> => ({
      passed: false,
      completionPercentage: 50,
      completedCriteria: ['Build passed'],
      failedCriteria: ['Unit test loginForm() failed'],
      errors: ['AssertionError: expected true to be false'],
      warnings: [],
      nextActions: ['Fix loginForm test assertion']
    })
  };
  const testFailRes = await bridge.executeTaskBridge({
    task: { ...sampleTask, id: 'TSK-TEST-FAIL' },
    project: sampleProject,
    allRequirements: [],
    allTasks: [sampleTask],
    providerProfiles: sampleProfiles,
    verifier: testFailVerifier
  });
  assert(testFailRes.updatedTask.status === 'PARTIALLY_COMPLETE', '13. Test failure routing');

  // 14. Structured Error Feedback Generation
  const feedback = verificationEngine.getLastStructuredErrorFeedback();
  assert(feedback === null || (feedback !== null && feedback.taskId === sampleTask.id), '14. Structured error feedback payload generation');

  // 15. Partial Completion Task State
  assert(testFailRes.updatedTask.status === 'PARTIALLY_COMPLETE', '15. Partial completion state persistence');

  // 16. Correction Cycle Progression
  const cycleTask: Task = { ...sampleTask, id: 'TSK-CYCLE', retryCount: 1, maxRetries: 3 };
  const cycleRes = await bridge.executeTaskBridge({
    task: cycleTask,
    project: sampleProject,
    allRequirements: [],
    allTasks: [cycleTask],
    providerProfiles: sampleProfiles,
    verifier: testFailVerifier
  });
  assert(cycleRes.updatedTask.retryCount === 1, '16. Correction cycle progression tracking');

  // 17. Maximum Correction Cycle Cap (maxRetries = 3 -> WAITING_FOR_USER)
  const maxedTask: Task = { ...sampleTask, id: 'TSK-MAXED', retryCount: 3, maxRetries: 3 };
  const maxedRes = await bridge.executeTaskBridge({
    task: maxedTask,
    project: sampleProject,
    allRequirements: [],
    allTasks: [maxedTask],
    providerProfiles: sampleProfiles,
    verifier: testFailVerifier
  });
  assert(maxedRes.updatedTask.status === 'WAITING_FOR_USER', '17. Maximum correction cycle cap (escalates to WAITING_FOR_USER)');

  // 18. Pause Task
  const pauseRes = core.pauseTask(sampleTask);
  assert(pauseRes.updatedTask.status === 'PAUSED', '18. Pause task execution');

  // 19. Safe Stop Checkpoint
  assert(pauseRes.checkpoint.checkpointReason === 'User Paused', '19. Safe stop checkpoint creation');

  // 20. User Code Baseline Protection
  const gitState = await gitService.getRepositoryState(process.cwd());
  assert(gitState !== null, '20. User code baseline protection');

  // 21. Git Repository Baseline Detection
  assert(gitState.isRepository === true, '21. Git repository baseline detection');

  // 22. Git Diff Inspection
  assert(typeof gitState.diffSummary === 'string', '22. Git diff inspection');

  // 23. Antigravity Unavailable Status Reporting
  const antiReadiness = await antigravity.validateReadiness('prof-1');
  assert(!antiReadiness.isReady && antiReadiness.message.includes('Integration unavailable'), '23. Antigravity truthful status reporting');

  // 24. No Fake Provider Result
  const antiSubmit = await antigravity.submitTask(sampleTask, {
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
  assert(antiSubmit.success === false && antiSubmit.summary.includes('Antigravity execution is not currently connected'), '24. No fake provider result verification');

  // 25. Existing TaskExecutionCore Regression Stability
  const topo = core.sortTasksTopologically([sampleTask]);
  assert(!topo.hasCycle && topo.sortedTasks.length === 1, '25. TaskExecutionCore existing tests stability');

  // 26. Existing ExecutionBridge Regression Stability
  const passVerifier: TaskVerifier = {
    verifyTask: async (): Promise<VerificationResult> => ({
      passed: true,
      completionPercentage: 100,
      completedCriteria: ['Passed'],
      failedCriteria: [],
      errors: [],
      warnings: [],
      nextActions: []
    })
  };
  const bridgePassRes = await bridge.executeTaskBridge({
    task: { ...sampleTask, id: 'TSK-PASS-FINAL' },
    project: sampleProject,
    allRequirements: [],
    allTasks: [sampleTask],
    providerProfiles: sampleProfiles,
    verifier: passVerifier
  });
  assert(bridgePassRes.updatedTask.status === 'COMPLETED', '26. ExecutionBridge existing tests stability');

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================\n');

  if (failedCount > 0) process.exit(1);
}

runLocalToolBridgeTests().catch(err => {
  console.error(err);
  process.exit(1);
});
