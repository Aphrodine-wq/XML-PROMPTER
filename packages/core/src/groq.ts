import { AIProvider } from './ai-provider.js';
import { Model, GenerationOptions, GenerationResponse } from './types.js';

export class GroqProvider implements AIProvider {
  id = 'groq';
  name = 'Groq (Llama 3)';
  private apiKey: string = '';

  configure(config: Record<string, any>): void {
    if (config.apiKey) this.apiKey = config.apiKey;
  }

  async listModels(): Promise<Model[]> {
    return [
      {
        name: 'llama3-70b-8192',
        size: 0,
        digest: 'groq',
        modified_at: new Date().toISOString(),
        provider: 'groq',
        details: { family: 'Llama 3', format: 'API', families: ['Llama'], parameter_size: '70B', quantization_level: 'None' }
      },
      {
        name: 'mixtral-8x7b-32768',
        size: 0,
        digest: 'groq',
        modified_at: new Date().toISOString(),
        provider: 'groq',
        details: { family: 'Mixtral', format: 'API', families: ['Mixtral'], parameter_size: '8x7B', quantization_level: 'None' }
      }
    ];
  }

  async generate(options: GenerationOptions, onChunk?: (chunk: string) => void, signal?: AbortSignal): Promise<GenerationResponse> {
    if (!this.apiKey) throw new Error('Groq API Key not set');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: options.model,
        messages: [
          ...(options.system ? [{ role: 'system', content: options.system }] : []),
          { role: 'user', content: options.prompt }
        ],
        stream: true
      }),
      signal
    });

    if (!response.ok) {
       const err = await response.text();
       throw new Error(`Groq API Error: ${err}`);
    }

    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim() || line.trim() === 'data: [DONE]') continue;
        if (line.startsWith('data: ')) {
            try {
                const json = JSON.parse(line.slice(6));
                const text = json.choices?.[0]?.delta?.content;
                if (text) {
                    fullText += text;
                    if (onChunk) onChunk(text);
                }
            } catch (e) {
                // Ignore parse errors
            }
        }
      }
    }

    return {
      model: options.model,
      created_at: new Date().toISOString(),
      response: fullText,
      done: true
    };
  }

  async checkHealth(): Promise<boolean> {
    return !!this.apiKey;
  }
}
