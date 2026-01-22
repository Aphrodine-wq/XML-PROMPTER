import { GenerationOptions, GenerationResponse, Model, AIProvider, ProviderConfig } from './types.js';
import { globalConnectionPool } from './connection-pool.js';

export interface IAIProvider {
  listModels(): Promise<Model[]>;
  generate(options: GenerationOptions, onChunk?: (chunk: string) => void): Promise<GenerationResponse>;
  isAvailable(): Promise<boolean>;
}

// Use connection pool for all HTTP requests (1.5-2x performance improvement)
const pooledFetch = globalConnectionPool.fetch.bind(globalConnectionPool);

// OpenAI Provider
class OpenAIProvider implements IAIProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || '';
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const response = await pooledFetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<Model[]> {
    const response = await pooledFetch(`${this.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${this.apiKey}` }
    });
    if (!response.ok) throw new Error('Failed to fetch OpenAI models');
    const data = await response.json() as { data: Array<{ id: string }> };
    return data.data.map(m => ({
      name: m.id,
      size: 0,
      digest: '',
      modified_at: new Date().toISOString(),
      provider: 'openai'
    }));
  }

  async generate(options: GenerationOptions, onChunk?: (chunk: string) => void): Promise<GenerationResponse> {
    const response = await pooledFetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: options.model,
        messages: [
          { role: 'system', content: options.system || 'You are a helpful AI assistant generating XML prompts.' },
          { role: 'user', content: options.prompt }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048,
        stream: options.stream || false
      })
    });

    if (!response.ok) throw new Error('OpenAI generation failed');

    if (options.stream && response.body) {
      let fullResponse = '';
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
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const json = JSON.parse(jsonStr);
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              if (onChunk) onChunk(content);
            }
          } catch {
            // Ignore parsing errors
          }
        }
      }

      return {
        model: options.model,
        created_at: new Date().toISOString(),
        response: fullResponse,
        done: true
      };
    } else {
      const data = await response.json() as { choices: Array<{ message: { content: string } }> };
      return {
        model: options.model,
        created_at: new Date().toISOString(),
        response: data.choices[0].message.content,
        done: true
      };
    }
  }
}

// Anthropic Provider
class AnthropicProvider implements IAIProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    return true; // Anthropic doesn't have a list endpoint, assume available if key exists
  }

  async listModels(): Promise<Model[]> {
    return [
      { name: 'claude-3-opus', size: 0, digest: '', modified_at: new Date().toISOString(), provider: 'anthropic' },
      { name: 'claude-3-sonnet', size: 0, digest: '', modified_at: new Date().toISOString(), provider: 'anthropic' },
      { name: 'claude-3-haiku', size: 0, digest: '', modified_at: new Date().toISOString(), provider: 'anthropic' }
    ];
  }

  async generate(options: GenerationOptions, onChunk?: (chunk: string) => void): Promise<GenerationResponse> {
    const response = await pooledFetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: options.model,
        max_tokens: options.maxTokens || 2048,
        system: options.system || 'You are a helpful AI assistant generating XML prompts.',
        messages: [{ role: 'user', content: options.prompt }],
        stream: options.stream || false
      })
    });

    if (!response.ok) throw new Error('Anthropic generation failed');

    if (options.stream && response.body) {
      let fullResponse = '';
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
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          try {
            const json = JSON.parse(jsonStr);
            if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
              fullResponse += json.delta.text;
              if (onChunk) onChunk(json.delta.text);
            }
          } catch {
            // Ignore parsing errors
          }
        }
      }

      return {
        model: options.model,
        created_at: new Date().toISOString(),
        response: fullResponse,
        done: true
      };
    } else {
      const data = await response.json() as { content: Array<{ type: string; text?: string }> };
      const textContent = data.content.find(c => c.type === 'text');
      return {
        model: options.model,
        created_at: new Date().toISOString(),
        response: textContent?.text || '',
        done: true
      };
    }
  }
}

