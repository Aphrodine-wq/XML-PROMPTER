/**
 * Plugin System - Extensible Architecture
 *
 * Provides a plugin/extension system for XML-PROMPTER:
 * - Dynamic plugin loading and unloading
 * - Lifecycle hooks (init, beforeGenerate, afterGenerate, cleanup)
 * - Event system for cross-plugin communication
 * - Sandboxed execution context
 * - Plugin versioning and dependency management
 *
 * Performance Impact: Enables community contributions and custom workflows
 *
 * @module plugin-system
 */

export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  dependencies?: Record<string, string>;
  permissions?: PluginPermission[];
}

export type PluginPermission =
  | 'filesystem:read'
  | 'filesystem:write'
  | 'network:fetch'
  | 'ai:generate'
  | 'database:read'
  | 'database:write'
  | 'system:exec';

export interface PluginContext {
  config: Record<string, any>;
  cache: Map<string, any>;
  logger: PluginLogger;
  events: EventEmitter;
  utils: PluginUtils;
}

export interface PluginLogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

export interface PluginUtils {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  fetch(url: string, options?: any): Promise<any>;
  generateXML(prompt: string): Promise<string>;
}

export interface Plugin {
  metadata: PluginMetadata;

  // Lifecycle hooks
  init?(context: PluginContext): Promise<void>;
  cleanup?(): Promise<void>;

  // Generation hooks
  beforeGenerate?(prompt: string, context: PluginContext): Promise<string>;
  afterGenerate?(result: string, context: PluginContext): Promise<string>;

  // Transform hooks
  transformPrompt?(prompt: string): Promise<string>;
  transformResult?(result: string): Promise<string>;

  // UI hooks (for Electron app)
  registerCommands?(): PluginCommand[];
  registerViews?(): PluginView[];
}

export interface PluginCommand {
  id: string;
  label: string;
  shortcut?: string;
  handler: () => void | Promise<void>;
}

export interface PluginView {
  id: string;
  label: string;
  icon?: string;
  component: any; // React component
}

export interface EventEmitter {
  on(event: string, handler: (...args: any[]) => void): void;
  off(event: string, handler: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): void;
}

/**
 * Simple EventEmitter implementation
 */
class SimpleEventEmitter implements EventEmitter {
  private handlers: Map<string, Set<(...args: any[]) => void>> = new Map();

  on(event: string, handler: (...args: any[]) => void): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off(event: string, handler: (...args: any[]) => void): void {
    this.handlers.get(event)?.delete(handler);
  }

