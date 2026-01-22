import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '../store';
import { ollama } from '@xmlpg/core';

// Mock Ollama Core
vi.mock('@xmlpg/core', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    ollama: {
      listModels: vi.fn(),
      generate: vi.fn(),
      pull: vi.fn()
    },
    historyManager: {
      getHistory: vi.fn(() => []),
      addEntry: vi.fn()
    },
    templateManager: {
      getTemplates: vi.fn(() => []),
      addTemplate: vi.fn()
    }
  };
});

describe('App Store Logic', () => {
  beforeEach(() => {
    useAppStore.setState({
      prompt: '',
      xmlOutput: '',
      models: [],
      isGenerating: false
    });
    vi.clearAllMocks();
  });

  it('should update prompt state', () => {
    const { setPrompt } = useAppStore.getState();
    setPrompt('New Prompt');
    expect(useAppStore.getState().prompt).toBe('New Prompt');
  });

  it('should fetch models successfully', async () => {
    const mockModels = [{ name: 'llama3', size: 100, digest: '123', modified_at: 'now' }];
    // @ts-ignore
    ollama.listModels.mockResolvedValue(mockModels);

    const { fetchModels } = useAppStore.getState();
    await fetchModels();

    expect(useAppStore.getState().models).toEqual(mockModels);
    expect(useAppStore.getState().selectedModel).toBe('llama3');
  });

  it('should handle generation flow', async () => {
    useAppStore.setState({ 
      prompt: 'Test Prompt', 
      selectedModel: 'llama3',
      settings: { systemPrompt: 'System' } 
    });

    // @ts-ignore
    ollama.generate.mockImplementation(async (opts, cb) => {
      cb('Chunk 1');
      cb('Chunk 2');
      return { response: 'Chunk 1Chunk 2', done: true };
    });

    const { generatePrompt } = useAppStore.getState();
    await generatePrompt();

    expect(useAppStore.getState().xmlOutput).toBe('Chunk 1Chunk 2');
    expect(ollama.generate).toHaveBeenCalled();
  });
});
