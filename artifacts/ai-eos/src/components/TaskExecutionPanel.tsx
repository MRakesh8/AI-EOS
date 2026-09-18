import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Task, VerificationResult, TaskVerifier, AutonomousExecutionPolicy } from '@/types';
import { CommandSafetyClassifier } from '@/services/CommandSafetyClassifier';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Play, Pause, RotateCw, CheckCircle, ShieldAlert, Cpu, AlertTriangle, ShieldCheck, FileText, Square } from 'lucide-react';

export function TaskExecutionPanel({ projectId }: { projectId: string }) {
  const {
    tasks,
    providerProfiles,
    checkpoints,
    continuationStates,
    startTaskExecution,
    pauseTaskExecution,
    resumeTaskExecution,
    completeTaskVerificationStep,
    createCheckpoint,
    logAccountSwitch,
    updateProject,
    setAutonomousExecutionPolicy,
    approveAutonomousExecution,
    projects
  } = useAppStore();

  const currentProject = projects.find((p: any) => p.id === projectId);
  const executionPolicy: AutonomousExecutionPolicy = currentProject?.autonomousExecutionPolicy || 'OFF';
  const isHumanApproved = currentProject?.hasUserApprovedAutonomousExecution || false;

  const projectTasks = tasks.filter((t: any) => t.projectId === projectId);
  const activeTask = projectTasks.find((t: any) =>
    ['EXECUTING', 'PLANNING', 'VERIFYING', 'RECOVERING', 'PARTIALLY_COMPLETE', 'PAUSED', 'WAITING_FOR_PROVIDER', 'WAITING_FOR_USER'].includes(t.status)
  ) || projectTasks.find((t: any) => t.status === 'READY' || t.status === 'QUEUED') || null;

  const activeProfile = activeTask?.currentProviderProfileId
    ? providerProfiles.find((p: any) => p.id === activeTask.currentProviderProfileId)
    : providerProfiles.find((p: any) => p.isEnabled) || null;

  const latestCheckpoint = activeTask?.checkpointId
    ? checkpoints.find((c: any) => c.id === activeTask.checkpointId)
    : checkpoints.filter((c: any) => c.taskId === activeTask?.id).slice(-1)[0] || null;

  const continuationState = activeTask
    ? continuationStates.find((c: any) => c.taskId === activeTask.id) || null
    : null;

  const [isVerifying, setIsVerifying] = useState(false);

  const handleTogglePolicy = (checked: boolean) => {
    const newPolicy: AutonomousExecutionPolicy = checked ? 'ON' : 'OFF';
    setAutonomousExecutionPolicy(projectId, newPolicy);
  };

  const handleApproveExecution = () => {
    approveAutonomousExecution(projectId);
  };

  const handleSimulateLimit = async () => {
    if (!activeTask) return alert('No active task to simulate limit on.');
    if (!activeProfile) return alert('No active profile configured.');

    await createCheckpoint({
      taskId: activeTask.id,
      projectId: activeTask.projectId,
      providerProfileId: activeProfile.id,
      modelId: activeProfile.selectedModelId || null,
      taskStatus: activeTask.status,
      currentStep: 'Simulated Step',
      completedSteps: ['Pre-check'],
      remainingSteps: ['Execute changes'],
      filesChanged: [],
      verificationState: null,
      retryCount: activeTask.retryCount + 1,
      failoverCount: activeTask.failoverCount + 1,
      gitState: { branch: 'main', commitHash: 'simulated', hasUncommittedChanges: false },
      buildStatus: 'Passing',
      testStatus: 'Passing',
      executionSummary: '[DEV TEST ONLY] Simulated usage limit reached',
      checkpointReason: '[DEV TEST ONLY] Limit Reached'
    });

    const backup = providerProfiles.find(p => p.id !== activeProfile.id && p.isEnabled);
    if (backup) {
      const confirmSwitch = confirm(`[DEV TEST ONLY] Limit Reached!\n\nBackup provider found: ${backup.providerName} (${backup.profileName})\nSwitch to backup account?`);
      if (confirmSwitch) {
        await logAccountSwitch({
          projectId: activeTask.projectId,
          previousProvider: activeProfile.providerName,
          previousAccount: activeProfile.profileName,
          reason: 'Usage Limit',
          newProvider: backup.providerName,
          newAccount: backup.profileName,
          taskId: activeTask.id,
          checkpointId: latestCheckpoint?.id || null
        });
        if (currentProject) {
          updateProject(currentProject.id, { activeProfileId: backup.id });
        }
        alert('[DEV TEST ONLY] Switched provider account. Resume task to continue.');
      }
    } else {
      alert('[DEV TEST ONLY] No backup provider available. Task paused.');
    }
  };

  const handleSimulatedVerify = async (passed: boolean) => {
    if (!activeTask) return;
    setIsVerifying(true);

    const dummyVerifier: TaskVerifier = {
      verifyTask: async (task: Task): Promise<VerificationResult> => {
        if (passed) {
          return {
            passed: true,
            completionPercentage: 100,
            completedCriteria: [task.acceptanceCriteria || 'Requirements satisfied'],
            failedCriteria: [],
            errors: [],
            warnings: [],
            nextActions: []
          };
        } else {
          return {
            passed: false,
            completionPercentage: 50,
            completedCriteria: ['Initial setup completed'],
            failedCriteria: ['Unit tests failed'],
            errors: ['Syntax error in generated component'],
            warnings: ['Performance threshold warning'],
            nextActions: ['Inspect codebase and re-run step']
          };
        }
      }
    };

    await completeTaskVerificationStep(activeTask.id, dummyVerifier);
    setIsVerifying(false);
  };

  if (!activeTask) {
    return (
      <Card className="p-6 bg-card/40 border-border/50 text-center space-y-3">
        <Cpu className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
        <h3 className="text-sm font-semibold text-foreground">Task Execution Control Core</h3>
        <p className="text-xs text-muted-foreground">No active task running in queue.</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Label htmlFor="policy-toggle-empty" className="text-xs text-muted-foreground font-semibold">Autonomous Execution:</Label>
          <Switch id="policy-toggle-empty" checked={executionPolicy === 'ON'} onCheckedChange={handleTogglePolicy} />
          <Badge variant="outline" className={executionPolicy === 'ON' ? "border-green-500 text-green-500" : "border-muted-foreground"}>
            {executionPolicy}
          </Badge>
        </div>
      </Card>
    );
  }

  const sampleCmdSafety = CommandSafetyClassifier.getInstance().classifyCommand('npm test');

  return (
    <Card className="p-5 bg-card/50 backdrop-blur-md border-border/50 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-border/50 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px]">{activeTask.id}</Badge>
            <h3 className="font-bold text-base text-foreground truncate max-w-[350px]">{activeTask.title || activeTask.name}</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[450px]">{activeTask.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`font-semibold text-xs px-2.5 py-1 ${
              activeTask.status === 'COMPLETED' ? 'border-green-500 text-green-500 bg-green-500/10' :
              activeTask.status === 'EXECUTING' || activeTask.status === 'PLANNING' ? 'border-primary text-primary bg-primary/10' :
              activeTask.status === 'PAUSED' ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' :
              activeTask.status === 'PARTIALLY_COMPLETE' ? 'border-orange-500 text-orange-500 bg-orange-500/10' :
              activeTask.status === 'FAILED' ? 'border-destructive text-destructive bg-destructive/10' :
              'border-muted-foreground text-muted-foreground'
            }`}
          >
            {activeTask.status}
          </Badge>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleSimulateLimit}
            className="text-[10px] h-7 px-2 font-mono"
            title="Development test button for provider limit failover testing (DEV TEST ONLY)"
          >
            [DEV TEST ONLY] Limit Reached
          </Button>
        </div>
      </div>

      {/* Policy & Approval Control Bar */}
      <div className="flex flex-wrap items-center justify-between bg-muted/20 p-2.5 rounded border border-border/30 text-xs gap-2">
        <div className="flex items-center gap-3">
          <Label htmlFor="policy-toggle" className="font-semibold text-muted-foreground">Autonomous Execution Policy:</Label>
          <Switch id="policy-toggle" checked={executionPolicy === 'ON'} onCheckedChange={handleTogglePolicy} />
          <Badge variant="outline" className={executionPolicy === 'ON' ? "border-green-500 text-green-500 bg-green-500/10" : "border-muted-foreground"}>
            {executionPolicy}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Human Approval:</span>
          <Badge variant="outline" className={isHumanApproved ? "border-green-500 text-green-500" : "border-yellow-500 text-yellow-500"}>
            {isHumanApproved ? "Approved" : "Pending"}
          </Badge>
          {!isHumanApproved && (
            <Button size="sm" variant="outline" onClick={handleApproveExecution} className="h-6 text-[10px] px-2">
              <ShieldCheck className="w-3 h-3 mr-1 text-green-500" /> Approve Execution
            </Button>
          )}
        </div>
      </div>

      {/* Grid Status Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-background/40 p-2.5 rounded border border-border/30">
          <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Provider & Model</span>
          <span className="font-medium text-foreground truncate block">
            {activeProfile ? `${activeProfile.providerName} (${activeProfile.profileName})` : 'Not Available'}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            Model: {activeTask.currentModelId || activeProfile?.selectedModelId || 'Not Available'}
          </span>
        </div>

        <div className="bg-background/40 p-2.5 rounded border border-border/30">
          <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Checkpoint</span>
          <span className="font-mono text-foreground truncate block">
            {latestCheckpoint ? latestCheckpoint.id : 'None'}
          </span>
          <span className="text-[10px] text-muted-foreground truncate block">
            {latestCheckpoint ? latestCheckpoint.checkpointReason : 'No checkpoint created'}
          </span>
        </div>

        <div className="bg-background/40 p-2.5 rounded border border-border/30">
          <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Retry / Failover</span>
          <span className="font-mono text-foreground font-bold block">
            Retries: {activeTask.retryCount} / {activeTask.maxRetries || 3}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            Failover Count: {activeTask.failoverCount}
          </span>
        </div>

        <div className="bg-background/40 p-2.5 rounded border border-border/30">
          <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Command Safety Status</span>
          <Badge variant="outline" className="mt-1 border-green-500 text-green-500 text-[10px]">
            {sampleCmdSafety}
          </Badge>
        </div>
      </div>

      {/* Verification & Continuation State Display */}
      {continuationState && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded p-3 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-orange-500">
            <AlertTriangle className="w-4 h-4" />
            <span>Task Partially Complete (Continuation State Active)</span>
          </div>
          <div><span className="font-semibold text-muted-foreground">Completed Criteria:</span> {continuationState.completed.join(', ') || 'None'}</div>
          <div><span className="font-semibold text-muted-foreground">Remaining Work:</span> {continuationState.remaining.join(', ') || 'None'}</div>
          {continuationState.nextActions.length > 0 && (
            <div><span className="font-semibold text-muted-foreground">Next Recommended Action:</span> {continuationState.nextActions.join('; ')}</div>
          )}
        </div>
      )}

      {/* Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => alert('Execution Plan: Tasks, dependencies, and requirements analyzed.')}>
            <FileText className="w-3.5 h-3.5 mr-1.5" /> Plan
          </Button>

          {activeTask.status !== 'EXECUTING' && activeTask.status !== 'PAUSED' && (
            <Button size="sm" onClick={() => startTaskExecution(activeTask.id)}>
              <Play className="w-3.5 h-3.5 mr-1.5" /> Start Task
            </Button>
          )}

          {activeTask.status === 'EXECUTING' && (
            <Button size="sm" variant="outline" onClick={() => pauseTaskExecution(activeTask.id)}>
              <Pause className="w-3.5 h-3.5 mr-1.5 text-yellow-500" /> Pause
            </Button>
          )}

          {activeTask.status === 'PAUSED' && (
            <Button size="sm" variant="default" onClick={() => resumeTaskExecution(activeTask.id)}>
              <RotateCw className="w-3.5 h-3.5 mr-1.5" /> Resume Task
            </Button>
          )}

          <Button size="sm" variant="secondary" onClick={() => pauseTaskExecution(activeTask.id)}>
            <Square className="w-3.5 h-3.5 mr-1.5 text-destructive" /> Stop Safely
          </Button>

          {activeTask.status === 'EXECUTING' && (
            <>
              <Button size="sm" variant="secondary" disabled={isVerifying} onClick={() => handleSimulatedVerify(true)}>
                <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-green-500" /> Verify Pass
              </Button>
              <Button size="sm" variant="secondary" disabled={isVerifying} onClick={() => handleSimulatedVerify(false)}>
                <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-orange-500" /> Verify Partial
              </Button>
            </>
          )}
        </div>

        <div className="text-[11px] text-muted-foreground">
          Dependencies: {activeTask.dependencies && activeTask.dependencies.length > 0 ? activeTask.dependencies.join(', ') : 'None'}
        </div>
      </div>
    </Card>
  );
}
