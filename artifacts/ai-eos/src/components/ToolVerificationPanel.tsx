import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ToolProfile, GitRepoState, StructuredErrorFeedback } from '@/types';
import { ToolDiscoveryService } from '@/services/ToolDiscoveryService';
import { GitRepositoryService } from '@/services/GitRepositoryService';
import { ProjectVerificationEngine } from '@/services/ProjectVerificationEngine';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wrench, GitBranch, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';

export function ToolVerificationPanel({ projectId }: { projectId: string }) {
  const { projects, tasks } = useAppStore();
  const project = projects.find((p: any) => p.id === projectId);

  const [discoveredTools, setDiscoveredTools] = useState<ToolProfile[]>([]);
  const [gitState, setGitState] = useState<GitRepoState | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<StructuredErrorFeedback | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const projectTasks = tasks.filter((t: any) => t.projectId === projectId);
  const activeTask = projectTasks.find((t: any) =>
    ['EXECUTING', 'PLANNING', 'VERIFYING', 'RECOVERING', 'PARTIALLY_COMPLETE', 'PAUSED', 'WAITING_FOR_PROVIDER', 'WAITING_FOR_USER'].includes(t.status)
  ) || null;

  const refreshPanel = async () => {
    setIsScanning(true);
    try {
      const tools = await ToolDiscoveryService.getInstance().discoverTools();
      setDiscoveredTools(tools);

      if (project?.path) {
        const repoState = await GitRepositoryService.getInstance().getRepositoryState(project.path);
        setGitState(repoState);
      }

      const feedback = ProjectVerificationEngine.getInstance().getLastStructuredErrorFeedback();
      setErrorFeedback(feedback);
    } catch (e) {
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    refreshPanel();
  }, [projectId, project?.path]);

  return (
    <Card className="p-5 bg-card/50 backdrop-blur-md border-border/50 space-y-4">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm text-foreground">Local Tool Bridge & Project Verification</h3>
        </div>
        <Button size="sm" variant="outline" onClick={refreshPanel} disabled={isScanning} className="h-7 text-xs px-2">
          <RefreshCw className={`w-3 h-3 mr-1.5 ${isScanning ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="space-y-2 bg-background/30 p-3 rounded border border-border/30">
          <span className="text-muted-foreground block text-[10px] uppercase font-semibold flex items-center justify-between">
            <span>Discovered System Tools</span>
            <span>{discoveredTools.filter(t => t.status === 'Available').length} Available</span>
          </span>
          <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
            {discoveredTools.map(tool => (
              <div key={tool.id} className="p-2 rounded bg-card/60 border border-border/40 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-foreground text-[11px] truncate">{tool.name}</span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] px-1 py-0 ${
                      tool.status === 'Available' ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-muted-foreground text-muted-foreground'
                    }`}
                  >
                    {tool.status}
                  </Badge>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground truncate mt-1">
                  {tool.version || 'Version Unknown'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 bg-background/30 p-3 rounded border border-border/30 flex flex-col justify-between">
          <span className="text-muted-foreground block text-[10px] uppercase font-semibold flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-chart-2" />
            <span>Git Repository Baseline</span>
          </span>

          {gitState && gitState.isRepository ? (
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Branch:</span>
                <span className="font-bold text-foreground">{gitState.currentBranch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Commit:</span>
                <span className="text-foreground">{gitState.currentCommit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uncommitted Changes:</span>
                <Badge variant="outline" className={gitState.hasUncommittedChanges ? "border-yellow-500 text-yellow-500" : "border-green-500 text-green-500"}>
                  {gitState.uncommittedCount} files
                </Badge>
              </div>
              <div className="text-[10px] text-muted-foreground truncate pt-1 border-t border-border/30">
                Summary: {gitState.diffSummary}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground text-center py-4">
              <span>Not a Git repository or path not initialized.</span>
            </div>
          )}
        </div>
      </div>

      {activeTask && (
        <div className="bg-muted/20 p-3 rounded border border-border/30 text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-muted-foreground uppercase text-[10px]">Correction Loop Status</span>
            <Badge variant="outline" className="font-mono text-[10px] border-primary text-primary">
              Correction Cycle: {activeTask.retryCount} / {activeTask.maxRetries || 3}
            </Badge>
          </div>

          {errorFeedback ? (
            <div className="bg-destructive/10 border border-destructive/30 rounded p-2.5 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-destructive">
                <ShieldAlert className="w-4 h-4" />
                <span>Structured Error Feedback Payload</span>
              </div>
              <div><span className="font-semibold text-muted-foreground">Failed Criteria:</span> {errorFeedback.failedCriteria.join(', ')}</div>
              <div><span className="font-semibold text-muted-foreground">Command:</span> <code className="bg-background px-1 py-0.5 rounded text-[10px]">{errorFeedback.commandExecuted}</code></div>
              {errorFeedback.stderr && (
                <div className="bg-background/80 p-1.5 rounded font-mono text-[10px] text-destructive overflow-x-auto max-h-20">
                  {errorFeedback.stderr.slice(0, 300)}
                </div>
              )}
              <div><span className="font-semibold text-muted-foreground">Recommended Fix:</span> {errorFeedback.nextRecommendedAction}</div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              <span>No active verification failures recorded. Verification ready.</span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
