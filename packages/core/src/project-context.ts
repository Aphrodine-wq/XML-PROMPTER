import fs from 'fs/promises';
import path from 'path';

export interface FileAnalysis {
  path: string;
  type: string;
  size: number;
  lines: number;
  summary: string;
  keywords: string[];
}

export interface ProjectAnalysis {
  root: string;
  files: FileAnalysis[];
  structure: Record<string, unknown>;
  dependencies: string[];
  frameworks: string[];
  summary: string;
}

export class ProjectContextAnalyzer {
  private filePatterns = {
    typescript: /\.(ts|tsx)$/,
    javascript: /\.(js|jsx)$/,
    html: /\.html$/,
    css: /\.(css|scss|sass|less)$/,
    json: /\.json$/,
    markdown: /\.md$/,
    xml: /\.xml$/,
    yaml: /\.(yaml|yml)$/
  };

  async analyzeProject(rootPath: string): Promise<ProjectAnalysis> {
    const files = await this.scanDirectory(rootPath);
    const analysis = await this.analyzeFiles(files);
    const dependencies = await this.extractDependencies(rootPath);
    const frameworks = this.detectFrameworks(analysis);

    return {
      root: rootPath,
      files: analysis,
      structure: await this.buildStructure(rootPath),
      dependencies,
      frameworks,
      summary: this.generateSummary(analysis, frameworks)
    };
  }

