/// <reference types="vite/client" />

interface Window {
  electron: any;
  api: {
    readTemplates: () => Promise<any>;
    saveTemplates: (data: any) => Promise<boolean>;
    readHistory: () => Promise<any>;
    saveHistory: (data: any) => Promise<boolean>;
    readSnippets: () => Promise<any>;
    saveSnippets: (data: any) => Promise<boolean>;
    saveFileDialog: (content: string, defaultName?: string) => Promise<boolean>;
    openFolderDialog: () => Promise<string | null>;
    readDirectory: (path: string) => Promise<{ name: string; path: string; type: 'file' | 'dir' }[]>;
    readFile: (path: string) => Promise<string | null>;
    writeFile: (path: string, content: string) => Promise<boolean>;
  };
}
