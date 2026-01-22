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
  writeFile: (path: string, content: string) => ipcRenderer.invoke('write-file', path, content)
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
