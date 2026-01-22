import { create } from 'zustand';
import { createAuthSlice, AuthSlice } from './store/authSlice';
import { createEditorSlice, EditorSlice } from './store/editorSlice';
import { createSettingsSlice, SettingsSlice } from './store/settingsSlice';
import { createProjectSlice, ProjectSlice } from './store/projectSlice';
import { 
  ollama, 
  historyManager, 
  templateManager, 
  Template, 
  HistoryItem, 
  codeGenerator, 
  storage, 
  StorageProvider,
  aiManager,
  predictiveCache,
  streamingManager,
  agentOrchestrator
} from '@xmlpg/core';
import { throttle } from 'lodash';
import { toast } from 'sonner';

interface Snippet {
  id: string;
  name: string;
  content: string;
}

interface SharedSlice {
  // Data
  templates: Template[];
  history: HistoryItem[];
  snippets: Snippet[];
  refreshData: () => void;
  loadTemplate: (template: Template) => void;
  loadHistory: (item: HistoryItem) => void;
  addSnippet: (name: string, content: string) => Promise<void>;
  
  // Connection
  isConnected: boolean;
  checkConnection: () => Promise<void>;
  
  // App
  isZenMode: boolean;
  toggleZenMode: () => void;
  init: () => Promise<void>;
  
  // Abort Controller for Generation
  abortController: AbortController | null;

  // AI Configuration
  updateAIConfig: (provider: string, config: any) => void;
}

// Browser Storage Provider using LocalStorage/Window API
class BrowserStorageProvider implements StorageProvider {
  save<T>(key: string, data: T): void {
    if (window.api && window.api.saveHistory && key === 'history') {
        window.api.saveHistory(data as any);
        return;
    }
    // Fallback to localStorage
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.warn('LocalStorage save failed', e);
    }
  }

  load<T>(key: string, defaultValue: T): T {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch {
        return defaultValue;
    }
  }

  clear(key: string): void {
    localStorage.removeItem(key);
  }
}

// Initialize Core Storage with Browser Provider
storage.setProvider(new BrowserStorageProvider());

type AppState = AuthSlice & EditorSlice & SettingsSlice & ProjectSlice & SharedSlice;

