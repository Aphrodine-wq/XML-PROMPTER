// import fs from 'fs';
// import path from 'path';

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
    console.warn('ContextBuilder is disabled in browser/renderer environment');
    return `Project Context (Root: ${rootDir})\n\n[Context building not supported in browser]`;
  }

  private async scanDirectory(dir: string): Promise<string[]> {
    return [];
  }
}

export const contextBuilder = new ContextBuilder();
