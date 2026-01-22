export const CORE_VERSION = '1.0.0';

// Core Types and Utilities
export * from './types.js';
export * from './ollama.js';
export * from './templates.js';
export * from './history.js';
export * from './storage.js';
export * from './promptEngine.js';
export * from './contextBuilder.js';
export * from './codeGenerator.js';
// export * from './ai-provider.js'; // Removed duplicate
export * from './ai-manager.js';
export * from './gemini.js';
export * from './groq.js';
export * from './vfs.js';
export * from './projectIndexer.js';
export * from './configManager.js';
export * from './voice.js';
export * from './agents/types.js';
export * from './agents/planner.js';
export * from './agents/coder.js';
export * from './agents/orchestrator.js';
export * from './plugin-system.js';
export * from './plugins/python-generator.js';




// AI Provider Management
export { AIProvider as IAIProvider } from './ai-provider.js';
export * from './ai-manager.js';

// Data & Storage
export * from './database.js';
export * from './project-context.js';

// Processing & Optimization
export * from './batch-processor.js';
export * from './response-cache.js';
export * from './provider-ranking.js';
export * from './xml-validator.js';
export * from './template-composition.js';
export * from './format-exporter.js';
export * from './prompt-optimizer.js';

// Collaboration & Versioning
export * from './collaboration.js';

// 10X ENHANCEMENTS - New Modules

// Real-time Features
export * from './streaming-manager.js';
export { 
  CollaborationManager as RealtimeCollaborationManager,
  collaborationManager as realtimeCollaborationManager 
} from './realtime-collaboration.js';

// Extensibility
export * from './plugin-system.js';
export * from './skill-loader.js';

// Intelligence & Search
export * from './semantic-search.js';
export {
  PredictiveCache,
  predictiveCache,
  MultiLevelCache
} from './predictive-cache.js';

// External Integration
export * from './api-server.js';
export * from './webhook-system.js';

// Organization & Management
export * from './workspace-manager.js';

// Reliability & Performance
export * from './error-handler.js';
export * from './monitoring.js';
export * from './compression.js';
export * from './connection-pool.js';
export * from './redis.js';
export * from './vector-db.js';