export const useAppStore = create<AppState>((set, get, api) => ({
  ...createAuthSlice(set, get, api),
  ...createEditorSlice(set, get, api),
  ...createSettingsSlice(set, get, api),
  ...createProjectSlice(set, get, api),

  // Shared Data
  templates: [],
  history: [],
  snippets: [],
  
  refreshData: () => set({ 
    templates: templateManager.getTemplates(),
    history: historyManager.getHistory()
  }),
  
  loadTemplate: (t) => {
    set({ xmlOutput: t.content });
    toast.info(`Loaded template: ${t.name}`);
  },
  
  loadHistory: (h) => {
    set({ prompt: h.prompt, xmlOutput: h.response });
    toast.info("Restored from history");
  },
  
  addSnippet: async (name, content) => {
    const newSnippet = { id: Date.now().toString(), name, content };
    const updatedSnippets = [...get().snippets, newSnippet];
    set({ snippets: updatedSnippets });
    if (window.api) await window.api.saveSnippets(updatedSnippets);
    toast.success("Snippet saved");
  },

  // Connection
  isConnected: true,
  checkConnection: async () => {
    try {
      const healthy = await aiManager.checkHealth();
      set({ isConnected: healthy });
    } catch {
      set({ isConnected: false });
    }
  },

  // App Global
  isZenMode: false,
  toggleZenMode: () => set((state) => ({ isZenMode: !state.isZenMode })),
  
  resetProject: () => {
    set({
        // Project
        activeProjectPath: null,
        projectFiles: [],
        projectContext: '',
        currentFilePath: null,
        // Editor
        prompt: '',
        xmlOutput: '',
        originalXmlOutput: '',
        codeOutput: '',
        selectedImages: [],
        isAgentMode: false,
        agentProgress: []
    });
    toast.info("Project reset");
  },

  init: async () => {
    if (typeof window !== 'undefined' && window.api) {
      // Load saved data
      const [savedTemplates, savedHistory, savedSnippets] = await Promise.all([
        window.api.readTemplates(),
        window.api.readHistory(),
        window.api.readSnippets()
      ]);
      
      if (savedTemplates?.length) set({ templates: savedTemplates });
      else set({ templates: templateManager.getTemplates() });

      if (savedHistory?.length) set({ history: savedHistory });
      else set({ history: historyManager.getHistory() });

      if (savedSnippets?.length) set({ snippets: savedSnippets });
    } else {
      set({ 
        templates: templateManager.getTemplates(),
        history: historyManager.getHistory()
      });
    }

    const poll = async () => { await get().checkConnection(); };
    poll();
    setInterval(poll, 10000);
  },

  // Abort Controller
  abortController: null,

  updateAIConfig: (provider, config) => {
    aiManager.saveConfig(provider, config);
    toast.success(`${provider} configuration saved`);
    get().checkConnection();
  },

  // Override Generator Methods to use Slices
  generatePrompt: async () => {
    const { prompt, selectedModel, personas, activePersonaId, isRefining, refinePrompt, projectContext, selectedImages } = get();
    
    if (isRefining) return refinePrompt();
    if ((!prompt && selectedImages.length === 0) || !selectedModel) return;
    
    const activePersona = personas.find(p => p.id === activePersonaId) || personas[0];
    
    // Create new abort controller
    const controller = new AbortController();
    set({ isGenerating: true, xmlOutput: '', abortController: controller });
    
    const updateUI = throttle((text: string) => {
      set({ xmlOutput: text });
    }, 50);

    const streamId = `gen-${Date.now()}`;
    const fullPrompt = `Generate an XML website prompt for: "${prompt}". 
        System: ${activePersona.systemPrompt}
        Context: ${projectContext}`;

    try {
      // Check cache first (Predictive Cache 10x speedup)
      const cached = await predictiveCache.get(fullPrompt);
      if (cached) {
          set({ xmlOutput: cached.response });
          toast.success("Loaded from cache (Instant!)");
          set({ isGenerating: false, abortController: null });
          return;
      }

      let finalOutput = '';
      
      // Find the provider for this model
      const models = await aiManager.listModels();
      const modelInfo = models.find(m => m.name === selectedModel);
      const providerId = modelInfo?.provider || 'ollama';
      const provider = aiManager.getProvider(providerId);

      if (!provider) {
          throw new Error(`Provider ${providerId} not found`);
      }

      // Use direct generation with streaming support
      // StreamingManager was causing issues with OllamaProvider interface mismatch
      await provider.generate(
        {
            model: selectedModel,
            prompt: fullPrompt,
            stream: true,
            options: {
                // Pass any specific model options here if needed
            }
        },
        (chunk) => {
            finalOutput += chunk;
            updateUI(finalOutput);
        },
        controller.signal
      );

      // On Complete
      // Save to history and cache
      historyManager.addEntry({
          prompt,
          response: finalOutput,
          model: selectedModel
      });
      set({ history: historyManager.getHistory() });
      
      // Cache the result for future 10x speedups
      await predictiveCache.set(fullPrompt, { response: finalOutput });

      if (window.api) window.api.saveHistory(historyManager.getHistory());
      toast.success("Generation complete");

    } catch (e: any) {
      if (e.message === 'Generation cancelled' || e.name === 'AbortError') {
        toast.info("Generation stopped");
      } else {
        console.error(e);
        set((state) => ({ xmlOutput: state.xmlOutput + '\n\n<!-- Error: ' + e.message + ' -->' }));
        toast.error(`Generation failed: ${e.message}`);
      }
    } finally {
      set({ isGenerating: false, abortController: null });
    }
  },

  refinePrompt: async () => {
    const { prompt, selectedModel, xmlOutput, projectContext } = get();
    if (!prompt || !selectedModel || !xmlOutput) return;

    const controller = new AbortController();
    set({ isGenerating: true, originalXmlOutput: xmlOutput, xmlOutput: '', abortController: controller });

    const updateUI = throttle((text: string) => {
      set({ xmlOutput: text });
    }, 50);

    const streamId = `refine-${Date.now()}`;
    const fullPrompt = `Refine this XML: ${get().originalXmlOutput} 
        Instruction: ${prompt}
        Context: ${projectContext}`;

    try {
      let finalOutput = '';
      
      // Find the provider for this model from the store's cached models
      const { models } = get();
      const modelInfo = models.find(m => m.name === selectedModel);
      const providerId = modelInfo?.provider || 'ollama';
      const provider = aiManager.getProvider(providerId);

      if (!provider) {
          throw new Error(`Provider ${providerId} not found`);
      }

      await provider.generate(
        {
            model: selectedModel,
            prompt: fullPrompt,
            stream: true,
            options: { }
        },
        (chunk) => {
            finalOutput += chunk;
            updateUI(finalOutput);
        },
        controller.signal
      );
      
      toast.success("Refinement complete");
      
    } catch (e: any) {
      if (e.message === 'Generation cancelled' || e.name === 'AbortError') {
        toast.info("Refinement stopped");
      } else {
        set((state) => ({ xmlOutput: state.xmlOutput + '\n\n<!-- Error: ' + e.message + ' -->' }));
        toast.error(`Refinement failed: ${e.message}`);
      }
    } finally {
      set({ isGenerating: false, prompt: '', abortController: null });
    }
  },

  enhancePrompt: async () => {
    const { prompt, selectedModel } = get();
    if (!prompt || !selectedModel) return;

    set({ isGenerating: true });
    try {
      let enhancedPrompt = '';
      await aiManager.generate({
        model: selectedModel,
        prompt: `Enhance: "${prompt}"`,
        stream: true
      }, (chunk) => {
        enhancedPrompt += chunk;
      });
      
      set({ prompt: enhancedPrompt, isGenerating: false });
      toast.success("Prompt enhanced!");
    } catch (e) {
      toast.error("Enhancement failed");
      set({ isGenerating: false });
    }
  },

  stopGeneration: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({ isGenerating: false, abortController: null });
    }
  },

  generateCode: async () => {
    const { xmlOutput, selectedModel } = get();
    if (!xmlOutput || !selectedModel) return;

    set({ isGeneratingCode: true, codeOutput: '' });
    
    const updateUI = throttle((text: string) => {
      set({ codeOutput: text });
    }, 50);

    try {
      let finalCode = '';
      await codeGenerator.generateWebApp(xmlOutput, selectedModel, (chunk) => {
        finalCode += chunk;
        updateUI(finalCode);
      });
      toast.success("Web App Generated!");
    } catch (e: any) {
      toast.error("Code Generation Failed: " + e.message);
    } finally {
      set({ isGeneratingCode: false });
    }
  },

  generateProject: async () => {
    const { xmlOutput, selectedModel, writeGeneratedProject, activeProjectPath } = get();
    if (!xmlOutput || !selectedModel) return;
    
    if (!activeProjectPath) {
        toast.error("Please open a project folder first!");
        return;
    }

    set({ isGeneratingCode: true });
    toast.info("Generating Project Structure...");

    try {
      // 1. Generate VFS
      const vfs = await codeGenerator.generateProject(xmlOutput, selectedModel, (chunk) => {
          // Optional: Show progress in a different UI element
      });
      
      // 2. Write to Disk
      const files = vfs.getFiles();
      await writeGeneratedProject(files);
      
      toast.success(`Generated ${files.length} files to project!`);
    } catch (e: any) {
      toast.error("Project Generation Failed: " + e.message);
    } finally {
      set({ isGeneratingCode: false });
    }
  },

  runAgent: async () => {
    const { prompt, selectedModel, projectContext, addAgentProgress, writeGeneratedProject, activeProjectPath } = get();
    
    if (!prompt || !selectedModel) return;
    if (!activeProjectPath) {
         toast.error("Open a project folder for Agent Mode");
         return;
    }

    set({ isGenerating: true, agentProgress: [] });
    addAgentProgress("Initializing Agent Orchestrator...");

    try {
        const results = await agentOrchestrator.executeGoal(
            prompt,
            { model: selectedModel, projectContext },
            (msg) => addAgentProgress(msg)
        );

        // Write results to disk
        // results is array of { task, result } where result is the file content
        // We assume coder agent returns full file content with path logic or we parse it
        // For simplicity now, let's assume Coder returns a VFS-like structure or just code
        // The current Coder implementation returns raw text. 
        // Let's improve Coder later to return structured files.
        // For now, we'll just save the output to a log file or if it detects code blocks
        
        addAgentProgress("Agents completed. Reviewing output...");
        
        // Naive saving for now - save all output to a "agent-output.md"
        let fullReport = "# Agent Execution Report\n\n";
        results.forEach(r => {
            fullReport += `## Task: ${r.task.description}\n\n${r.result}\n\n`;
        });
        
        await writeGeneratedProject([{ path: 'agent-report.md', content: fullReport }]);
        toast.success("Agent Run Completed! Check agent-report.md");

    } catch (e: any) {
        console.error(e);
        addAgentProgress(`Error: ${e.message}`);
        toast.error("Agent Run Failed");
    } finally {
        set({ isGenerating: false });
    }
  }
}));
