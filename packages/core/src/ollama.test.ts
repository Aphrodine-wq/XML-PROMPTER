import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ollama } from './ollama';

global.fetch = vi.fn();

describe('OllamaService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should list models successfully', async () => {
    const mockModels = {
      models: [
        { name: 'llama2', modified_at: '2023-01-01', size: 1000, digest: '123' }
      ]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockModels,
    });

    const models = await ollama.listModels();
    expect(models).toHaveLength(1);
    expect(models[0].name).toBe('llama2');
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:11434/api/tags', expect.anything());
  });

  it('should handle list models error', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const models = await ollama.listModels();
    expect(models).toEqual([]);
  });

  it('should generate response (non-streaming)', async () => {
    const mockResponse = { response: 'Hello world', done: true };
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await ollama.generate({ model: 'llama2', prompt: 'hi' });
    expect(result.response).toBe('Hello world');
  });
});
