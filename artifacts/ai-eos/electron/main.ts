import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let activeWatcher: fs.FSWatcher | null = null;

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;
const PORT = process.env.PORT || '3000';
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || `http://localhost:${PORT}`;

function createWindow() {
  app.setAppUserModelId('com.aieos.desktop');

  const iconPathPng = path.join(__dirname, '../public/icon.png');
  const iconPathIco = path.join(__dirname, '../public/icon.ico');
  const iconPath = fs.existsSync(iconPathIco) ? iconPathIco : (fs.existsSync(iconPathPng) ? iconPathPng : undefined);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'AI-EOS — AI Engineering Operating System',
    icon: iconPath,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (iconPath && process.platform === 'win32') {
    mainWindow.setIcon(iconPath);
  }

  if (isDev) {
    mainWindow.loadURL(DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexPath = path.join(__dirname, '../dist/public/index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Setup IPC Handlers matching Window.electronAPI interface
ipcMain.handle('dialog:pickFolder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Workspace Folder'
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('fs:ensureDir', async (_event, dirPath: string) => {
  try {
    if (!dirPath) return { success: false, error: 'Path is required' };
    await fs.promises.mkdir(dirPath, { recursive: true });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
});

ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
  try {
    if (!filePath) return { success: false, error: 'File path is required' };
    const content = await fs.promises.readFile(filePath, 'utf8');
    return { success: true, content };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
});

ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
  try {
    if (!filePath) return { success: false, error: 'File path is required' };
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(filePath, content, 'utf8');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
});

ipcMain.handle('fs:exists', async (_event, checkPath: string) => {
  try {
    if (!checkPath) return { success: true, exists: false };
    const exists = fs.existsSync(checkPath);
    return { success: true, exists };
  } catch (err: any) {
    return { success: false, exists: false };
  }
});

ipcMain.handle('fs:watchProject', async (_event, projectPath: string, projectId: string) => {
  try {
    if (activeWatcher) {
      activeWatcher.close();
      activeWatcher = null;
    }
    if (fs.existsSync(projectPath)) {
      activeWatcher = fs.watch(projectPath, { recursive: true }, (eventType, filename) => {
        if (mainWindow) {
          mainWindow.webContents.send('workspace-event', {
            type: 'workspace_change',
            eventType,
            filename,
            projectId,
            timestamp: new Date().toISOString()
          });
        }
      });
    }
    return true;
  } catch (err) {
    return false;
  }
});

ipcMain.handle('fs:stopWatching', async () => {
  if (activeWatcher) {
    activeWatcher.close();
    activeWatcher = null;
  }
  return true;
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
