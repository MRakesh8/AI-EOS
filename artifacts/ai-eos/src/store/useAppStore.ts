import { useState, useEffect } from 'react';
import {
  Project,
  Requirement,
  Task,
  Milestone,
  TimelineEvent,
  AppNotification,
  ProviderProfile,
  AccountSwitchLog,
  ExecutionCheckpoint,
  ExecutionEvent,
  TaskContinuationState,
  Priority,
  TaskExecutionStatus,
  TaskVerifier,
  AutonomousExecutionPolicy
} from '../types';
import { PersistenceService } from '../services/PersistenceService';
import { TaskExecutionCore } from '../services/TaskExecutionCore';

function getIso(): string {
  return new Date().toISOString();
}

export function create<T extends object>(initializer: (set: (fn: Partial<T> | ((state: T) => Partial<T>)) => void, get: () => T) => T) {
  let state: T;
  const listeners = new Set<() => void>();

  const setState = (partialOrFn: Partial<T> | ((state: T) => Partial<T>)) => {
    const nextPartial = typeof partialOrFn === 'function' ? (partialOrFn as any)(state) : partialOrFn;
    state = Object.assign({}, state, nextPartial);
    listeners.forEach((listener) => listener());
  };

  const getState = () => state;

  state = initializer(setState, getState);

  const useStore = () => {
    const [, setTick] = useState(0);
    useEffect(() => {
      const listener = () => setTick((t) => t + 1);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }, []);
    return state;
  };

  useStore.getState = getState;
  useStore.setState = setState;

  return useStore;
}

