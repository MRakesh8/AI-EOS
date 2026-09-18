export type ProjectStatus = 'Active' | 'Paused' | 'Completed' | 'Archived';
export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';
export type AutonomousExecutionPolicy = 'OFF' | 'ON';
export type CommandSafetyClass = 'SAFE' | 'REQUIRES_APPROVAL' | 'BLOCKED';
export type PushPolicy = 'AUTOMATIC' | 'ASK_BEFORE_PUSH' | 'MANUAL_ONLY';

export type TaskExecutionStatus =
  | 'QUEUED'
  | 'PLANNING'
  | 'READY'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'PARTIALLY_COMPLETE'
  | 'RECOVERING'
  | 'WAITING_FOR_PROVIDER'
  | 'WAITING_FOR_USER'
  | 'COMPLETED'
  | 'FAILED'
  | 'PAUSED';

export type LegacyTaskStatus = 'Pending' | 'Ready' | 'In Progress' | 'Blocked' | 'Completed';
export type TaskStatus = TaskExecutionStatus | LegacyTaskStatus;

export type RequirementStatus = 'Draft' | 'Awaiting Clarification' | 'Approved' | 'In Development' | 'Verified' | 'Rejected';
export type RequirementCategory = 'Project Objective' | 'UI/Design' | 'Functional' | 'Technical' | 'Frontend' | 'Backend' | 'Database' | 'Authentication' | 'Security' | 'SEO' | 'Performance' | 'Deployment' | 'User Constraints';
export type NotificationType = 'Alert' | 'Success' | 'Info' | 'Warning';

export type ProviderStatus = 'Not Configured' | 'Unknown' | 'Available' | 'Working' | 'Limited' | 'Unavailable' | 'Authentication Required' | 'Network Failure' | 'Busy';
export type FailoverPolicy = 'Ask Before Switching' | 'Automatically Switch' | 'Never Switch';
export type FailureReason = 'Usage Limit' | 'Authentication Required' | 'Provider Unavailable' | 'Network Failure' | 'Provider Busy' | 'Tool Failure' | 'Code/Build Failure';
export type ProjectType = 'Web' | 'Android' | 'Backend' | 'Full Stack' | 'Python' | 'Other';
export type ProviderCapability = 'Code Editing' | 'Terminal' | 'Filesystem' | 'Browser' | 'Git' | 'Build' | 'Testing';

export interface ProviderModel {
  id: string;
  name: string;
  providerId: string;
  capabilities: ProviderCapability[];
  isAvailable: boolean;
}

export interface ProviderProfile {
  id: string;
  providerName: string;
  profileName: string;
  isEnabled: boolean;
  lastKnownStatus: ProviderStatus;
  lastCheckedAt: string | null;
  supportedProjectTypes: ProjectType[];
  capabilities: ProviderCapability[];
  availableModels?: ProviderModel[];
  selectedModelId?: string | null;
}

export type ToolType = 'CODING_AGENT' | 'BUILD_TOOL' | 'TEST_TOOL' | 'ANDROID_TOOL' | 'WEB_TOOL' | 'CUSTOM';
export type ToolStatus = 'Available' | 'Unavailable' | 'Not Configured' | 'Invalid Path' | 'Authentication Required' | 'Version Unknown';

export interface ToolProfile {
  id: string;
  name: string;
  type: ToolType;
  executablePath: string;
  command: string;
  arguments: string[];
  supportedProjectTypes: ProjectType[];
  capabilities: ProviderCapability[];
  enabled: boolean;
  status: ToolStatus;
  lastCheckedAt: string | null;
  version: string | null;
}

export interface LocalToolResult {
  success: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
  startedAt: string;
  completedAt: string;
  commandExecuted: string;
}

export interface StructuredErrorFeedback {
  taskId: string;
  requirementTitle: string;
  failedCriteria: string[];
  commandExecuted: string;
  exitCode: number | null;
  stderr: string;
  stdoutSummary: string;
  affectedFiles: string[];
  workspaceDiffSummary: string;
  likelyFailureArea: string;
  nextRecommendedAction: string;
  createdAt: string;
}

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface RootCauseCandidate {
  cause: string;
  evidence: string;
  confidence: ConfidenceLevel;
  affectedFiles: string[];
  recommendedInvestigation: string;
  recommendedFix: string;
}

