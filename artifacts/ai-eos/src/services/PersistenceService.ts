import {
  Project,
  Requirement,
  Task,
  ExecutionCheckpoint,
  ExecutionEvent,
  TaskContinuationState,
  AccountSwitchLog
} from '../types';

export class PersistenceService {
  private static async atomicWrite(filePath: string, data: string): Promise<boolean> {
    if (typeof window === 'undefined' || !window.electronAPI) {
      return false;
    }
    const tmpPath = `${filePath}.tmp`;
    const resTmp = await window.electronAPI.writeFile(tmpPath, data);
    if (!resTmp.success) return false;
    const resFinal = await window.electronAPI.writeFile(filePath, data);
    return resFinal.success;
  }

  public static async loadTasks(projectPath: string): Promise<Task[]> {
    if (typeof window === 'undefined' || !window.electronAPI) return [];
    const res = await window.electronAPI.readFile(`${projectPath}/.aieos/tasks.json`);
    if (res.success && res.content) {
      try { return JSON.parse(res.content); } catch (e) {}
    }
    return [];
  }

  public static async saveTasks(projectPath: string, tasks: Task[]): Promise<boolean> {
    return this.atomicWrite(`${projectPath}/.aieos/tasks.json`, JSON.stringify(tasks, null, 2));
  }

  public static async loadCheckpoints(projectPath: string): Promise<ExecutionCheckpoint[]> {
    if (typeof window === 'undefined' || !window.electronAPI) return [];
    const res = await window.electronAPI.readFile(`${projectPath}/.aieos/checkpoints.json`);
    if (res.success && res.content) {
      try { return JSON.parse(res.content); } catch (e) {}
    }
    return [];
  }

  public static async saveCheckpoints(projectPath: string, checkpoints: ExecutionCheckpoint[]): Promise<boolean> {
    return this.atomicWrite(`${projectPath}/.aieos/checkpoints.json`, JSON.stringify(checkpoints, null, 2));
  }

  public static async loadExecutionEvents(projectPath: string): Promise<ExecutionEvent[]> {
    if (typeof window === 'undefined' || !window.electronAPI) return [];
    const res = await window.electronAPI.readFile(`${projectPath}/.aieos/execution_events.json`);
    if (res.success && res.content) {
      try { return JSON.parse(res.content); } catch (e) {}
    }
    return [];
  }

  public static async saveExecutionEvents(projectPath: string, events: ExecutionEvent[]): Promise<boolean> {
    return this.atomicWrite(`${projectPath}/.aieos/execution_events.json`, JSON.stringify(events, null, 2));
  }

  public static async loadContinuationStates(projectPath: string): Promise<TaskContinuationState[]> {
    if (typeof window === 'undefined' || !window.electronAPI) return [];
    const res = await window.electronAPI.readFile(`${projectPath}/.aieos/continuation_states.json`);
    if (res.success && res.content) {
      try { return JSON.parse(res.content); } catch (e) {}
    }
    return [];
  }

  public static async saveContinuationStates(projectPath: string, states: TaskContinuationState[]): Promise<boolean> {
    return this.atomicWrite(`${projectPath}/.aieos/continuation_states.json`, JSON.stringify(states, null, 2));
  }
}
