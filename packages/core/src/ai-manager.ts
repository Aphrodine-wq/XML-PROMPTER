import { AIProvider } from './ai-provider.js';
import { Model, GenerationOptions, GenerationResponse, PullProgress } from './types.js';
import { OllamaProvider } from './ollama.js';
import { GeminiProvider } from './gemini.js';
import { GroqProvider } from './groq.js';
import { storage } from './storage.js';

export class AIManager {
  private providers: Map<string, AIProvider> = new Map();

  constructor() {
    this.registerProvider(new OllamaProvider());
    this.registerProvider(new GeminiProvider());
    this.registerProvider(new GroqProvider());
    
    // Load config from storage
    this.loadConfig();
  }

  private loadConfig() {
    const config = storage.load<Record<string, any>>('ai-config', {});
    this.providers.forEach(provider => {
        if (config[provider.id]) {
            provider.configure(config[provider.id]);
        }
    });
  }

  saveConfig(providerId: string, config: Record<string, any>) {
    const current = storage.load<Record<string, any>>('ai-config', {});
    current[providerId] = { ...current[providerId], ...config };
    storage.save('ai-config', current);
    
    const provider = this.providers.get(providerId);
    if (provider) {
        provider.configure(config);
    }
  }

  registerProvider(provider: AIProvider) {
    this.providers.set(provider.id, provider);
  }

  getProvider(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  async listModels(): Promise<Model[]> {
    const allModels: Model[] = [];
    for (const provider of this.providers.values()) {
        try {
            const models = await provider.listModels();
            allModels.push(...models);
        } catch (e) {
            console.warn(`Failed to list models for ${provider.name}`, e);
        }
    }
    return allModels;
  }

  async generate(options: GenerationOptions, onChunk?: (chunk: string) => void, signal?: AbortSignal): Promise<GenerationResponse> {
    // Detect provider from model object if passed, or find it
    // The UI should pass `provider` in options, or we infer it
    let providerId = options.provider;
    
    if (!providerId) {
        // Infer from model object in list
        // This requires the UI to pass the full model object or we search
        // For now, let's assume the UI passes provider or we search
        const models = await this.listModels();
        const model = models.find(m => m.name === options.model);
        if (model?.provider) {
            providerId = model.provider;
        } else {
            providerId = 'ollama'; // Default
        }
    }

    const provider = this.providers.get(providerId as string);
    if (!provider) throw new Error(`Provider ${providerId} not found`);

    return provider.generate(options, onChunk, signal);
  }

  async checkHealth(): Promise<boolean> {
    // If ANY provider is healthy, we are healthy
    for (const provider of this.providers.values()) {
        if (await provider.checkHealth()) return true;
    }
    return false;
  }
}

export const aiManager = new AIManager();
