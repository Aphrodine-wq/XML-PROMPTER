// import fs from 'fs/promises';
// import path from 'path';
// import { pathToFileURL } from 'url';
import { pluginManager, IPlugin } from './plugin-system.js';

export interface SkillDefinition {
  name: string;
  description?: string;
  handler: (input: any) => Promise<any>;
}

export class SkillLoader {
  private skillsDir: string;

  constructor(skillsDir?: string) {
    // Default to a 'skills' directory
    this.skillsDir = skillsDir || 'skills';
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
    console.warn('[SkillLoader] Skill loading is currently disabled in the renderer process.');
    return;
  }

  private async loadSkillFile(filePath: string) {
    // No-op
  }
}

export const skillLoader = new SkillLoader();
