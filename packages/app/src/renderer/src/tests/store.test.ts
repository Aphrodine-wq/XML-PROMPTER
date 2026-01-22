import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '../store';
import { ollama } from '@xmlpg/core';

// Mock lodash throttle to execute immediately
vi.mock('lodash', () => ({
  throttle: (fn: any) => fn
}));

// Mock Window API
global.window = {
  api: {
    saveHistory: vi.fn(),
    readHistory: vi.fn(),
    readTemplates: vi.fn(),
    saveSnippets: vi.fn(),
    readSnippets: vi.fn(),
  },
  dispatchEvent: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
} as any;

// Mock Ollama Core
vi.mock('@xmlpg/core', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    ollama: {
      listModels: vi.fn(),
      generate: vi.fn(),
      pull: vi.fn(),
      checkHealth: vi.fn().mockResolvedValue(true)
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
      isGenerating: false,
      personas: [{ id: 'default', systemPrompt: 'sys', name: 'def', description: 'desc' }],
      activePersonaId: 'default'
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
