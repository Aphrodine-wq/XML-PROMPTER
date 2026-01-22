import { GenerationOptions, GenerationResponse, Model, AIProvider, ProviderConfig } from './types.js';
import { createProvider, IAIProvider } from './ai-provider.js';
import { OllamaService } from './ollama.js';
import { responseCache } from './response-cache.js';
import { providerRanking, RequestMetric } from './provider-ranking.js';

export class AIManager {
  private providers: Map<AIProvider, IAIProvider | OllamaService> = new Map();
  private currentProvider: AIProvider = 'ollama';
  private currentModel: string = 'mistral';
  private ollama: OllamaService;

  constructor() {
    this.ollama = new OllamaService();
    this.providers.set('ollama', this.ollama);
  }

  async setProvider(provider: AIProvider, config?: ProviderConfig): Promise<void> {
    if (provider === 'ollama') {
      this.providers.set('ollama', this.ollama);
    } else {
      try {
        const providerInstance = createProvider(provider, config);
        const available = await providerInstance.isAvailable();
        if (!available) {
          throw new Error(`Provider ${provider} is not available`);
        }
        this.providers.set(provider, providerInstance);
      } catch (error) {
        throw new Error(`Failed to set provider ${provider}: ${error}`);
      }
    }
    this.currentProvider = provider;
  }

  async getAvailableProviders(): Promise<AIProvider[]> {
    const providers: AIProvider[] = [];
    const allProviders: AIProvider[] = ['ollama', 'openai', 'anthropic', 'groq', 'lm-studio', 'huggingface'];

    for (const provider of allProviders) {
      try {
        const cfg = {};
        const instance = provider === 'ollama'
          ? this.ollama
          : createProvider(provider, cfg);
        if (await instance.isAvailable()) {
          providers.push(provider);
        }
      } catch {
        // Provider not available
      }
    }

    return providers;
  }

  getCurrentProvider(): AIProvider {
    return this.currentProvider;
  }

  async listModels(): Promise<Model[]> {
    const provider = this.providers.get(this.currentProvider);
    if (!provider) {
      throw new Error(`Provider ${this.currentProvider} not initialized`);
    }
    return await provider.listModels();
  }

  setModel(model: string): void {
    this.currentModel = model;
  }

  getModel(): string {
    return this.currentModel;
  }

  async generate(
    prompt: string,
    options?: Partial<GenerationOptions>,
    onChunk?: (chunk: string) => void
  ): Promise<GenerationResponse> {
    const provider = this.providers.get(this.currentProvider);
    if (!provider) {
      throw new Error(`Provider ${this.currentProvider} not initialized`);
    }

    const fullOptions: GenerationOptions = {
      model: options?.model || this.currentModel,
      prompt,
      system: options?.system,
      stream: options?.stream !== false,
      temperature: options?.temperature || 0.7,
      maxTokens: options?.maxTokens || 2048,
      ...options
    };

    // Check cache first
    const cached = responseCache.get(prompt, fullOptions.model, this.currentProvider);
    if (cached) {
      return cached;
    }

    // Track performance
    const startTime = Date.now();
    let success = false;

    try {
      const response = await provider.generate(fullOptions, onChunk);
      success = true;

      // Cache the response
      responseCache.set(prompt, fullOptions.model, this.currentProvider, response);

      // Record metric for provider ranking
      const metric: RequestMetric = {
        provider: this.currentProvider,
        responseTime: Date.now() - startTime,
        success: true,
        cost: this.estimateCost(this.currentProvider, response.response.length)
      };
      providerRanking.recordMetric(metric);

      return response;
    } catch (error) {
      // Record failed metric
      const metric: RequestMetric = {
        provider: this.currentProvider,
        responseTime: Date.now() - startTime,
        success: false,
        cost: 0
      };
      providerRanking.recordMetric(metric);

      throw error;
    }
  }

  /**
   * Estimate cost for a generation based on token count
   */
  private estimateCost(provider: AIProvider, responseLength: number): number {
    const tokenCount = Math.ceil(responseLength / 4); // Approximate tokens

    // Cost per 1000 tokens (USD) - approximate pricing
    const costMap: Record<AIProvider, number> = {
      'ollama': 0,
      'openai': 0.002,
      'anthropic': 0.003,
      'groq': 0.0001,
      'lm-studio': 0,
      'huggingface': 0.001
    };

    return (tokenCount / 1000) * (costMap[provider] || 0);
  }

  /**
   * Get best provider for current use case
   */
  async getBestProvider(criteria: 'speed' | 'cost' | 'reliability' | 'balanced' = 'balanced'): Promise<AIProvider> {
    return providerRanking.getBestProvider(criteria);
  }

  /**
   * Get provider performance metrics
   */
  getProviderMetrics() {
    return providerRanking.getRanking();
  }

  async generateWithRefinement(
    originalPrompt: string,
    feedback: string,
    onChunk?: (chunk: string) => void
  ): Promise<GenerationResponse> {
    const refinementPrompt = `
Original prompt:
${originalPrompt}

Feedback for refinement:
${feedback}

Please refine the XML prompt based on the feedback provided.
    `;

    return await this.generate(refinementPrompt, { stream: true }, onChunk);
  }

  async generateEnhancement(
    description: string,
    onChunk?: (chunk: string) => void
  ): Promise<GenerationResponse> {
    const enhancementPrompt = `
User description:
${description}

Please enhance this description to be more detailed, professional, and comprehensive. Return ONLY the enhanced description without any preamble.
    `;

    return await this.generate(enhancementPrompt, { stream: true }, onChunk);
  }
}

export const aiManager = new AIManager();
