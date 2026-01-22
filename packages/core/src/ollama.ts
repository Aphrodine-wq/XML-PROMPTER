import { AIProvider } from './ai-provider.js';
import { Model, GenerationOptions, GenerationResponse, PullProgress } from './types.js';

const OLLAMA_HOST = 'http://localhost:11434';

interface ServiceConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export class OllamaProvider implements AIProvider {
  id = 'ollama';
  name = 'Ollama (Local)';
  
  private config: ServiceConfig;

  constructor(config: ServiceConfig = {}) {
    this.config = {
      baseUrl: OLLAMA_HOST,
      timeout: 30000,
      retries: 3,
      ...config
    };
  }

  configure(config: Record<string, any>): void {
    this.config = { ...this.config, ...config };
  }

  private async fetchWithRetry(url: string, options: RequestInit, retries = this.config.retries!): Promise<Response> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), this.config.timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: options.signal || controller.signal,
      });
      
      clearTimeout(id);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error: any) {
      if (retries > 0 && error.name !== 'AbortError') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    }
  }

  async listModels(): Promise<Model[]> {
    try {
      const response = await this.fetchWithRetry(`${this.config.baseUrl}/api/tags`, {
        method: 'GET'
      });
      const data = await response.json() as { models: Model[] };
      return data.models.map(m => ({ ...m, provider: 'ollama' }));
    } catch (error) {
      // console.error('Error listing models:', error);
      return [];
    }
  }

  async pull(model: string, onProgress?: (progress: PullProgress) => void): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model, stream: true }),
    });

    if (!response.ok) throw new Error('Failed to pull model');

    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        buffer += text;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line) as PullProgress;
            if (onProgress) onProgress(json);
          } catch (e) {
            console.error('Error parsing pull chunk:', e);
          }
        }
      }
    }
  }

  async generate(
    options: GenerationOptions, 
    onChunk?: (chunk: string) => void, 
    signal?: AbortSignal
  ): Promise<GenerationResponse> {
    // Sanitize options to remove unknown fields that break Ollama 0.5.x
    // Ollama 0.5+ is strict about JSON unmarshalling
    const { model, prompt, stream, system, template, context, options: modelOptions } = options;
    
    // Only include fields that Ollama's API actually accepts
    // See: https://github.com/ollama/ollama/blob/main/docs/api.md#generate-a-completion
    const payload: any = {
        model,
        prompt,
        stream: !!stream
    };

    if (system) payload.system = system;
    if (template) payload.template = template;
    if (context) payload.context = context;
    if (modelOptions) payload.options = modelOptions;

    // Use default json format if requesting json
    if (modelOptions && modelOptions.format) {
        payload.format = modelOptions.format;
    }

    const response = await fetch(`${this.config.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate response: ${response.status} ${response.statusText} - ${errorText}`);
    }

    if (options.stream && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let finalResponse: GenerationResponse | null = null;
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          buffer += text;
          
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const json = JSON.parse(line) as GenerationResponse;
              if (onChunk) onChunk(json.response);
              if (json.done) finalResponse = json;
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      } catch (e: any) {
        if (e.name === 'AbortError') {
          throw new Error('Generation cancelled');
        }
        throw e;
      }

      // Process remaining buffer
      if (buffer.trim()) {
        try {
          const json = JSON.parse(buffer) as GenerationResponse;
          if (onChunk) onChunk(json.response);
          if (json.done) finalResponse = json;
        } catch (e) {
          // Ignore
        }
      }
      
      if (!finalResponse) throw new Error('Stream ended without done signal');
      return finalResponse;
    } else {
      return await response.json() as GenerationResponse;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`); // Simple health check
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Backward compatibility
export const ollama = new OllamaProvider();
