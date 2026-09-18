import { GitRepoState, ToolProfile, PushPolicy, CommitPlan } from '../types';
import { LocalToolBridge } from './LocalToolBridge';

export class GitRepositoryService {
  private static instance: GitRepositoryService;

  private constructor() {}

  public static getInstance(): GitRepositoryService {
    if (!GitRepositoryService.instance) {
      GitRepositoryService.instance = new GitRepositoryService();
    }
    return GitRepositoryService.instance;
  }

  private getGitTool(): ToolProfile {
    return {
      id: 'tool-git',
      name: 'Git CLI',
      type: 'CUSTOM',
      executablePath: 'git',
      command: 'git',
      arguments: [],
      supportedProjectTypes: ['Web', 'Android', 'Backend', 'Full Stack', 'Python'],
      capabilities: ['Git'],
      enabled: true,
      status: 'Available',
      lastCheckedAt: new Date().toISOString(),
      version: null
    };
  }

  public validateGithubUrl(url: string): { isValid: boolean; normalizedUrl?: string; error?: string } {
    if (!url || typeof url !== 'string') {
      return { isValid: false, error: 'URL must be a non-empty string' };
    }
    const trimmed = url.trim();
    const githubRegex = /^(https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(\.git)?|git@github\.com:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\.git)$/;

    if (!githubRegex.test(trimmed)) {
      return { isValid: false, error: 'Invalid GitHub repository URL format. Example: https://github.com/user/repo.git' };
    }

    const normalizedUrl = trimmed.endsWith('.git') ? trimmed : `${trimmed}.git`;
    return { isValid: true, normalizedUrl };
  }

  public async getRepositoryState(projectPath: string = process.cwd()): Promise<GitRepoState> {
    const bridge = LocalToolBridge.getInstance();
    const gitTool = this.getGitTool();

    const revRes = await bridge.executeTool(gitTool, ['rev-parse', '--is-inside-work-tree'], projectPath);
    if (!revRes.success || revRes.stdout.trim() !== 'true') {
      return {
        isRepository: false,
        remoteUrl: null,
        githubUrl: null,
        currentBranch: 'none',
        currentCommit: 'none',
        hasUncommittedChanges: false,
        uncommittedCount: 0,
        stagedCount: 0,
        untrackedCount: 0,
        aheadCount: 0,
        behindCount: 0,
        syncState: 'Not a Git repository',
        diffSummary: 'Not a Git repository'
      };
    }

    const branchRes = await bridge.executeTool(gitTool, ['rev-parse', '--abbrev-ref', 'HEAD'], projectPath);
    const currentBranch = branchRes.success ? branchRes.stdout.trim() : 'main';

    const commitRes = await bridge.executeTool(gitTool, ['rev-parse', '--short', 'HEAD'], projectPath);
    const currentCommit = commitRes.success ? commitRes.stdout.trim() : 'HEAD';

    const remoteRes = await bridge.executeTool(gitTool, ['config', '--get', 'remote.origin.url'], projectPath);
    const remoteUrl = remoteRes.success ? remoteRes.stdout.trim() : null;
    const githubUrl = remoteUrl && remoteUrl.includes('github.com') ? remoteUrl : null;

    const statusRes = await bridge.executeTool(gitTool, ['status', '--porcelain'], projectPath);
    const statusLines = statusRes.success && statusRes.stdout.trim() ? statusRes.stdout.trim().split('\n') : [];
    const uncommittedCount = statusLines.length;

    let aheadCount = 0;
    let behindCount = 0;

    const countsRes = await bridge.executeTool(gitTool, ['rev-list', '--count', '--left-right', `@{upstream}...HEAD`], projectPath);
    if (countsRes.success && countsRes.stdout.trim()) {
      const parts = countsRes.stdout.trim().split(/\s+/);
      if (parts.length >= 2) {
        behindCount = parseInt(parts[0], 10) || 0;
        aheadCount = parseInt(parts[1], 10) || 0;
      }
    }

    const syncState = uncommittedCount > 0
      ? 'Dirty (Uncommitted Changes)'
      : aheadCount > 0
      ? `Ahead by ${aheadCount} commit(s)`
      : behindCount > 0
      ? `Behind by ${behindCount} commit(s)`
      : 'Synced';

    const diffRes = await bridge.executeTool(gitTool, ['diff', '--stat'], projectPath);
    const diffSummary = diffRes.success ? diffRes.stdout.trim() || 'Clean working tree' : 'Clean working tree';

    return {
      isRepository: true,
      remoteUrl,
      githubUrl,
      currentBranch,
      currentCommit,
      hasUncommittedChanges: uncommittedCount > 0,
      uncommittedCount,
      stagedCount: statusLines.filter(l => l.startsWith('M ') || l.startsWith('A ')).length,
      untrackedCount: statusLines.filter(l => l.startsWith('??')).length,
      aheadCount,
      behindCount,
      syncState,
      diffSummary
    };
  }

  public async executeCommit(projectPath: string, commitPlan: CommitPlan): Promise<{ success: boolean; commitHash?: string; message: string }> {
    const bridge = LocalToolBridge.getInstance();
    const gitTool = this.getGitTool();

    if (commitPlan.verificationStatus !== 'PASSED') {
      return { success: false, message: 'Commit rejected: Task verification must pass before committing changes.' };
    }

    const addRes = await bridge.executeTool(gitTool, ['add', '-A'], projectPath);
    if (!addRes.success) {
      return { success: false, message: `Git add failed: ${addRes.stderr}` };
    }

    const commitRes = await bridge.executeTool(gitTool, ['commit', '-m', `"${commitPlan.fullMessage.replace(/"/g, '\\"')}"`], projectPath);
    if (!commitRes.success) {
      return { success: false, message: `Git commit failed: ${commitRes.stderr}` };
    }

    const revRes = await bridge.executeTool(gitTool, ['rev-parse', '--short', 'HEAD'], projectPath);
    const commitHash = revRes.success ? revRes.stdout.trim() : 'HEAD';

    return {
      success: true,
      commitHash,
      message: `Committed ${commitPlan.changedFiles.length} file(s) with hash ${commitHash}`
    };
  }

  public async executePush(projectPath: string, pushPolicy: PushPolicy = 'ASK_BEFORE_PUSH'): Promise<{ success: boolean; message: string }> {
    if (pushPolicy === 'MANUAL_ONLY') {
      return { success: false, message: 'Push skipped: Push policy is set to MANUAL_ONLY.' };
    }

    const bridge = LocalToolBridge.getInstance();
    const gitTool = this.getGitTool();

    const pushRes = await bridge.executeTool(gitTool, ['push', 'origin', 'HEAD'], projectPath);
    if (!pushRes.success) {
      return { success: false, message: `Git push failed: ${pushRes.stderr}` };
    }

    return {
      success: true,
      message: 'Pushed commits to origin successfully.'
    };
  }
}
