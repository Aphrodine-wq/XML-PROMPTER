export const CORE_VERSION = '1.0.0';

// Core Types and Utilities
export * from './types.js';
export * from './ollama.js';
export * from './templates.js';
export * from './history.js';

// AI Provider Management
export * from './ai-provider.js';
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
export * from './realtime-collaboration.js';

// Extensibility
export * from './plugin-system.js';

// Intelligence & Search
export * from './semantic-search.js';
export * from './predictive-cache.js';

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
