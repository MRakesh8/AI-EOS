import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  pickFolder: (): Promise<string | null> => {
    return ipcRenderer.invoke('dialog:pickFolder');
  },
  ensureDir: (dirPath: string): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke('fs:ensureDir', dirPath);
  },
  readFile: (filePath: string): Promise<{ success: boolean; content?: string; error?: string }> => {
    return ipcRenderer.invoke('fs:readFile', filePath);
  },
  writeFile: (filePath: string, content: string): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke('fs:writeFile', filePath, content);
  },
  exists: (checkPath: string): Promise<{ success: boolean; exists: boolean }> => {
    return ipcRenderer.invoke('fs:exists', checkPath);
  },
  watchProject: (path: string, projectId: string): Promise<boolean> => {
    return ipcRenderer.invoke('fs:watchProject', path, projectId);
  },
  stopWatching: (): Promise<boolean> => {
    return ipcRenderer.invoke('fs:stopWatching');
  },
  onWorkspaceEvent: (callback: (event: any) => void): (() => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('workspace-event', listener);
    return () => {
      ipcRenderer.removeListener('workspace-event', listener);
    };
  }
});
