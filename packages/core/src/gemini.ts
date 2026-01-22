import { AIProvider } from './ai-provider.js';
import { Model, GenerationOptions, GenerationResponse } from './types.js';

export class GeminiProvider implements AIProvider {
  id = 'google';
  name = 'Google Gemini';
  private apiKey: string = '';

  configure(config: Record<string, any>): void {
    if (config.apiKey) this.apiKey = config.apiKey;
  }

  async listModels(): Promise<Model[]> {
    return [
      {
        name: 'gemini-2.0-flash',
        size: 0,
        digest: 'google',
        modified_at: new Date().toISOString(),
        provider: 'google',
        details: { family: 'Gemini', format: 'API', families: ['Gemini'], parameter_size: 'Unknown', quantization_level: 'None' }
      },
      {
        name: 'gemini-1.5-pro',
        size: 0,
        digest: 'google',
        modified_at: new Date().toISOString(),
        provider: 'google',
        details: { family: 'Gemini', format: 'API', families: ['Gemini'], parameter_size: 'Unknown', quantization_level: 'None' }
      }
    ];
  }

  async generate(options: GenerationOptions, onChunk?: (chunk: string) => void, signal?: AbortSignal): Promise<GenerationResponse> {
    if (!this.apiKey) throw new Error('Gemini API Key not set');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:streamGenerateContent?key=${this.apiKey}`;
    
    // Build parts
    const parts: any[] = [];
    
    // Add text prompt
    if (options.system) {
        parts.push({ text: options.system + '\n\n' + options.prompt });
    } else {
        parts.push({ text: options.prompt });
    }

    // Add images
    if (options.images && options.images.length > 0) {
        options.images.forEach(img => {
            // Assume img is base64 string, optionally with data URI prefix
            // Gemini expects raw base64, so strip prefix if present
            const base64 = img.replace(/^data:image\/(png|jpeg|webp);base64,/, '');
            parts.push({
                inlineData: {
                    mimeType: 'image/jpeg', // Defaulting to jpeg, but ideally detect
                    data: base64
                }
            });
        });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }]
      }),
      signal
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API Error: ${err}`);
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
      
      // Gemini sends a JSON array of objects, but sometimes split across chunks.
      // However, the stream format is actually cleaner if we just look for objects.
      // Actually, standard SSE or JSON stream parsing is tricky.
      // Let's use a simpler approach: regex for "text" field if simpler parsing fails.
      
      // A robust way for Gemini stream:
      // It returns a list of JSON objects like [{...}, {...}] but incrementally?
      // Actually it returns standard JSON stream `[{...},\n{...}]` is NOT standard.
      // It returns valid JSON array `[` then objects `,` then `]`.
      
      // Let's accumulate and try to parse complete JSON objects from the buffer.
      // Since it's a single JSON array being streamed, we can strip the `[` and `]` and `,`
      // and parse individual objects.
      
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep last incomplete line

      for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        if (line === '[' || line === ']') continue;
        if (line.startsWith(',')) line = line.slice(1);
        if (line.endsWith(',')) line = line.slice(0, -1);

        try {
            const json = JSON.parse(line);
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                fullText += text;
                if (onChunk) onChunk(text);
            }
        } catch (e) {
            // console.warn('Failed to parse Gemini chunk', line);
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
