import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  readTemplates: () => ipcRenderer.invoke('read-templates'),
  saveTemplates: (data: any) => ipcRenderer.invoke('save-templates', data),
  readHistory: () => ipcRenderer.invoke('read-history'),
  saveHistory: (data: any) => ipcRenderer.invoke('save-history', data),
  readSnippets: () => ipcRenderer.invoke('read-snippets'),
  saveSnippets: (data: any) => ipcRenderer.invoke('save-snippets', data),
  saveFileDialog: (content: string, defaultName?: string) => ipcRenderer.invoke('save-file-dialog', content, defaultName),
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  readDirectory: (path: string) => ipcRenderer.invoke('read-directory', path),
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('write-file', path, content),
  // Project Config & VFS
  ensureProjectConfig: (path: string) => ipcRenderer.invoke('ensure-project-config', path),
  writeProjectFile: (path: string, content: string) => ipcRenderer.invoke('write-project-file', path, content),
  createDirectory: (path: string) => ipcRenderer.invoke('create-directory', path),

  // AI Provider APIs
  getAvailableProviders: () => ipcRenderer.invoke('get-available-providers'),
  setProvider: (provider: string) => ipcRenderer.invoke('set-provider', provider),
  getCurrentProvider: () => ipcRenderer.invoke('get-current-provider'),
  
  // Project Context APIs
  analyzeProject: (dirPath: string) => ipcRenderer.invoke('analyze-project', dirPath),
  generateContextPrompt: (dirPath: string) => ipcRenderer.invoke('generate-context-prompt', dirPath),
  
  // Analytics APIs
  getAnalytics: () => ipcRenderer.invoke('get-analytics'),
  getMetrics: (filter?: any) => ipcRenderer.invoke('get-metrics', filter),
  
  // Batch Processing APIs
  createBatchJob: (name: string, items: any[]) => ipcRenderer.invoke('create-batch-job', name, items),
  getBatchJob: (jobId: string) => ipcRenderer.invoke('get-batch-job', jobId),
  executeBatch: (jobId: string, options?: any) => ipcRenderer.invoke('execute-batch', jobId, options),
  listBatchJobs: (filter?: any) => ipcRenderer.invoke('list-batch-jobs', filter),
  
  // Collaboration APIs
  createCollaborationSession: (name: string, participants?: string[]) => ipcRenderer.invoke('create-collaboration-session', name, participants),
  getPromptHistory: (promptId: string) => ipcRenderer.invoke('get-prompt-history', promptId),
  createPromptVersion: (promptId: string, content: string, author: string, message: string) => ipcRenderer.invoke('create-prompt-version', promptId, content, author, message),
  getPromptDiff: (promptId: string, v1: number, v2: number) => ipcRenderer.invoke('get-prompt-diff', promptId, v1, v2),

  // Skill System
  loadSkills: (path?: string) => ipcRenderer.invoke('load-skills', path),

  // Semantic Search
  semanticSearch: (query: string, options?: any) => ipcRenderer.invoke('semantic-search', query, options),
  indexDocument: (id: string, content: string, metadata?: any) => ipcRenderer.invoke('index-document', id, content, metadata)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