  emit(event: string, ...args: any[]): void {
    this.handlers.get(event)?.forEach((handler) => {
      try {
        handler(...args);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }
}

/**
 * PluginManager manages the plugin lifecycle and execution
 */
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private contexts: Map<string, PluginContext> = new Map();
  private eventEmitter = new SimpleEventEmitter();
  private permissionChecker?: (plugin: string, permission: PluginPermission) => boolean;

  /**
   * Set a custom permission checker
   */
  setPermissionChecker(checker: (plugin: string, permission: PluginPermission) => boolean): void {
    this.permissionChecker = checker;
  }

  /**
   * Register a new plugin
   */
  async registerPlugin(plugin: Plugin): Promise<void> {
    const { name, version } = plugin.metadata;
    const pluginId = `${name}@${version}`;

    if (this.plugins.has(pluginId)) {
      throw new Error(`Plugin ${pluginId} is already registered`);
    }

    // Check dependencies
    if (plugin.metadata.dependencies) {
      for (const [depName, depVersion] of Object.entries(plugin.metadata.dependencies)) {
        const depId = `${depName}@${depVersion}`;
        if (!this.plugins.has(depId)) {
          throw new Error(`Missing dependency: ${depId}`);
        }
      }
    }

    // Create plugin context
    const context = this.createPluginContext(pluginId);
    this.contexts.set(pluginId, context);

    // Initialize plugin
    if (plugin.init) {
      await plugin.init(context);
    }

    this.plugins.set(pluginId, plugin);
    this.eventEmitter.emit('plugin:registered', pluginId);

    context.logger.info(`Plugin ${pluginId} registered successfully`);
  }

  /**
   * Unregister a plugin
   */
  async unregisterPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // Check if other plugins depend on this one
    for (const [id, p] of this.plugins) {
      if (id !== pluginId && p.metadata.dependencies) {
        const deps = Object.keys(p.metadata.dependencies).map(
          (name) => `${name}@${p.metadata.dependencies![name]}`
        );
        if (deps.includes(pluginId)) {
          throw new Error(`Cannot unregister ${pluginId}: ${id} depends on it`);
        }
      }
    }

    // Cleanup
    if (plugin.cleanup) {
      await plugin.cleanup();
    }

    this.plugins.delete(pluginId);
    this.contexts.delete(pluginId);
    this.eventEmitter.emit('plugin:unregistered', pluginId);
  }

  /**
   * Execute beforeGenerate hooks for all plugins
   */
  async executeBeforeGenerate(prompt: string): Promise<string> {
    let modifiedPrompt = prompt;

    for (const [pluginId, plugin] of this.plugins) {
      if (plugin.beforeGenerate) {
        const context = this.contexts.get(pluginId)!;
        try {
          modifiedPrompt = await plugin.beforeGenerate(modifiedPrompt, context);
        } catch (error) {
          context.logger.error('beforeGenerate hook failed', error);
        }
      }
    }

    return modifiedPrompt;
  }

  /**
   * Execute afterGenerate hooks for all plugins
   */
  async executeAfterGenerate(result: string): Promise<string> {
    let modifiedResult = result;

    for (const [pluginId, plugin] of this.plugins) {
      if (plugin.afterGenerate) {
        const context = this.contexts.get(pluginId)!;
        try {
          modifiedResult = await plugin.afterGenerate(modifiedResult, context);
        } catch (error) {
          context.logger.error('afterGenerate hook failed', error);
        }
      }
    }

    return modifiedResult;
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): PluginMetadata[] {
    return Array.from(this.plugins.values()).map((p) => p.metadata);
  }

  /**
   * Get a specific plugin
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all plugin commands
   */
  getAllCommands(): Array<PluginCommand & { pluginId: string }> {
    const commands: Array<PluginCommand & { pluginId: string }> = [];

    for (const [pluginId, plugin] of this.plugins) {
      if (plugin.registerCommands) {
        const pluginCommands = plugin.registerCommands();
        commands.push(...pluginCommands.map((cmd) => ({ ...cmd, pluginId })));
      }
    }

    return commands;
  }

  /**
   * Get all plugin views
   */
  getAllViews(): Array<PluginView & { pluginId: string }> {
    const views: Array<PluginView & { pluginId: string }> = [];

    for (const [pluginId, plugin] of this.plugins) {
      if (plugin.registerViews) {
        const pluginViews = plugin.registerViews();
        views.push(...pluginViews.map((view) => ({ ...view, pluginId })));
      }
    }

    return views;
  }

  /**
   * Create a sandboxed context for a plugin
   */
  private createPluginContext(pluginId: string): PluginContext {
    const plugin = this.plugins.get(pluginId) || ({} as Plugin);

    const logger: PluginLogger = {
      debug: (msg, ...args) => console.debug(`[${pluginId}]`, msg, ...args),
      info: (msg, ...args) => console.info(`[${pluginId}]`, msg, ...args),
      warn: (msg, ...args) => console.warn(`[${pluginId}]`, msg, ...args),
      error: (msg, ...args) => console.error(`[${pluginId}]`, msg, ...args),
    };

    const utils: PluginUtils = {
      readFile: async (path: string) => {
        this.checkPermission(pluginId, 'filesystem:read');
        const fs = await import('fs/promises');
        return fs.readFile(path, 'utf-8');
      },
      writeFile: async (path: string, content: string) => {
        this.checkPermission(pluginId, 'filesystem:write');
        const fs = await import('fs/promises');
        return fs.writeFile(path, content, 'utf-8');
      },
      fetch: async (url: string, options?: any) => {
        this.checkPermission(pluginId, 'network:fetch');
        const response = await fetch(url, options);
        return response.json();
      },
      generateXML: async (prompt: string) => {
        this.checkPermission(pluginId, 'ai:generate');
        // This would integrate with the AI manager
        throw new Error('Not implemented');
      },
    };

    return {
      config: {},
      cache: new Map(),
      logger,
      events: this.eventEmitter,
      utils,
    };
  }

  /**
   * Check if a plugin has permission
   */
  private checkPermission(pluginId: string, permission: PluginPermission): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    const hasPermission = plugin.metadata.permissions?.includes(permission);
    if (!hasPermission) {
      throw new Error(`Plugin ${pluginId} does not have permission: ${permission}`);
    }

    if (this.permissionChecker && !this.permissionChecker(pluginId, permission)) {
      throw new Error(`Permission denied: ${pluginId} cannot use ${permission}`);
    }
  }
}

// Singleton instance
export const pluginManager = new PluginManager();

/**
 * Example plugin implementation
 */
export const examplePlugin: Plugin = {
  metadata: {
    name: 'example-plugin',
    version: '1.0.0',
    description: 'Example plugin demonstrating the plugin API',
    author: 'XML-PROMPTER Team',
    permissions: ['ai:generate'],
  },

  async init(context) {
    context.logger.info('Example plugin initialized');
  },

  async beforeGenerate(prompt, context) {
    context.logger.info('Processing prompt before generation');
    // Add a prefix to all prompts
    return `Enhanced: ${prompt}`;
  },

  async afterGenerate(result, context) {
    context.logger.info('Processing result after generation');
    // Add metadata to result
    return result + '\n<!-- Generated with example-plugin -->';
  },

  registerCommands() {
    return [
      {
        id: 'example.hello',
        label: 'Say Hello',
        handler: () => {
          console.log('Hello from example plugin!');
        },
      },
    ];
  },
};
