import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { GitRepoState, CommitPlan, PushPolicy } from '@/types';
import { GitRepositoryService } from '@/services/GitRepositoryService';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GitBranch, GitCommit, UploadCloud, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';

export function GitIntelligencePanel({ projectId }: { projectId: string }) {
  const { projects, updateProject } = useAppStore();
  const project = projects.find(p => p.id === projectId);

  const [gitState, setGitState] = useState<GitRepoState | null>(null);
  const [githubUrlInput, setGithubUrlInput] = useState(project?.githubUrl || '');
  const [pushPolicy, setPushPolicy] = useState<PushPolicy>(project?.pushPolicy || 'ASK_BEFORE_PUSH');
  const [isLoading, setIsLoading] = useState(false);
  const [urlMessage, setUrlMessage] = useState<string | null>(null);

  const refreshGit = async () => {
    if (!project?.path) return;
    setIsLoading(true);
    try {
      const state = await GitRepositoryService.getInstance().getRepositoryState(project.path);
      setGitState(state);
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshGit();
  }, [projectId, project?.path]);

  const handleSaveGithubUrl = () => {
    const valRes = GitRepositoryService.getInstance().validateGithubUrl(githubUrlInput);
    if (!valRes.isValid) {
      setUrlMessage(`Error: ${valRes.error}`);
      return;
    }
    updateProject(projectId, { githubUrl: valRes.normalizedUrl });
    setUrlMessage(`GitHub URL connected: ${valRes.normalizedUrl}`);
  };

  const handlePolicyChange = (val: PushPolicy) => {
    setPushPolicy(val);
    updateProject(projectId, { pushPolicy: val });
  };

  return (
    <Card className="p-5 bg-card/50 backdrop-blur-md border-border/50 space-y-4">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-chart-2" />
          <h3 className="font-bold text-sm text-foreground">Git Intelligence & Repository Sync</h3>
        </div>
        <Button size="sm" variant="outline" onClick={refreshGit} disabled={isLoading} className="h-7 text-xs px-2">
          <RefreshCw className={`w-3 h-3 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Git
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* GitHub Connection */}
        <div className="space-y-3 bg-background/30 p-3 rounded border border-border/30">
          <Label className="text-[10px] uppercase font-semibold text-muted-foreground block">Project GitHub Repository</Label>
          <div className="flex gap-2">
            <Input
              value={githubUrlInput}
              onChange={(e) => setGithubUrlInput(e.target.value)}
              placeholder="https://github.com/user/repo.git"
              className="h-8 text-xs font-mono"
            />
            <Button size="sm" onClick={handleSaveGithubUrl} className="h-8 text-xs px-3">
              Save Remote
            </Button>
          </div>
          {urlMessage && (
            <span className={`text-[10px] block ${urlMessage.startsWith('Error') ? 'text-destructive' : 'text-green-500 font-medium'}`}>
              {urlMessage}
            </span>
          )}
          <div className="flex justify-between items-center pt-1 text-[11px]">
            <span className="text-muted-foreground">Push Policy:</span>
            <Select value={pushPolicy} onValueChange={handlePolicyChange}>
              <SelectTrigger className="h-7 text-xs w-[160px]">
                <SelectValue placeholder="Select policy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ASK_BEFORE_PUSH">Ask Before Push</SelectItem>
                <SelectItem value="AUTOMATIC">Automatic Push</SelectItem>
                <SelectItem value="MANUAL_ONLY">Manual Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Repository State Summary */}
        <div className="bg-background/30 p-3 rounded border border-border/30 font-mono text-xs space-y-1.5">
          <span className="text-[10px] uppercase font-semibold text-muted-foreground block font-sans">Repository Sync State</span>
          {gitState && gitState.isRepository ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Branch:</span>
                <span className="font-bold text-foreground">{gitState.currentBranch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">HEAD Commit:</span>
                <span className="text-foreground">{gitState.currentCommit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sync Status:</span>
                <Badge variant="outline" className={gitState.hasUncommittedChanges ? "border-yellow-500 text-yellow-500" : "border-green-500 text-green-500"}>
                  {gitState.syncState}
                </Badge>
              </div>
              <div className="text-[10px] text-muted-foreground truncate pt-1 border-t border-border/30 font-sans">
                Ahead: {gitState.aheadCount} | Behind: {gitState.behindCount} | Uncommitted: {gitState.uncommittedCount}
              </div>
            </>
          ) : (
            <div className="text-muted-foreground text-center py-3 font-sans">
              Not a Git repository or local folder path not set.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
