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

  // Project Config & VFS Handlers
  ipcMain.handle('ensure-project-config', async (_, projectPath: string) => {
    try {
      const configDir = path.join(projectPath, '.xmlpg');
      const configFile = path.join(configDir, 'config.json');
      
      await fs.mkdir(configDir, { recursive: true });
      
      try {
        await fs.access(configFile);
      } catch {
        // Create default config if not exists
        const defaultConfig = {
          name: path.basename(projectPath),
          version: '1.0.0',
          created_at: new Date().toISOString()
        };
        await fs.writeFile(configFile, JSON.stringify(defaultConfig, null, 2), 'utf-8');
      }
      return true;
    } catch (e) {
      console.error('Failed to ensure project config', e);
      return false;
    }
  });

  ipcMain.handle('create-directory', async (_, dirPath: string) => {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return true;
    } catch (e) {
      return false;
    }
  });

  ipcMain.handle('write-project-file', async (_, filePath: string, content: string) => {
    try {
      // Ensure dir exists first
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
      return true;
    } catch (e) {
      console.error('Failed to write project file', e);
      return false;
    }
  });

  // AI Provider Handlers
  ipcMain.handle('get-available-providers', async () => {
    const { aiManager } = await import('@xmlpg/core');
    try {
      return await aiManager.getAvailableProviders();
    } catch (e) {
      return ['ollama'];
    }
  });

  ipcMain.handle('set-provider', async (_, provider: string) => {
    const { aiManager } = await import('@xmlpg/core');
    try {
      await aiManager.setProvider(provider as any);
      return true;
    } catch (e) {
      return false;
    }
  });

  ipcMain.handle('get-current-provider', async () => {
    const { aiManager } = await import('@xmlpg/core');
    return aiManager.getCurrentProvider();
  });

  // Project Context Handlers
  ipcMain.handle('analyze-project', async (_, dirPath: string) => {
    const { projectContextAnalyzer } = await import('@xmlpg/core');
    try {
      return await projectContextAnalyzer.analyzeProject(dirPath);
    } catch (e) {
      return null;
    }
  });

  ipcMain.handle('generate-context-prompt', async (_, dirPath: string) => {
    const { projectContextAnalyzer } = await import('@xmlpg/core');
    try {
      return await projectContextAnalyzer.generateContextPrompt(dirPath);
    } catch (e) {
      return '';
    }
  });

  // Analytics Handlers
  ipcMain.handle('get-analytics', async () => {
    const { database } = await import('@xmlpg/core');
    try {
      return await database.getAggregateStats();
    } catch (e) {
      return null;
    }
  });

  ipcMain.handle('get-metrics', async (_, filter?: any) => {
    const { database } = await import('@xmlpg/core');
    try {
      return await database.getMetrics(filter);
    } catch (e) {
      return [];
    }
  });

  // Batch Processing Handlers
  ipcMain.handle('create-batch-job', async (_, name: string, items: any[]) => {
    const { batchProcessor } = await import('@xmlpg/core');
    try {
      return await batchProcessor.createJob(name, items);
    } catch (e) {
      return null;
    }
  });

  ipcMain.handle('get-batch-job', async (_, jobId: string) => {
    const { batchProcessor } = await import('@xmlpg/core');
    try {
      return await batchProcessor.getJobStatus(jobId);
    } catch (e) {
      return null;
    }
  });

  ipcMain.handle('execute-batch', async (_, jobId: string, options?: any) => {
    const { batchProcessor } = await import('@xmlpg/core');
    try {
      return await batchProcessor.executeBatch(jobId, options);
    } catch (e) {
      return null;
    }
  });

  ipcMain.handle('list-batch-jobs', async (_, filter?: any) => {
    const { batchProcessor } = await import('@xmlpg/core');
    try {
      return await batchProcessor.listJobs(filter);
    } catch (e) {
      return [];
    }
  });

  // Collaboration Handlers
  ipcMain.handle('create-collaboration-session', async (_, name: string, participants?: string[]) => {
    const { collaborationManager } = await import('@xmlpg/core');
    try {
      return await collaborationManager.createSession(name, participants);
    } catch (e) {
      return null;
    }
  });

  ipcMain.handle('get-prompt-history', async (_, promptId: string) => {
    const { collaborationManager } = await import('@xmlpg/core');
    try {
      return await collaborationManager.getHistory(promptId);
    } catch (e) {
      return [];
    }
  });

  ipcMain.handle('create-prompt-version', async (_, promptId: string, content: string, author: string, message: string) => {
    const { collaborationManager } = await import('@xmlpg/core');
    try {
      return await collaborationManager.createVersion(promptId, content, author, message);
    } catch (e) {
      return null;
    }
  });

  ipcMain.handle('get-prompt-diff', async (_, promptId: string, v1: number, v2: number) => {
    const { collaborationManager } = await import('@xmlpg/core');
    try {
      return await collaborationManager.getDiff(promptId, v1, v2);
    } catch (e) {
      return null;
    }
  });

  // Skill System Handlers
  ipcMain.handle('load-skills', async (_, customPath?: string) => {
    const { skillLoader } = await import('@xmlpg/core');
    try {
      const documentsPath = app.getPath('documents');
      const skillsPath = customPath || path.join(documentsPath, 'xml-prompter-skills');
      
      skillLoader.setSkillsDir(skillsPath);
      await skillLoader.loadSkills();
      return { success: true, path: skillsPath };
    } catch (e: any) {
      console.error('Failed to load skills', e);
      return { success: false, error: e.message };
    }
  });

  // Semantic Search Handlers
  ipcMain.handle('semantic-search', async (_, query: string, options?: any) => {
    const { semanticSearch } = await import('@xmlpg/core');
    try {
      return await semanticSearch.search(query, options);
    } catch (e: any) {
      console.error('Semantic search failed', e);
      return [];
    }
  });

  ipcMain.handle('index-document', async (_, id: string, content: string, metadata?: any) => {
    const { semanticSearch } = await import('@xmlpg/core');
    try {
      await semanticSearch.indexDocument(id, content, metadata);
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
