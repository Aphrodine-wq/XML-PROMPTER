import { Model, GenerationOptions, GenerationResponse, PullProgress } from './types.js';

export interface AIProvider {
  id: string;
  name: string;
  
  // Configuration
  configure(config: Record<string, any>): void;
  
  // Core Methods
  listModels(): Promise<Model[]>;
  generate(options: GenerationOptions, onChunk?: (chunk: string) => void, signal?: AbortSignal): Promise<GenerationResponse>;
  checkHealth(): Promise<boolean>;
  
  // Optional Methods
  pull?(model: string, onProgress?: (progress: PullProgress) => void): Promise<void>;
}
