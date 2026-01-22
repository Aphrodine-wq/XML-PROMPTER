export interface IPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  
  // Lifecycle
  onInit(): Promise<void>;
  
  // Capabilities
  generators?: Record<string, (input: any) => Promise<string>>;
  commands?: Record<string, (args: any[]) => Promise<any>>;
}

export class PluginManager {
  private plugins: Map<string, IPlugin> = new Map();

  register(plugin: IPlugin) {
    this.plugins.set(plugin.id, plugin);
    plugin.onInit();
    console.log(`Plugin registered: ${plugin.name}`);
  }

  getPlugin(id: string): IPlugin | undefined {
    return this.plugins.get(id);
  }

  getGenerators(): string[] {
    const generators: string[] = [];
    for (const plugin of this.plugins.values()) {
        if (plugin.generators) {
            generators.push(...Object.keys(plugin.generators));
        }
    }
    return generators;
  }

  getToolsDescription(): string {
    let desc = "Available Skills/Tools:\n";
    for (const plugin of this.plugins.values()) {
        if (plugin.commands) {
            desc += `- Plugin: ${plugin.name} (${plugin.description})\n`;
            for (const cmd of Object.keys(plugin.commands)) {
                desc += `  - Command: ${cmd}\n`;
            }
        }
    }
    return desc;
  }

  async executeCommand(command: string, args: any[]): Promise<any> {
    for (const plugin of this.plugins.values()) {
        if (plugin.commands && plugin.commands[command]) {
            return await plugin.commands[command](args);
        }
    }
    throw new Error(`Command ${command} not found`);
  }
}

export const pluginManager = new PluginManager();
