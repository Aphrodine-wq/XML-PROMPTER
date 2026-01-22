import { StateCreator } from 'zustand';
import { toast } from 'sonner';
import { projectIndexer } from '@xmlpg/core';

export interface ProjectFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
}

export interface ProjectSlice {
  activeProjectPath: string | null;
  projectFiles: ProjectFile[];
  projectContext: string;
  currentFilePath: string | null;
  
  openProject: () => Promise<void>;
  refreshProjectFiles: () => Promise<void>;
  openFile: (path: string) => Promise<void>;
  saveCurrentFile: (content: string) => Promise<void>;
  buildProjectContext: () => Promise<void>;
  
  // New VFS Generation
  writeGeneratedProject: (files: any[]) => Promise<void>;
}

export const createProjectSlice: StateCreator<ProjectSlice> = (set, get) => ({
  activeProjectPath: null,
  projectFiles: [],
  projectContext: '',
  currentFilePath: null,

  openProject: async () => {
    if (typeof window === 'undefined' || !window.api) return;
    const path = await window.api.openFolderDialog();
    if (path) {
      set({ activeProjectPath: path });
      
      // Initialize .xmlpg config
      await window.api.ensureProjectConfig(path);
      
      await get().refreshProjectFiles();
      toast.success("Project opened");
    }
  },

  refreshProjectFiles: async () => {
    const { activeProjectPath } = get();
    if (!activeProjectPath || !window.api) return;
    
    const files = await window.api.readDirectory(activeProjectPath);
    set({ projectFiles: files });
    
    // Index files for Context Engine
    // In a real app, this would be recursive and more robust
    for (const file of files) {
        if (file.type === 'file' && file.name.endsWith('.xml') || file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
            const content = await window.api.readFile(file.path);
            if (content) {
                await projectIndexer.indexFile(file.path, content, Date.now());
            }
        }
    }
    
    get().buildProjectContext();
  },

  buildProjectContext: async () => {
    // Use the Core ProjectIndexer to get the summary
    const context = projectIndexer.getContextSummary();
    set({ projectContext: context });
  },

  openFile: async (path) => {
    if (!window.api) return;
    const content = await window.api.readFile(path);
    if (content !== null) {
      set({ currentFilePath: path });
      return content; 
    }
    toast.error("Failed to read file");
  },

  saveCurrentFile: async (content) => {
    const { currentFilePath } = get();
    if (!currentFilePath || !window.api) {
      if (window.api) {
         const saved = await window.api.saveFileDialog(content);
         if (saved) toast.success("File saved");
      }
      return;
    }
    const success = await window.api.writeFile(currentFilePath, content);
    if (success) {
      toast.success("File saved");
      // Re-index this file
      await projectIndexer.indexFile(currentFilePath, content, Date.now());
      get().buildProjectContext();
    } else {
      toast.error("Failed to save file");
    }
  },
  
  writeGeneratedProject: async (files) => {
     const { activeProjectPath } = get();
     if (!activeProjectPath || !window.api) {
         toast.error("Open a project folder first!");
         return;
     }

     for (const file of files) {
         // file = { path: 'src/App.tsx', content: '...' }
         // We need to join with active project path
         // Note: window.api.path.join isn't available, we rely on the main process or simple string concat if standardized
         // Let's assume the VFS paths are relative.
         // We need to use the new writeProjectFile API which handles mkdir -p
         
         // Since we don't have path.join in renderer easily without node integration, 
         // we'll hack it or rely on the main process to handle relative paths if we pass the root.
         // Actually, let's just do manual string joining for now, assuming forward slashes (VFS standard)
         const fullPath = activeProjectPath + '/' + file.path; // Windows might need backslashes, but Node fs handles / usually
         
         await window.api.writeProjectFile(fullPath, file.content);
     }
     
     toast.success("Project generated on disk!");
     await get().refreshProjectFiles();
  }
});