export interface RootCauseAnalysisReport {
  taskId: string;
  problem: string;
  evidenceQuotes: string[];
  candidates: RootCauseCandidate[];
  topCandidate: RootCauseCandidate | null;
  verificationRequired: string[];
  createdAt: string;
}

export interface FixInstruction {
  taskId: string;
  problemSummary: string;
  rootCause: string;
  affectedFiles: string[];
  specificInstructions: string[];
  constraints: string[];
  verificationSteps: string[];
  createdAt: string;
}

export interface GitRepoState {
  isRepository: boolean;
  remoteUrl: string | null;
  githubUrl: string | null;
  currentBranch: string;
  currentCommit: string;
  hasUncommittedChanges: boolean;
  uncommittedCount: number;
  stagedCount: number;
  untrackedCount: number;
  aheadCount: number;
  behindCount: number;
  syncState: string;
  diffSummary: string;
}

export interface CommitPlan {
  type: 'feat' | 'fix' | 'refactor' | 'test' | 'perf' | 'docs' | 'chore';
  scope: string;
  subject: string;
  fullMessage: string;
  changedFiles: string[];
  verificationStatus: string;
  diffSummary: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  projectId: string;
  taskId: string;
  requirementId: string | null;
  provider: string;
  account: string;
  model: string;
  action: string;
  commands: string[];
  filesChanged: string[];
  verification: string;
  rootCauseReport: RootCauseAnalysisReport | null;
  commitPlan: CommitPlan | null;
  commitResult: string | null;
  pushResult: string | null;
  errors: string[];
  recovery: string | null;
}

export interface VerificationResult {
  passed: boolean;
  completionPercentage: number;
  completedCriteria: string[];
  failedCriteria: string[];
  errors: string[];
  warnings: string[];
  nextActions: string[];
}

export interface TaskVerifier {
  verifyTask(task: Task, projectPath?: string, projectType?: ProjectType): Promise<VerificationResult>;
}

export interface TaskContinuationState {
  id: string;
  taskId: string;
  projectId: string;
  checkpointId: string;
  completed: string[];
  remaining: string[];
  errors: string[];
  nextActions: string[];
  inspectedAt: string;
}

export interface ExecutionCheckpoint {
  id: string;
  taskId: string;
  projectId: string;
  timestamp: string;
  currentStep: string;
  completedSteps: string[];
  remainingSteps: string[];
  providerProfileId: string | null;
  modelId: string | null;
  filesChanged: string[];
  verificationState: VerificationResult | null;
  retryCount: number;
  failoverCount: number;
  taskStatus: TaskExecutionStatus;
  gitState: { branch: string; commitHash: string; hasUncommittedChanges: boolean };
  buildStatus: 'Unknown' | 'Passing' | 'Failing';
  testStatus: 'Unknown' | 'Passing' | 'Failing';
  executionSummary: string;
  checkpointReason: string;
}

export type ExecutionErrorKind =
  | 'Network Failure'
  | 'Timeout'
  | 'MCP/Tool Failure'
  | 'Provider Failure'
  | 'Usage Limit'
  | 'Model Limit'
  | 'Authentication Required'
  | 'Build Failure'
  | 'Test Failure'
  | 'Unknown Failure';

export interface ExecutionError {
  id: string;
  taskId: string;
  kind: ExecutionErrorKind;
  message: string;
  timestamp: string;
  details?: any;
}

export type ExecutionEventType =
  | 'task_created'
  | 'task_started'
  | 'checkpoint_created'
  | 'task_paused'
  | 'task_resumed'
  | 'task_interrupted'
  | 'execution_failed'
  | 'verification_started'
  | 'verification_failed'
  | 'verification_passed'
  | 'task_partially_complete'
  | 'task_completed'
  | 'task_recovery_started'
  | 'provider_selected'
  | 'model_selected'
  | 'execution_started'
  | 'execution_progress'
  | 'command_started'
  | 'command_completed'
  | 'file_changed'
  | 'execution_warning'
  | 'execution_error'
  | 'provider_failed'
  | 'model_failed'
  | 'account_switch_requested'
  | 'provider_switch_requested'
  | 'execution_resumed'
  | 'verification_completed'
  | 'external_workspace_change'
  | 'rca_generated'
  | 'fix_instruction_generated'
  | 'commit_planned'
  | 'commit_executed'
  | 'push_executed';

