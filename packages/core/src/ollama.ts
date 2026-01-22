import { Model, GenerationOptions, GenerationResponse, PullProgress } from './types.js';

const OLLAMA_HOST = 'http://localhost:11434';

export class OllamaService {
  async listModels(): Promise<Model[]> {
    try {
      const response = await fetch(`${OLLAMA_HOST}/api/tags`);
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json() as { models: Model[] };
      return data.models;
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
    }
  }

  async pull(model: string, onProgress?: (progress: PullProgress) => void): Promise<void> {
    const response = await fetch(`${OLLAMA_HOST}/api/pull`, {
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

  async generate(options: GenerationOptions, onChunk?: (chunk: string) => void): Promise<GenerationResponse> {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    if (!response.ok) throw new Error('Failed to generate response');

    if (options.stream && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let finalResponse: GenerationResponse | null = null;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        buffer += text;
        
        const lines = buffer.split('\n');
        // Keep the last line if it's incomplete (doesn't end with newline)
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
}

export const ollama = new OllamaService();