const defaultProfiles: ProviderProfile[] = [
  {
    id: 'prof-antigravity-1',
    providerName: 'Antigravity',
    profileName: 'Primary Account',
    isEnabled: true,
    lastKnownStatus: 'Available',
    lastCheckedAt: getIso(),
    supportedProjectTypes: ['Web', 'Android', 'Backend', 'Full Stack', 'Python', 'Other'],
    capabilities: ['Code Editing', 'Terminal', 'Filesystem', 'Git', 'Build', 'Testing'],
    availableModels: [
      { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', providerId: 'antigravity', capabilities: ['Code Editing', 'Terminal', 'Filesystem'], isAvailable: true },
      { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', providerId: 'antigravity', capabilities: ['Code Editing', 'Terminal', 'Filesystem'], isAvailable: true }
    ],
    selectedModelId: 'gemini-3.5-flash'
  },
  {
    id: 'prof-gemini-2',
    providerName: 'Gemini API',
    profileName: 'Backup Account',
    isEnabled: true,
    lastKnownStatus: 'Available',
    lastCheckedAt: getIso(),
    supportedProjectTypes: ['Web', 'Backend', 'Full Stack', 'Python'],
    capabilities: ['Code Editing', 'Terminal', 'Filesystem', 'Build'],
    availableModels: [
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', providerId: 'gemini', capabilities: ['Code Editing'], isAvailable: true }
    ],
    selectedModelId: 'gemini-1.5-pro'
  }
];

export interface AppState {
  projects: Project[];
  activeProjectId: string | null;
  requirements: Requirement[];
  tasks: Task[];
  milestones: Milestone[];
  timelineEvents: TimelineEvent[];
  notifications: AppNotification[];
  providerProfiles: ProviderProfile[];
  accountSwitchLogs: AccountSwitchLog[];
  checkpoints: ExecutionCheckpoint[];
  executionEvents: ExecutionEvent[];
  continuationStates: TaskContinuationState[];
  idCounters: {
    project: number;
    requirement: number;
    task: number;
    milestone: number;
    event: number;
    notification: number;
    log: number;
  };

  createProject: (input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProject: (id: string, changes: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  archiveProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;

  setRequirements: (requirements: Requirement[]) => void;
  addRequirement: (input: Omit<Requirement, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'history'>) => Promise<void>;
  updateRequirement: (id: string, changes: Partial<Omit<Requirement, 'id' | 'createdAt' | 'updatedAt' | 'history'>>) => Promise<void>;
  deleteRequirement: (id: string) => Promise<void>;

  addTask: (input: Partial<Task> & { projectId: string; description: string; priority: Priority }) => Promise<void>;
  updateTask: (id: string, changes: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => void;

  startTaskExecution: (taskId: string) => Promise<void>;
  pauseTaskExecution: (taskId: string) => Promise<void>;
  resumeTaskExecution: (taskId: string) => Promise<void>;
  completeTaskVerificationStep: (taskId: string, verifier: TaskVerifier) => Promise<void>;
  recoverUnfinishedTask: (taskId: string, action: 'resume' | 'review' | 'discard') => Promise<void>;
  setAutonomousExecutionPolicy: (projectId: string, policy: AutonomousExecutionPolicy) => Promise<void>;
  approveAutonomousExecution: (projectId: string) => Promise<void>;

  addMilestone: (input: Omit<Milestone, 'id' | 'createdAt' | 'completedAt'>) => void;
  updateMilestone: (id: string, changes: Partial<Omit<Milestone, 'id' | 'createdAt' | 'completedAt'>>) => void;
  deleteMilestone: (id: string) => void;

  addTimelineEvent: (input: Omit<TimelineEvent, 'id' | 'timestamp'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotification: (id: string) => void;
  addNotification: (input: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;

  toggleProviderProfile: (id: string) => void;
  selectModelForProfile: (profileId: string, modelId: string) => void;
  logAccountSwitch: (log: Omit<AccountSwitchLog, 'id' | 'timestamp'>) => Promise<void>;
  createCheckpoint: (chk: Omit<ExecutionCheckpoint, 'id' | 'timestamp'>) => Promise<ExecutionCheckpoint>;
}

export const useAppStore = create<AppState>((set: (fn: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => void, get: () => AppState): AppState => ({
  projects: [],
  activeProjectId: null,
  requirements: [],
  tasks: [],
  milestones: [],
  timelineEvents: [],
  notifications: [],
  providerProfiles: defaultProfiles,
  accountSwitchLogs: [],
  checkpoints: [],
  executionEvents: [],
  continuationStates: [],
  idCounters: {
    project: 1,
    requirement: 1,
    task: 1,
    milestone: 1,
    event: 1,
    notification: 1,
    log: 1
  },

  createProject: async (input: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `PRJ-${get().idCounters.project}`;
    const now = getIso();
    const newProject: Project = {
      ...input,
      id,
      createdAt: now,
      updatedAt: now,
      autonomousExecutionPolicy: 'OFF',
      hasUserApprovedAutonomousExecution: false
    };
    set((state: AppState) => ({
      projects: [...state.projects, newProject],
      activeProjectId: id,
      idCounters: { ...state.idCounters, project: state.idCounters.project + 1 }
    }));
  },

  updateProject: async (id: string, changes: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const now = getIso();
    set((state: AppState) => ({
      projects: state.projects.map((p: Project) => (p.id === id ? { ...p, ...changes, updatedAt: now } : p))
    }));
  },

  deleteProject: async (id: string) => {
    set((state: AppState) => ({
      projects: state.projects.filter((p: Project) => p.id !== id),
      activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
      requirements: state.requirements.filter((r: Requirement) => r.projectId !== id),
      tasks: state.tasks.filter((t: Task) => t.projectId !== id)
    }));
  },

  archiveProject: (id: string) => get().updateProject(id, { status: 'Archived' }),
  duplicateProject: async (id: string) => {
    const proj = get().projects.find((p: Project) => p.id === id);
    if (proj) {
      await get().createProject({ ...proj, name: `${proj.name} (Copy)` });
    }
  },

  setActiveProject: (id: string | null) => set({ activeProjectId: id }),

  setRequirements: (reqs: Requirement[]) => set({ requirements: reqs }),
  addRequirement: async (input: Omit<Requirement, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'history'>) => {
    const id = `REQ-${get().idCounters.requirement}`;
    const now = getIso();
    const newReq: Requirement = { ...input, id, version: 1, history: [], createdAt: now, updatedAt: now };
    set((state: AppState) => ({
      requirements: [...state.requirements, newReq],
      idCounters: { ...state.idCounters, requirement: state.idCounters.requirement + 1 }
    }));
  },

  updateRequirement: async (id: string, changes: Partial<Omit<Requirement, 'id' | 'createdAt' | 'updatedAt' | 'history'>>) => {
    const now = getIso();
    set((state: AppState) => ({
      requirements: state.requirements.map((r: Requirement) => (r.id === id ? { ...r, ...changes, updatedAt: now } : r))
    }));
  },

  deleteRequirement: async (id: string) => set((state: AppState) => ({ requirements: state.requirements.filter((r: Requirement) => r.id !== id) })),

  addTask: async (input: Partial<Task> & { projectId: string; description: string; priority: Priority }) => {
    const id = `TSK-${get().idCounters.task}`;
    const now = getIso();
    const newTask: Task = {
      id,
      projectId: input.projectId,
      requirementId: input.requirementId || null,
      title: input.title || input.name || `Task ${id}`,
      name: input.name || input.title || `Task ${id}`,
      description: input.description,
      priority: input.priority,
      status: input.status || 'QUEUED',
      progress: input.progress || 0,
      acceptanceCriteria: input.acceptanceCriteria || input.description,
      estimatedTime: input.estimatedTime || '2h',
      category: input.category || 'General',
      dependencies: input.dependencies || [],
      currentProviderProfileId: null,
      currentModelId: null,
      checkpointId: null,
      retryCount: 0,
      maxRetries: 3,
      failoverCount: 0,
      createdAt: now,
      updatedAt: now
    };
    set((state: AppState) => ({
      tasks: [...state.tasks, newTask],
      idCounters: { ...state.idCounters, task: state.idCounters.task + 1 }
    }));
  },

  updateTask: async (id: string, changes: Partial<Task>) => {
    const now = getIso();
    set((state: AppState) => ({
      tasks: state.tasks.map((t: Task) => (t.id === id ? { ...t, ...changes, updatedAt: now } : t))
    }));
  },

  deleteTask: (id: string) => set((state: AppState) => ({ tasks: state.tasks.filter((t: Task) => t.id !== id) })),

  startTaskExecution: async (taskId: string) => {
    const state = get();
    const task = state.tasks.find((t: Task) => t.id === taskId);
    if (!task) return;

    const core = TaskExecutionCore.getInstance();
    const result = core.startTask(task, state.tasks, state.providerProfiles);

    const newTasks = state.tasks.map((t: Task) => t.id === taskId ? result.updatedTask : t);
    const newCheckpoints = [...state.checkpoints, result.checkpoint];
    const newEvents = [...state.executionEvents, ...result.events];

    const project = state.projects.find((p: Project) => p.id === task.projectId);
    if (project && project.path) {
      await PersistenceService.saveTasks(project.path, newTasks.filter((t: Task) => t.projectId === project.id));
      await PersistenceService.saveCheckpoints(project.path, newCheckpoints.filter((c: ExecutionCheckpoint) => c.projectId === project.id));
      await PersistenceService.saveExecutionEvents(project.path, newEvents.filter((e: ExecutionEvent) => e.projectId === project.id));
    }

    set({ tasks: newTasks, checkpoints: newCheckpoints, executionEvents: newEvents });
  },

  pauseTaskExecution: async (taskId: string) => {
    const state = get();
    const task = state.tasks.find((t: Task) => t.id === taskId);
    if (!task) return;

    const core = TaskExecutionCore.getInstance();
    const result = core.pauseTask(task);

    const newTasks = state.tasks.map((t: Task) => t.id === taskId ? result.updatedTask : t);
    const newCheckpoints = [...state.checkpoints, result.checkpoint];
    const newEvents = [...state.executionEvents, ...result.events];

    const project = state.projects.find((p: Project) => p.id === task.projectId);
    if (project && project.path) {
      await PersistenceService.saveTasks(project.path, newTasks.filter((t: Task) => t.projectId === project.id));
      await PersistenceService.saveCheckpoints(project.path, newCheckpoints.filter((c: ExecutionCheckpoint) => c.projectId === project.id));
      await PersistenceService.saveExecutionEvents(project.path, newEvents.filter((e: ExecutionEvent) => e.projectId === project.id));
    }

    set({ tasks: newTasks, checkpoints: newCheckpoints, executionEvents: newEvents });
  },

  resumeTaskExecution: async (taskId: string) => {
    const state = get();
    const task = state.tasks.find((t: Task) => t.id === taskId);
    if (!task) return;

    const checkpoint = state.checkpoints.find((c: ExecutionCheckpoint) => c.id === task.checkpointId) || null;
    const core = TaskExecutionCore.getInstance();
    const result = core.resumeTask(task, checkpoint);

    const newTasks = state.tasks.map((t: Task) => t.id === taskId ? result.updatedTask : t);
    const newCheckpoints = [...state.checkpoints, result.checkpoint];
    const newEvents = [...state.executionEvents, ...result.events];

    const project = state.projects.find((p: Project) => p.id === task.projectId);
    if (project && project.path) {
      await PersistenceService.saveTasks(project.path, newTasks.filter((t: Task) => t.projectId === project.id));
      await PersistenceService.saveCheckpoints(project.path, newCheckpoints.filter((c: ExecutionCheckpoint) => c.projectId === project.id));
      await PersistenceService.saveExecutionEvents(project.path, newEvents.filter((e: ExecutionEvent) => e.projectId === project.id));
    }

    set({ tasks: newTasks, checkpoints: newCheckpoints, executionEvents: newEvents });
  },

  completeTaskVerificationStep: async (taskId: string, verifier: TaskVerifier) => {
    const state = get();
    const task = state.tasks.find((t: Task) => t.id === taskId);
    if (!task) return;

    const core = TaskExecutionCore.getInstance();
    const result = await core.completeStepAndVerify(task, verifier);

    const newTasks = state.tasks.map((t: Task) => t.id === taskId ? result.updatedTask : t);
    const newCheckpoints = [...state.checkpoints, result.checkpoint];
    const newEvents = [...state.executionEvents, ...result.events];
    let newContinuation = [...state.continuationStates];

    if (result.continuationState) {
      newContinuation = newContinuation.filter((c: TaskContinuationState) => c.taskId !== taskId);
      newContinuation.push(result.continuationState);
    }

    const project = state.projects.find((p: Project) => p.id === task.projectId);
    if (project && project.path) {
      await PersistenceService.saveTasks(project.path, newTasks.filter((t: Task) => t.projectId === project.id));
      await PersistenceService.saveCheckpoints(project.path, newCheckpoints.filter((c: ExecutionCheckpoint) => c.projectId === project.id));
      await PersistenceService.saveExecutionEvents(project.path, newEvents.filter((e: ExecutionEvent) => e.projectId === project.id));
      if (result.continuationState) {
        await PersistenceService.saveContinuationStates(project.path, newContinuation.filter((c: TaskContinuationState) => c.projectId === project.id));
      }
    }

    set({
      tasks: newTasks,
      checkpoints: newCheckpoints,
      executionEvents: newEvents,
      continuationStates: newContinuation
    });
  },

  recoverUnfinishedTask: async (taskId: string, action: 'resume' | 'review' | 'discard') => {
    const state = get();
    const task = state.tasks.find((t: Task) => t.id === taskId);
    if (!task) return;

    let updatedStatus: TaskExecutionStatus = task.status;
    if (action === 'resume') updatedStatus = 'READY';
    else if (action === 'review') updatedStatus = 'WAITING_FOR_USER';
    else if (action === 'discard') updatedStatus = 'FAILED';

    const updatedTask = { ...task, status: updatedStatus, updatedAt: getIso() };
    const newTasks = state.tasks.map((t: Task) => t.id === taskId ? updatedTask : t);

    const project = state.projects.find((p: Project) => p.id === task.projectId);
    if (project && project.path) {
      await PersistenceService.saveTasks(project.path, newTasks.filter((t: Task) => t.projectId === project.id));
    }

    set({ tasks: newTasks });
  },

  setAutonomousExecutionPolicy: async (projectId: string, policy: AutonomousExecutionPolicy) => {
    await get().updateProject(projectId, { autonomousExecutionPolicy: policy });
  },

  approveAutonomousExecution: async (projectId: string) => {
    await get().updateProject(projectId, { hasUserApprovedAutonomousExecution: true });
  },

  addMilestone: (input: Omit<Milestone, 'id' | 'createdAt' | 'completedAt'>) => set((state: AppState) => ({
    milestones: [...state.milestones, { ...input, id: `MIL-${state.idCounters.milestone}`, completedAt: null, createdAt: getIso() }],
    idCounters: { ...state.idCounters, milestone: state.idCounters.milestone + 1 }
  })),

  updateMilestone: (id: string, changes: Partial<Omit<Milestone, 'id' | 'createdAt' | 'completedAt'>>) => set((state: AppState) => ({
    milestones: state.milestones.map((m: Milestone) => (m.id === id ? { ...m, ...changes } : m))
  })),

  deleteMilestone: (id: string) => set((state: AppState) => ({ milestones: state.milestones.filter((m: Milestone) => m.id !== id) })),

  addTimelineEvent: (input: Omit<TimelineEvent, 'id' | 'timestamp'>) => set((state: AppState) => ({
    timelineEvents: [...state.timelineEvents, { ...input, id: `EVT-${state.idCounters.event}`, timestamp: getIso() }],
    idCounters: { ...state.idCounters, event: state.idCounters.event + 1 }
  })),

  markNotificationRead: (id: string) => set((state: AppState) => ({ notifications: state.notifications.map((n: AppNotification) => (n.id === id ? { ...n, read: true } : n)) })),
  markAllNotificationsRead: () => set((state: AppState) => ({ notifications: state.notifications.map((n: AppNotification) => ({ ...n, read: true })) })),
  clearNotification: (id: string) => set((state: AppState) => ({ notifications: state.notifications.filter((n: AppNotification) => n.id !== id) })),
  addNotification: (input: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => set((state: AppState) => ({
    notifications: [...state.notifications, { ...input, id: `NTF-${state.idCounters.notification}`, read: false, createdAt: getIso() }],
    idCounters: { ...state.idCounters, notification: state.idCounters.notification + 1 }
  })),

  toggleProviderProfile: (id: string) => set((state: AppState) => ({
    providerProfiles: state.providerProfiles.map((p: ProviderProfile) => p.id === id ? { ...p, isEnabled: !p.isEnabled } : p)
  })),

  selectModelForProfile: (profileId: string, modelId: string) => set((state: AppState) => ({
    providerProfiles: state.providerProfiles.map((p: ProviderProfile) => p.id === profileId ? { ...p, selectedModelId: modelId } : p)
  })),

  logAccountSwitch: async (input: Omit<AccountSwitchLog, 'id' | 'timestamp'>) => {
    const id = `LOG-${get().idCounters.log}`;
    const newLog: AccountSwitchLog = { ...input, id, timestamp: getIso() };
    set((state: AppState) => ({
      accountSwitchLogs: [newLog, ...state.accountSwitchLogs],
      idCounters: { ...state.idCounters, log: state.idCounters.log + 1 }
    }));
  },

  createCheckpoint: async (input: Omit<ExecutionCheckpoint, 'id' | 'timestamp'>) => {
    const id = `CHK-${Date.now()}`;
    const newChk: ExecutionCheckpoint = { ...input, id, timestamp: getIso() };
    set((state: AppState) => ({ checkpoints: [...state.checkpoints, newChk] }));
    return newChk;
  }
}));

export function getProjectProgress(projectId: string): number {
  const state = useAppStore.getState();
  const projectTasks = state.tasks.filter((t: Task) => t.projectId === projectId);
  if (projectTasks.length === 0) return 0;
  const completed = projectTasks.filter((t: Task) => t.status === 'COMPLETED').length;
  return Math.round((completed / projectTasks.length) * 100);
}

export function getProjectStats(projectId: string) {
  const state = useAppStore.getState();
  const projectTasks = state.tasks.filter((t: Task) => t.projectId === projectId);
  const projectReqs = state.requirements.filter((r: Requirement) => r.projectId === projectId);
  return {
    totalTasks: projectTasks.length,
    completedTasks: projectTasks.filter((t: Task) => t.status === 'COMPLETED').length,
    inProgressTasks: projectTasks.filter((t: Task) => t.status === 'EXECUTING' || t.status === 'PLANNING').length,
    blockedTasks: projectTasks.filter((t: Task) => t.status === 'WAITING_FOR_USER' || t.status === 'WAITING_FOR_PROVIDER').length,
    totalRequirements: projectReqs.length,
    approvedRequirements: projectReqs.filter((r: Requirement) => r.status === 'Approved' || r.status === 'Verified').length
  };
}
