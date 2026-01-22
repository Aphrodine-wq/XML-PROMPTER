export interface VirtualFile {
  path: string;
  content: string;
  type: 'file' | 'dir';
}

export class VirtualFileSystem {
  files: Map<string, VirtualFile> = new Map();

  addFile(path: string, content: string) {
    this.files.set(path, { path, content, type: 'file' });
  }

  getFiles(): VirtualFile[] {
    return Array.from(this.files.values());
  }

  // Helper to convert flat list to tree if needed later
}
