import { storage } from './storage.js';

export interface FileNode {
  path: string;
  content: string;
  summary?: string;
  lastModified: number;
}

export class ProjectIndexer {
  private index: Map<string, FileNode> = new Map();
  private ignorePatterns: RegExp[] = [
    /node_modules/,
    /\.git/,
    /\.DS_Store/,
    /dist/,
    /build/
  ];

  async indexFile(path: string, content: string, lastModified: number) {
    if (this.shouldIgnore(path)) return;
    
    // In a real implementation, we would generate a vector embedding or summary here using AI
    // For now, we just store the raw content and basic metadata
    this.index.set(path, {
        path,
        content,
        lastModified
    });
  }

  removeFile(path: string) {
    this.index.delete(path);
  }

  search(query: string): FileNode[] {
    // Naive text search for now
    // Future: Vector search
    const results: FileNode[] = [];
    for (const node of this.index.values()) {
        if (node.content.toLowerCase().includes(query.toLowerCase()) || node.path.includes(query)) {
            results.push(node);
        }
    }
    return results.slice(0, 10); // Limit results
  }

  getContextSummary(): string {
    // Generate a high-level summary of the project structure
    let summary = "Project Structure:\n";
    const paths = Array.from(this.index.keys()).sort();
    
    // Simple tree-like text representation
    paths.forEach(p => {
        summary += `- ${p}\n`;
    });
    
    return summary;
  }

  private shouldIgnore(path: string): boolean {
    return this.ignorePatterns.some(p => p.test(path));
  }
}

export const projectIndexer = new ProjectIndexer();
