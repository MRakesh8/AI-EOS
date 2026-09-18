import {
  Project,
  Task,
  Requirement,
  ExecutionCheckpoint,
  ExecutionError,
  WorkspaceContext
} from '../types';

export class WorkspaceContextBuilder {
  private static instance: WorkspaceContextBuilder;

  private constructor() {}

  public static getInstance(): WorkspaceContextBuilder {
    if (!WorkspaceContextBuilder.instance) {
      WorkspaceContextBuilder.instance = new WorkspaceContextBuilder();
    }
    return WorkspaceContextBuilder.instance;
  }

  public buildContext(
    project: Project,
    task: Task,
    allRequirements: Requirement[],
    allTasks: Task[],
    checkpoint: ExecutionCheckpoint | null,
    recentErrors: ExecutionError[] = []
  ): WorkspaceContext {
    const approvedReqs = allRequirements.filter(r =>
      r.projectId === project.id && ['Approved', 'In Development', 'Verified'].includes(r.status)
    );

    const taskMap = new Map<string, Task>(allTasks.map(t => [t.id, t]));
    const taskDeps = (task.dependencies || [])
      .map(depId => taskMap.get(depId))
      .filter((t): t is Task => t !== undefined);

    return {
      projectPath: project.path || '/workspace',
      projectType: project.projectType || 'Web',
      approvedRequirements: approvedReqs,
      projectSpecification: `Project Specification for ${project.name}`,
      currentTask: task,
      acceptanceCriteria: task.acceptanceCriteria || task.description,
      taskDependencies: taskDeps,
      currentCheckpoint: checkpoint,
      gitState: checkpoint?.gitState || { branch: 'main', commitHash: 'HEAD', hasUncommittedChanges: false },
      relevantChangedFiles: checkpoint?.filesChanged || [],
      recentExecutionErrors: recentErrors.filter(e => e.taskId === task.id)
    };
  }
}
