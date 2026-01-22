import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import fs from 'fs/promises'
import path from 'path'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Persistence Handlers
  const dataPath = join(app.getPath('userData'), 'data');
  const templatesPath = join(dataPath, 'templates.json');
  const historyPath = join(dataPath, 'history.json');
  const snippetsPath = join(dataPath, 'snippets.json');

  const ensureDataDir = async () => {
    try {
      await fs.mkdir(dataPath, { recursive: true });
    } catch (e) {
      console.error('Failed to create data dir', e);
    }
  };

  ipcMain.handle('read-templates', async () => {
    await ensureDataDir();
    try {
      const data = await fs.readFile(templatesPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  });

  ipcMain.handle('save-templates', async (_, templates) => {
    await ensureDataDir();
    await fs.writeFile(templatesPath, JSON.stringify(templates, null, 2));
    return true;
  });

  ipcMain.handle('read-history', async () => {
    await ensureDataDir();
    try {
      const data = await fs.readFile(historyPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  });

  ipcMain.handle('save-history', async (_, history) => {
    await ensureDataDir();
    await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
    return true;
  });

  // Snippets Handlers
  ipcMain.handle('read-snippets', async () => {
    await ensureDataDir();
    try {
      const data = await fs.readFile(snippetsPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  });

  ipcMain.handle('save-snippets', async (_, snippets) => {
    await ensureDataDir();
    await fs.writeFile(snippetsPath, JSON.stringify(snippets, null, 2));
    return true;
  });

  // Native File Save Handler
  ipcMain.handle('save-file-dialog', async (_, content: string, defaultName: string = 'prompt.xml') => {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Save XML File',
      defaultPath: defaultName,
      filters: [
        { name: 'XML Files', extensions: ['xml'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (filePath) {
      await fs.writeFile(filePath, content, 'utf-8');
      return true;
    }
    return false;
  });

  // Project Handlers
  ipcMain.handle('open-folder-dialog', async () => {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    return filePaths[0] || null;
  });

  ipcMain.handle('read-directory', async (_, dirPath: string) => {
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      return files
        .filter(f => f.isFile() && f.name.endsWith('.xml')) // Simple filter for now
        .map(f => ({
          name: f.name,
          path: path.join(dirPath, f.name),
          type: 'file'
        }));
    } catch (e) {
      console.error('Failed to read directory', e);
      return [];
    }
  });

  ipcMain.handle('read-file', async (_, filePath: string) => {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (e) {
      return null;
    }
  });

  ipcMain.handle('write-file', async (_, filePath: string, content: string) => {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
      return true;
    } catch (e) {
      return false;
    }
  });

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
