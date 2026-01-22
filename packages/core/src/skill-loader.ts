import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';
import { pluginManager, IPlugin } from './plugin-system.js';

export interface SkillDefinition {
  name: string;
  description?: string;
  handler: (input: any) => Promise<any>;
}

export class SkillLoader {
  private skillsDir: string;

  constructor(skillsDir?: string) {
    // Default to a 'skills' directory in the process working directory
    this.skillsDir = skillsDir || path.join(process.cwd(), 'skills');
  }

  /**
   * Set the directory to load skills from
   */
  setSkillsDir(dirPath: string) {
    this.skillsDir = dirPath;
  }

  /**
   * Load all skills from the configured directory
   */
  async loadSkills() {
    try {
      // Ensure directory exists
      try {
        await fs.access(this.skillsDir);
      } catch {
        await fs.mkdir(this.skillsDir, { recursive: true });
      }

      const files = await fs.readdir(this.skillsDir);

      for (const file of files) {
        if (file.endsWith('.js') || file.endsWith('.ts')) {
          await this.loadSkillFile(path.join(this.skillsDir, file));
        }
      }
      console.log(`[SkillLoader] Scanned ${this.skillsDir} for skills`);
    } catch (error) {
      console.error('[SkillLoader] Failed to load skills:', error);
    }
  }

  private async loadSkillFile(filePath: string) {
    try {
      // Use file URL for dynamic import to handle Windows paths correctly
      const fileUrl = pathToFileURL(filePath).href;
      
      // Dynamic import
      const module = await import(fileUrl);
      
      // Support default export or named 'skill' export
      const skill: SkillDefinition = module.default || module.skill;

      if (!skill || !skill.name || !skill.handler) {
        console.warn(`[SkillLoader] Invalid skill definition in ${filePath}. Must export 'skill' or default object with name and handler.`);
        return;
      }

      // Wrap as Plugin
      const pluginId = `skill-${path.basename(filePath, path.extname(filePath)).toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      
      const plugin: IPlugin = {
        id: pluginId,
        name: skill.name,
        version: '1.0.0',
        description: skill.description || 'Custom loaded skill',
        onInit: async () => {
          console.log(`[SkillLoader] Initialized skill: ${skill.name}`);
        },
        // Expose as a command that can be called by the AI
        commands: {
          [skill.name]: async (args: any[]) => {
            try {
              return await skill.handler(args[0]);
            } catch (e: any) {
              return `Error executing skill ${skill.name}: ${e.message}`;
            }
          }
        }
      };

      // Register with the central plugin manager
      pluginManager.register(plugin);
      console.log(`[SkillLoader] Registered skill: ${skill.name} (${pluginId})`);
      
    } catch (error) {
      console.error(`[SkillLoader] Error loading skill file ${filePath}:`, error);
    }
  }
}

export const skillLoader = new SkillLoader();
