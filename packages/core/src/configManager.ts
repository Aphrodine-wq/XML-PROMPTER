import { storage } from './storage.js';

export interface ProjectConfig {
  name: string;
  version: string;
  personas?: string[]; // Custom personas for this project
  settings?: Record<string, any>;
}

export class ConfigManager {
  private configPath = '.xmlpg/config.json';
  
  // This is a helper that the App/CLI will use to write to the actual FS
  // The Core just manages the structure logic
  
  createDefaultConfig(name: string): ProjectConfig {
    return {
        name,
        version: '1.0.0',
        settings: {
            theme: 'dark',
            autoSave: true
        }
    };
  }

  validateConfig(config: any): boolean {
      return config && typeof config.name === 'string';
  }
}

export const configManager = new ConfigManager();
