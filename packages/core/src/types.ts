export type AIProvider = 'ollama' | 'openai' | 'anthropic' | 'groq' | 'lm-studio' | 'huggingface' | 'google';

export interface Model {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
  provider?: AIProvider;
  details?: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface GenerationOptions {
  model: string;
  prompt: string;
  system?: string;
  template?: string;
  context?: number[];
  stream?: boolean;
  options?: Record<string, any>;
  provider?: AIProvider;
  temperature?: number;
  maxTokens?: number;
  images?: string[]; // Base64 encoded images
}

export interface GenerationResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
  tokens_used?: number;
  cost?: number;
}

export interface PullProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

// Provider Configuration
export interface ProviderConfig {
  provider?: AIProvider;
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
}

// Analytics
export interface GenerationMetrics {
  id: string;
  provider: AIProvider;
  model: string;
  timestamp: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  duration: number;
  cost: number;
  temperature: number;
}

// Batch Processing
export interface BatchJob {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  totalItems: number;
  completedItems: number;
  failedItems: number;
  createdAt: string;
  updatedAt: string;
  items: BatchItem[];
}

export interface BatchItem {
  id: string;
  prompt: string;
  status: 'pending' | 'completed' | 'failed';
  result?: string;
  error?: string;
}

// Version Control
export interface PromptVersion {
  id: string;
  promptId: string;
  version: number;
  content: string;
  author: string;
  message: string;
  timestamp: string;
}

export interface CollaborationSession {
  id: string;
  name: string;
  participants: string[];
  createdAt: string;
  updatedAt: string;
}