export interface ExecutionEvent {
  id: string;
  taskId: string;
  projectId: string;
  type: ExecutionEventType;
  timestamp: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface ProviderUsageStatus {
  isAvailable: boolean;
  statusMessage: string;
}

export interface WorkspaceContext {
  projectPath: string;
  projectType: ProjectType;
  approvedRequirements: Requirement[];
  projectSpecification: string | null;
  currentTask: Task;
  acceptanceCriteria: string;
  taskDependencies: Task[];
  currentCheckpoint: ExecutionCheckpoint | null;
  gitState: { branch: string; commitHash: string; hasUncommittedChanges: boolean };
  relevantChangedFiles: string[];
  recentExecutionErrors: ExecutionError[];
  fixInstruction?: FixInstruction | null;
}

export interface ExecutionResult {
  success: boolean;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'INTERRUPTED' | 'CANCELLED';
  summary: string;
  changedFiles: string[];
  createdFiles: string[];
  deletedFiles: string[];
  commandsExecuted: string[];
  errors: ExecutionError[];
  warnings: string[];
  provider: string;
  profile: string;
  model: string;
  startedAt: string;
  completedAt: string;
}

export interface WorkspaceDiff {
  modifiedFiles: string[];
  addedFiles: string[];
  deletedFiles: string[];
  uncommittedChanges: boolean;
  baselineCommit: string;
  mismatches: string[];
  externalChangesDetected?: boolean;
}

export interface ProviderAdapter {
  providerId: string;
  providerName: string;
  validateReadiness(profileId: string): Promise<{ isReady: boolean; message: string }>;
  getModels(profileId: string): Promise<ProviderModel[]>;
  getCapabilities(profileId: string): Promise<ProviderCapability[]>;
  checkAvailability(profileId: string): Promise<boolean>;
  submitTask(task: Task, context: WorkspaceContext): Promise<ExecutionResult>;
  getExecutionProgress(taskId: string): Promise<{ progressPercentage: number; currentStep: string }>;
  getExecutionResult(taskId: string): Promise<ExecutionResult | null>;
  stopExecution(taskId: string): Promise<boolean>;
  getUsageStatus(profileId: string): Promise<ProviderUsageStatus>;
  classifyError(error: any): ExecutionErrorKind;
}

export interface AccountSwitchLog {
  id: string;
  projectId: string;
  timestamp: string;
  previousProvider: string;
  previousAccount: string;
  reason: FailureReason | 'User Manual Switch';
  newProvider: string;
  newAccount: string;
  taskId: string | null;
  checkpointId: string | null;
}

declare global {
  interface Window {
    electronAPI: {
      pickFolder: () => Promise<string | null>;
      ensureDir: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
      readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
      writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
      exists: (checkPath: string) => Promise<{ success: boolean; exists: boolean }>;
      watchProject: (path: string, projectId: string) => Promise<boolean>;
      stopWatching: () => Promise<boolean>;
      onWorkspaceEvent: (callback: (event: any) => void) => () => void;
    };
  }
}

export interface Project {
  id: string;
  name: string;
  description: string;
  projectType: ProjectType;
  techStack: string[];
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  startDate: string;
  endDate: string;
  path?: string;
  githubUrl?: string | null;
  pushPolicy?: PushPolicy;
  activeProfileId?: string;
  failoverPolicy?: FailoverPolicy;
  autonomousExecutionPolicy?: AutonomousExecutionPolicy;
  hasUserApprovedAutonomousExecution?: boolean;
}

export interface RequirementHistoryEntry {
  version: number;
  updatedAt: string;
  changes: string;
}

export interface Requirement {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: Priority;
  category: RequirementCategory;
  status: RequirementStatus;
  source: string;
  acceptanceCriteria: string;
  notes: string;
  version: number;
  history: RequirementHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  requirementId?: string | null;
  title: string;
  name: string;
  description: string;
  priority: Priority;
  status: TaskExecutionStatus;
  progress: number;
  acceptanceCriteria?: string;
  estimatedTime?: string;
  category?: string;
  dependencies: string[];
  currentProviderProfileId?: string | null;
  currentModelId?: string | null;
  checkpointId?: string | null;
  retryCount: number;
  maxRetries?: number;
  failoverCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  order: number;
  completedAt: string | null;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  projectId: string;
  type: 'project_created' | 'requirement_added' | 'task_created' | 'milestone_completed' | 'report_generated' | 'task_completed' | 'requirement_updated' | 'workspace_activity';
  title: string;
  description: string;
  timestamp: string;
  details?: any;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  projectId: string | null;
  read: boolean;
  createdAt: string;
}
