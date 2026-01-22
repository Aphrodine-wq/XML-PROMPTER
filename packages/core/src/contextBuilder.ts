import fs from 'fs';
import path from 'path';

export interface ContextConfig {
  maxSize: number;
  allowedExtensions: string[];
  ignoredDirs: string[];
}

const DEFAULT_CONFIG: ContextConfig = {
  maxSize: 10000,
  allowedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.css', '.html', '.json', '.md'],
  ignoredDirs: ['node_modules', '.git', 'dist', 'out', 'build', '.vscode']
};

export class ContextBuilder {
  private config: ContextConfig;

  constructor(config: Partial<ContextConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async buildContext(rootDir: string): Promise<string> {
    const files = await this.scanDirectory(rootDir);
    let context = `Project Context (Root: ${path.basename(rootDir)})\n\n`;
    let currentSize = 0;

    for (const file of files) {
      if (currentSize >= this.config.maxSize) break;
      
      try {
        const content = await fs.promises.readFile(file, 'utf-8');
        const relativePath = path.relative(rootDir, file);
        const fileBlock = `--- File: ${relativePath} ---\n${content}\n\n`;
        
        if (currentSize + fileBlock.length <= this.config.maxSize) {
          context += fileBlock;
          currentSize += fileBlock.length;
        } else {
          // Truncate
          const remaining = this.config.maxSize - currentSize;
          if (remaining > 100) {
            context += `--- File: ${relativePath} (Truncated) ---\n${content.slice(0, remaining)}...\n\n`;
          }
          break;
        }
      } catch (e) {
        console.warn(`Failed to read file ${file}:`, e);
      }
    }
    
    return context;
  }

  private async scanDirectory(dir: string): Promise<string[]> {
    let results: string[] = [];
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          if (!this.config.ignoredDirs.includes(entry.name)) {
            results = results.concat(await this.scanDirectory(fullPath));
          }
        } else {
          const ext = path.extname(entry.name);
          if (this.config.allowedExtensions.includes(ext)) {
            results.push(fullPath);
          }
        }
      }
    } catch (e) {
      console.warn(`Failed to scan directory ${dir}:`, e);
    }
    return results;
  }
}

export const contextBuilder = new ContextBuilder();
