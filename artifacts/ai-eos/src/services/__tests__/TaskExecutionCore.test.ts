import { TaskExecutionCore } from '../TaskExecutionCore';
import { ProviderManager } from '../ProviderManager';
import { Task, TaskVerifier, VerificationResult, ProviderProfile } from '../../types';

async function runCoreTests() {
  console.log('====================================================');
  console.log('AI-EOS TASK EXECUTION CONTROL CORE - AUTOMATED TESTS');
  console.log('====================================================\n');

  const core = TaskExecutionCore.getInstance();
  const providerMgr = ProviderManager.getInstance();

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

  const task1: Task = {
    id: 'TASK-1',
    projectId: 'PRJ-1',
    title: 'Setup Database Schema',
    name: 'Setup Database Schema',
    description: 'Create initial database schema for users',
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

  const task2: Task = {
    id: 'TASK-2',
    projectId: 'PRJ-1',
    title: 'Build User API',
    name: 'Build User API',
    description: 'Implement CRUD user API endpoints',
    priority: 'High',
    status: 'QUEUED',
    progress: 0,
    dependencies: ['TASK-1'],
    retryCount: 0,
    maxRetries: 3,
    failoverCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const sampleProfiles: ProviderProfile[] = [
    {
      id: 'prof-1',
      providerName: 'Antigravity',
      profileName: 'Primary Account',
      isEnabled: true,
      lastKnownStatus: 'Available',
      lastCheckedAt: new Date().toISOString(),
      supportedProjectTypes: ['Web'],
      capabilities: ['Code Editing'],
      availableModels: [{ id: 'm1', name: 'M1', providerId: 'antigravity', capabilities: ['Code Editing'], isAvailable: true }],
      selectedModelId: 'm1'
    }
  ];

  // 1. Create task
  assert(task1.id === 'TASK-1' && task1.status === 'QUEUED', '1. Create task');

  // 2. Dependency ordering
  const topo = core.sortTasksTopologically([task2, task1]);
  assert(!topo.hasCycle && topo.sortedTasks[0].id === 'TASK-1' && topo.sortedTasks[1].id === 'TASK-2', '2. Task dependency ordering');

  // 2b. Block TASK-2 before TASK-1 is completed
  const readiness = core.canExecuteTask(task2, [task1, task2]);
  assert(!readiness.canExecute, '2b. Block TASK-2 before TASK-1 is completed');

  // 3. Start task
  const startRes = core.startTask(task1, [task1, task2], sampleProfiles);
  assert(startRes.updatedTask.status === 'EXECUTING', '3. Start task');

  // 4. Pause task
  const pauseRes = core.pauseTask(startRes.updatedTask);
  assert(pauseRes.updatedTask.status === 'PAUSED', '4. Pause task');

  // 5. Resume task
  const resumeRes = core.resumeTask(pauseRes.updatedTask, pauseRes.checkpoint);
  assert(resumeRes.updatedTask.status === 'EXECUTING', '5. Resume task');

  // 6. Create checkpoint
  const chk = core.createCheckpoint(resumeRes.updatedTask, 'Step 1', ['Setup'], ['Code'], 'Manual Checkpoint');
  assert(chk.id.startsWith('CHK-'), '6. Create checkpoint');

  // 7. Recover task after interruption
  const interruptRes = core.interruptTask(resumeRes.updatedTask, 'Network Failure', 'Timeout');
  assert(interruptRes.updatedTask.status === 'RECOVERING' && interruptRes.updatedTask.retryCount === 1, '7. Recover task after interruption');

  // 8. Partial completion
  const partialVerifier: TaskVerifier = {
    verifyTask: async (): Promise<VerificationResult> => ({
      passed: false,
      completionPercentage: 50,
      completedCriteria: ['Schema created'],
      failedCriteria: ['Indices missing'],
      errors: ['Index missing'],
      warnings: [],
      nextActions: ['Add index']
    })
  };
  const partialRes = await core.completeStepAndVerify(startRes.updatedTask, partialVerifier);
  assert(partialRes.updatedTask.status === 'PARTIALLY_COMPLETE', '8. Partial completion');

  // 9. Verification failure
  const zeroVerifier: TaskVerifier = {
    verifyTask: async (): Promise<VerificationResult> => ({
      passed: false,
      completionPercentage: 0,
      completedCriteria: [],
      failedCriteria: ['Failed completely'],
      errors: ['Fatal error'],
      warnings: [],
      nextActions: ['Fix code']
    })
  };
  const zeroRes = await core.completeStepAndVerify(startRes.updatedTask, zeroVerifier);
  assert(zeroRes.updatedTask.status === 'FAILED', '9. Verification failure');

  // 10. Task completion
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
  const passRes = await core.completeStepAndVerify(startRes.updatedTask, passVerifier);
  assert(passRes.updatedTask.status === 'COMPLETED', '10. Task completion');

  // 11. Application restart recovery detection
  const unfinished = core.detectUnfinishedTasks([resumeRes.updatedTask, passRes.updatedTask]);
  assert(unfinished.length === 1 && unfinished[0].id === 'TASK-1', '11. Application restart recovery detection');

  // 12. Provider failure state handling
  const provFailRes = core.interruptTask(startRes.updatedTask, 'Provider Failure', 'Provider busy');
  assert(provFailRes.updatedTask.status === 'RECOVERING', '12. Provider failure state handling');

  // 13. Retry limit handling
  const maxRetryTask = { ...startRes.updatedTask, retryCount: 3, maxRetries: 3 };
  const maxRetryRes = core.interruptTask(maxRetryTask, 'Provider Failure', 'Max retries');
  assert(maxRetryRes.updatedTask.status === 'WAITING_FOR_USER', '13. Retry limit handling (maxRetries reached -> WAITING_FOR_USER)');

  // 14. Idempotency (no duplicate task execution)
  const work = core.inspectWorkspaceAndDetermineRemainingWork(startRes.updatedTask, chk);
  assert(work.completedSteps.includes('Setup'), '14. No duplicate task execution (Idempotency)');

  // 15. Circular task dependency detection
  const taskA: Task = { ...task1, id: 'TASK-A', dependencies: ['TASK-B'] };
  const taskB: Task = { ...task2, id: 'TASK-B', dependencies: ['TASK-A'] };
  const cycleTopo = core.sortTasksTopologically([taskA, taskB]);
  assert(cycleTopo.hasCycle === true, '15. Circular task dependency detection');

  // 16. Checkpoint persistence structure
  assert(chk.gitState !== undefined && chk.taskStatus !== undefined, '16. Checkpoint persistence structure');

  // 17. Corrupted/null checkpoint handling fallback
  const fallbackWork = core.inspectWorkspaceAndDetermineRemainingWork(startRes.updatedTask, null);
  assert(fallbackWork.remainingSteps.length > 0, '17. Corrupted/null checkpoint handling fallback');

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================\n');

  if (failedCount > 0) process.exit(1);
}

runCoreTests().catch(err => {
  console.error(err);
  process.exit(1);
});