// Groq Provider
class GroqProvider implements IAIProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey || process.env.GROQ_API_KEY || '';
    this.baseUrl = config.baseUrl || 'https://api.groq.com/openai/v1';
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    return true;
  }

  async listModels(): Promise<Model[]> {
    return [
      { name: 'mixtral-8x7b-32768', size: 0, digest: '', modified_at: new Date().toISOString(), provider: 'groq' },
      { name: 'llama2-70b-4096', size: 0, digest: '', modified_at: new Date().toISOString(), provider: 'groq' },
      { name: 'gemma-7b-it', size: 0, digest: '', modified_at: new Date().toISOString(), provider: 'groq' }
    ];
  }

  async generate(options: GenerationOptions, onChunk?: (chunk: string) => void): Promise<GenerationResponse> {
    // Groq uses OpenAI-compatible API
    const response = await pooledFetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: options.model,
        messages: [
          { role: 'system', content: options.system || 'You are a helpful AI assistant.' },
          { role: 'user', content: options.prompt }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048,
        stream: options.stream || false
      })
    });

    if (!response.ok) throw new Error('Groq generation failed');

    if (options.stream && response.body) {
      let fullResponse = '';
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
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const json = JSON.parse(jsonStr);
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              if (onChunk) onChunk(content);
            }
          } catch {
            // Ignore
          }
        }
      }

      return {
        model: options.model,
        created_at: new Date().toISOString(),
        response: fullResponse,
        done: true
      };
    } else {
      const data = await response.json() as { choices: Array<{ message: { content: string } }> };
      return {
        model: options.model,
        created_at: new Date().toISOString(),
        response: data.choices[0].message.content,
        done: true
      };
    }
  }
}

// LM Studio Provider (local, OpenAI-compatible)
class LMStudioProvider implements IAIProvider {
  private baseUrl: string;

  constructor(config: ProviderConfig) {
    this.baseUrl = config.baseUrl || 'http://localhost:1234/v1';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await pooledFetch(`${this.baseUrl}/models`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<Model[]> {
    try {
      const response = await pooledFetch(`${this.baseUrl}/models`);
      if (!response.ok) throw new Error('Failed to fetch LM Studio models');
      const data = await response.json() as { data: Array<{ id: string }> };
      return data.data.map(m => ({
        name: m.id,
        size: 0,
        digest: '',
        modified_at: new Date().toISOString(),
        provider: 'lm-studio'
      }));
    } catch {
      return [];
    }
  }

  async generate(options: GenerationOptions, onChunk?: (chunk: string) => void): Promise<GenerationResponse> {
    const response = await pooledFetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model,
        messages: [
          { role: 'system', content: options.system || 'You are a helpful AI assistant.' },
          { role: 'user', content: options.prompt }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048,
        stream: options.stream || false
      })
    });

    if (!response.ok) throw new Error('LM Studio generation failed');

    if (options.stream && response.body) {
      let fullResponse = '';
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
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const json = JSON.parse(jsonStr);
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              if (onChunk) onChunk(content);
            }
          } catch {
            // Ignore
          }
        }
      }

      return {
        model: options.model,
        created_at: new Date().toISOString(),
        response: fullResponse,
        done: true
      };
    } else {
      const data = await response.json() as { choices: Array<{ message: { content: string } }> };
      return {
        model: options.model,
        created_at: new Date().toISOString(),
        response: data.choices[0].message.content,
        done: true
      };
    }
  }
}

// HuggingFace Provider
class HuggingFaceProvider implements IAIProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey || process.env.HUGGINGFACE_API_KEY || '';
    this.baseUrl = config.baseUrl || 'https://api-inference.huggingface.co/models';
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    return true;
  }

  async listModels(): Promise<Model[]> {
    return [
      { name: 'mistralai/Mistral-7B-Instruct-v0.1', size: 0, digest: '', modified_at: new Date().toISOString(), provider: 'huggingface' },
      { name: 'meta-llama/Llama-2-7b-chat-hf', size: 0, digest: '', modified_at: new Date().toISOString(), provider: 'huggingface' }
    ];
  }

  async generate(options: GenerationOptions, onChunk?: (chunk: string) => void): Promise<GenerationResponse> {
    const response = await pooledFetch(`${this.baseUrl}/${options.model}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: `${options.system || 'You are helpful.'}\n\nUser: ${options.prompt}\n\nAssistant:`,
        parameters: {
          max_length: options.maxTokens || 2048,
          temperature: options.temperature || 0.7
        }
      })
    });

    if (!response.ok) throw new Error('HuggingFace generation failed');

    const data = await response.json() as Array<{ generated_text?: string }>;
    const generated = data[0]?.generated_text || '';
    if (onChunk) onChunk(generated);

    return {
      model: options.model,
      created_at: new Date().toISOString(),
      response: generated,
      done: true
    };
  }
}

export function createProvider(provider: AIProvider, config?: ProviderConfig): IAIProvider {
  const cfg = config || {};
  switch (provider) {
    case 'openai':
      return new OpenAIProvider(cfg);
    case 'anthropic':
      return new AnthropicProvider(cfg);
    case 'groq':
      return new GroqProvider(cfg);
    case 'lm-studio':
      return new LMStudioProvider(cfg);
    case 'huggingface':
      return new HuggingFaceProvider(cfg);
    case 'ollama':
      // Will be handled by OllamaService
      throw new Error('Use OllamaService for Ollama provider');
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