  private async scanDirectory(dirPath: string, maxDepth: number = 3, currentDepth: number = 0): Promise<string[]> {
    const files: string[] = [];
    if (currentDepth >= maxDepth) return files;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        // Skip common unneeded directories
        if (['node_modules', '.git', 'dist', 'build', '.next', 'out'].includes(entry.name)) {
          continue;
        }

        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.scanDirectory(fullPath, maxDepth, currentDepth + 1);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error);
    }

    return files;
  }

  private async analyzeFiles(filePaths: string[]): Promise<FileAnalysis[]> {
    const analyses: FileAnalysis[] = [];

    for (const filePath of filePaths.slice(0, 100)) { // Limit to 100 files for performance
      try {
        const stat = await fs.stat(filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n').length;
        const type = this.getFileType(filePath);

        const analysis: FileAnalysis = {
          path: filePath,
          type,
          size: stat.size,
          lines,
          summary: this.summarizeFile(content, type),
          keywords: this.extractKeywords(content, type)
        };

        analyses.push(analysis);
      } catch (error) {
        console.error(`Error analyzing file ${filePath}:`, error);
      }
    }

    return analyses;
  }

  private getFileType(filePath: string): string {
    for (const [type, pattern] of Object.entries(this.filePatterns)) {
      if (pattern.test(filePath)) return type;
    }
    return 'unknown';
  }

  private summarizeFile(content: string, type: string): string {
    const lines = content.split('\n');

    switch (type) {
      case 'typescript':
      case 'javascript': {
        const classes = (content.match(/class\s+(\w+)/g) || []).length;
        const functions = (content.match(/function\s+(\w+)|(\w+)\s*=/g) || []).length;
        return `${classes} classes, ${functions} functions`;
      }
      case 'html': {
        const tags = (content.match(/<(\w+)/g) || []).length;
        return `${tags} HTML elements`;
      }
      case 'css': {
        const rules = (content.match(/\{[^}]+\}/g) || []).length;
        return `${rules} CSS rules`;
      }
      case 'json': {
        try {
          const json = JSON.parse(content);
          return `${Object.keys(json).length} top-level keys`;
        } catch {
          return 'Invalid JSON';
        }
      }
      case 'markdown': {
        const headings = (content.match(/^#+\s/gm) || []).length;
        return `${headings} headings`;
      }
      default:
        return `${lines.length} lines`;
    }
  }

  private extractKeywords(content: string, type: string): string[] {
    const keywords: Set<string> = new Set();

    // Extract imports/requires
    const imports = content.match(/import\s+.*from\s+['"]([^'"]+)['"]/g) || [];
    imports.forEach(imp => {
      const match = imp.match(/from\s+['"]([^'"]+)['"]/);
      if (match) keywords.add(match[1].split('/')[0]);
    });

    // Extract function names (TypeScript/JavaScript)
    if (type === 'typescript' || type === 'javascript') {
      const functions = content.match(/function\s+(\w+)|(\w+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[^=]*)\s*=>/g) || [];
      functions.slice(0, 5).forEach(func => keywords.add(func.match(/\w+/)?.[0] || ''));
    }

    // Extract class names
    const classes = content.match(/class\s+(\w+)/g) || [];
    classes.slice(0, 5).forEach(cls => keywords.add(cls.match(/\w+/)?.[0] || ''));

    // Extract component/export names
    const exports = content.match(/export\s+(?:default\s+)?(?:function|class|const)\s+(\w+)/g) || [];
    exports.slice(0, 5).forEach(exp => keywords.add(exp.match(/\w+/)?.[0] || ''));

    return Array.from(keywords).filter(k => k && k.length > 2);
  }

  private async buildStructure(rootPath: string, prefix: string = ''): Promise<Record<string, unknown>> {
    const structure: Record<string, unknown> = {};

    try {
      const entries = await fs.readdir(rootPath, { withFileTypes: true });

      for (const entry of entries) {
        if (['node_modules', '.git', 'dist', 'build'].includes(entry.name)) continue;

        if (entry.isDirectory()) {
          structure[entry.name] = await this.buildStructure(path.join(rootPath, entry.name), prefix + '  ');
        } else {
          structure[entry.name] = 'file';
        }
      }
    } catch (error) {
      console.error(`Error building structure for ${rootPath}:`, error);
    }

    return structure;
  }

  private async extractDependencies(rootPath: string): Promise<string[]> {
    const dependencies: Set<string> = new Set();

    // Check package.json
    try {
      const packageJsonPath = path.join(rootPath, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const json = JSON.parse(content) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };

      if (json.dependencies) {
        Object.keys(json.dependencies).forEach(dep => dependencies.add(dep));
      }
      if (json.devDependencies) {
        Object.keys(json.devDependencies).forEach(dep => dependencies.add(dep));
      }
    } catch {
      // No package.json
    }

    // Check requirements.txt for Python
    try {
      const reqPath = path.join(rootPath, 'requirements.txt');
      const content = await fs.readFile(reqPath, 'utf-8');
      content.split('\n').forEach(line => {
        const dep = line.split('==')[0].trim();
        if (dep) dependencies.add(dep);
      });
    } catch {
      // No requirements.txt
    }

    return Array.from(dependencies);
  }

  private detectFrameworks(files: FileAnalysis[]): string[] {
    const frameworks: Set<string> = new Set();
    const content = files.map(f => f.summary + ' ' + f.keywords.join(' ')).join('\n');

    const frameworkPatterns = {
      'React': /react|jsx|tsx/i,
      'Vue': /vue|\.vue/i,
      'Angular': /angular|@angular/i,
      'Svelte': /svelte/i,
      'Next.js': /next\.js|next/i,
      'TypeScript': /typescript|\.ts/i,
      'Tailwind': /tailwind|@tailwindcss/i,
      'Express': /express/i,
      'FastAPI': /fastapi/i,
      'Django': /django/i
    };

    for (const [framework, pattern] of Object.entries(frameworkPatterns)) {
      if (pattern.test(content)) {
        frameworks.add(framework);
      }
    }

    return Array.from(frameworks);
  }

  private generateSummary(files: FileAnalysis[], frameworks: string[]): string {
    const totalLines = files.reduce((sum, f) => sum + f.lines, 0);
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const fileTypes = new Set(files.map(f => f.type));

    return `Project with ${files.length} files (${totalLines} lines, ${(totalSize / 1024).toFixed(2)}KB). ` +
      `File types: ${Array.from(fileTypes).join(', ')}. ` +
      `Frameworks: ${frameworks.length > 0 ? frameworks.join(', ') : 'None detected'}.`;
  }

  // Generate context for AI prompts
  async generateContextPrompt(rootPath: string): Promise<string> {
    const analysis = await this.analyzeProject(rootPath);

    let contextPrompt = `## Project Context\n\n`;
    contextPrompt += `**Summary:** ${analysis.summary}\n\n`;

    contextPrompt += `**Frameworks:** ${analysis.frameworks.join(', ') || 'None'}\n\n`;

    contextPrompt += `**Key Dependencies:** ${analysis.dependencies.slice(0, 10).join(', ')}\n\n`;

    contextPrompt += `**Key Files:**\n`;
    analysis.files.slice(0, 20).forEach(file => {
      contextPrompt += `- \`${file.path}\`: ${file.summary}\n`;
    });

    return contextPrompt;
  }
}

export const projectContextAnalyzer = new ProjectContextAnalyzer();
