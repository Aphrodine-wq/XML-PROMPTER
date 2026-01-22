import { create } from 'zustand';
import { ollama, Model, templateManager, historyManager, Template, HistoryItem, PullProgress } from '@xmlpg/core';
import { throttle } from 'lodash';
import { toast } from 'sonner';

interface Settings {
  systemPrompt: string;
}

interface Snippet {
  id: string;
  name: string;
  content: string;
}

interface GenerationStats {
  eval_count: number;
  eval_duration: number;
  total_duration: number;
}

interface Persona {
  id: string;
  name: string;
  systemPrompt: string;
  description: string;
}

interface ProjectFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
}

const DEFAULT_PERSONAS: Persona[] = [
  {
    id: 'default',
    name: 'Standard Architect',
    description: 'Balanced XML structure with standard conventions',
    systemPrompt: `The output must be a valid XML document starting with <website_prompt> and containing structure for page_type, style, and sections. 
    Do not include markdown backticks or explanations, just the XML.`
  },
  {
    id: 'designer',
    name: 'Creative Designer',
    description: 'Focuses on rich visual descriptions, color palettes, and modern UI trends',
    systemPrompt: `You are a creative UI/UX designer. Generate XML that emphasizes visual style, color palettes, animations, and modern layout trends. 
    Use expressive language for style attributes. Output valid XML starting with <website_prompt>.`
  },
  {
    id: 'minimalist',
    name: 'Minimalist Coder',
    description: 'Strict, concise, and efficient structure',
    systemPrompt: `You are a strict system architect. Generate minimal, efficient XML structures. Avoid verbose descriptions. Focus on hierarchy and data types.
    Output valid XML starting with <website_prompt>.`
  }
];

interface AppState {
  // Auth State
  isAuthenticated: boolean;
  user: { name: string; avatar: string } | null;
  login: () => void;
  logout: () => void;

  // Editor State
  prompt: string;
  setPrompt: (prompt: string) => void;
  
  xmlOutput: string;
  originalXmlOutput: string; // For Diff View
  setXmlOutput: (xml: string) => void;
  
  models: Model[];
  selectedModel: string;
  fetchModels: () => Promise<void>;
  selectModel: (model: string) => void;
  
  isGenerating: boolean;
  isRefining: boolean;
  toggleRefineMode: () => void;
  acceptRefinement: () => void;
  rejectRefinement: () => void;
  lastGenerationStats: GenerationStats | null;
  
  generatePrompt: () => Promise<void>;
  refinePrompt: () => Promise<void>;
  enhancePrompt: () => Promise<void>;

  // Model Management
  isPulling: boolean;
  pullProgress: PullProgress | null;
  pullModel: (modelName: string) => Promise<void>;

  // Data
  templates: Template[];
  history: HistoryItem[];
  snippets: Snippet[];
  refreshData: () => void;
  loadTemplate: (template: Template) => void;
  loadHistory: (item: HistoryItem) => void;
  addSnippet: (name: string, content: string) => Promise<void>;
  
  // Project Management
  activeProjectPath: string | null;
  projectFiles: ProjectFile[];
  projectContext: string; // Accumulated context from files
  currentFilePath: string | null;
  openProject: () => Promise<void>;
  refreshProjectFiles: () => Promise<void>;
  openFile: (path: string) => Promise<void>;
  saveCurrentFile: () => Promise<void>;
  buildProjectContext: () => Promise<void>;

  // Settings & Personas
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
  
  personas: Persona[];
  activePersonaId: string;
  setActivePersona: (id: string) => void;
  addPersona: (persona: Persona) => void;

  // Connection State
  isConnected: boolean;
  checkConnection: () => Promise<void>;

  // Zen Mode
  isZenMode: boolean;
  toggleZenMode: () => void;

  // Initialization
  init: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Mock Auth
  isAuthenticated: false,
  user: null,
  login: () => set({ 
    isAuthenticated: true, 
    user: { name: "Developer Dan", avatar: "https://github.com/shadcn.png" } 
  }),
  logout: () => set({ isAuthenticated: false, user: null }),

  // Editor
  prompt: '',
  setPrompt: (prompt) => set({ prompt }),
  
  xmlOutput: '<!-- Generated XML will appear here -->',
  originalXmlOutput: '',
  setXmlOutput: (xmlOutput) => set({ xmlOutput }),
  
  models: [],
  selectedModel: '',
  fetchModels: async () => {
    try {
      const models = await ollama.listModels();
      set({ models });
      if (models.length > 0 && !get().selectedModel) {
        set({ selectedModel: models[0].name });
      }
      set({ isConnected: true });
    } catch (e) {
      console.error("Failed to fetch models", e);
      set({ isConnected: false });
    }
  },
  selectModel: (selectedModel) => set({ selectedModel }),
  
  isGenerating: false,
  isRefining: false,
  toggleRefineMode: () => set((state) => {
    const nextState = !state.isRefining;
    return { 
      isRefining: nextState,
      // When entering refine mode, snapshot the current XML as 'original'
      originalXmlOutput: nextState ? state.xmlOutput : ''
    };
  }),

  acceptRefinement: () => set({
    isRefining: false,
    originalXmlOutput: '', // Clear snapshot
    prompt: '' // Clear prompt
  }),

  rejectRefinement: () => set((state) => ({
    isRefining: false,
    xmlOutput: state.originalXmlOutput, // Revert
    originalXmlOutput: '',
    prompt: ''
  })),

  lastGenerationStats: null,
  
  generatePrompt: async () => {
    const { prompt, selectedModel, personas, activePersonaId, isRefining, refinePrompt, projectContext } = get();
    
    // Redirect to refine logic if in refine mode
    if (isRefining) {
      return refinePrompt();
    }

    if (!prompt || !selectedModel) return;
    
    const activePersona = personas.find(p => p.id === activePersonaId) || personas[0];

    set({ isGenerating: true, xmlOutput: '', lastGenerationStats: null });
    
    const updateUI = throttle((text: string) => {
      set({ xmlOutput: text });
    }, 50);

    try {
      let finalOutput = '';
      
      const response = await ollama.generate({
        model: selectedModel,
        prompt: `Generate an XML website prompt for the following request: "${prompt}". 
        
        System Instruction:
        ${activePersona.systemPrompt}
        
        Project Context (Use existing patterns/styles if relevant):
        ${projectContext}
        `,
        stream: true
      }, (chunk) => {
        finalOutput += chunk;
        updateUI(finalOutput);
      });
      
      set({ 
        xmlOutput: finalOutput,
        lastGenerationStats: {
          eval_count: response.eval_count || 0,
          eval_duration: response.eval_duration || 0,
          total_duration: response.total_duration || 0
        }
      });
      
      historyManager.addEntry({
        prompt,
        response: finalOutput,
        model: selectedModel
      });
      set({ history: historyManager.getHistory() });
      
      if (typeof window !== 'undefined' && window.api) {
        window.api.saveHistory(historyManager.getHistory());
      }
      toast.success("Generation complete");

    } catch (e) {
      console.error(e);
      set((state) => ({ xmlOutput: state.xmlOutput + '\n\n<!-- Error: ' + e + ' -->' }));
      toast.error("Generation failed");
    } finally {
      set({ isGenerating: false });
    }
  },

  refinePrompt: async () => {
    const { prompt, selectedModel, xmlOutput, projectContext } = get();
    if (!prompt || !selectedModel || !xmlOutput) return;

    set({ isGenerating: true, lastGenerationStats: null });
    
    // Snapshot current before refining
    set({ originalXmlOutput: xmlOutput, xmlOutput: '' });

    const updateUI = throttle((text: string) => {
      set({ xmlOutput: text });
    }, 50);

    try {
      let finalOutput = '';
      
      const response = await ollama.generate({
        model: selectedModel,
        prompt: `You are an intelligent XML editor.
        
        Current XML:
        ${get().originalXmlOutput}

        Project Context:
        ${projectContext}

        User Instruction:
        ${prompt}

        Task: Rewrite the XML to incorporate the user's instruction. Keep the structure valid. Output ONLY the XML.`,
        stream: true
      }, (chunk) => {
        finalOutput += chunk;
        updateUI(finalOutput);
      });
      
      set({ 
        xmlOutput: finalOutput,
        lastGenerationStats: {
          eval_count: response.eval_count || 0,
          eval_duration: response.eval_duration || 0,
          total_duration: response.total_duration || 0
        }
      });
      toast.success("Refinement complete");

    } catch (e) {
      set((state) => ({ xmlOutput: state.xmlOutput + '\n\n<!-- Error: ' + e + ' -->' }));
      toast.error("Refinement failed");
    } finally {
      set({ isGenerating: false, prompt: '' }); // Clear prompt after refinement
    }
  },

  enhancePrompt: async () => {
    const { prompt, selectedModel } = get();
    if (!prompt || !selectedModel) return;

    set({ isGenerating: true });
    try {
      let enhancedPrompt = '';
      await ollama.generate({
        model: selectedModel,
        prompt: `Enhance this website description to be more detailed and professional. Keep it concise but add specific sections and features. Input: "${prompt}". Output only the enhanced description, no pleasantries.`,
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

  // Model Management
  isPulling: false,
  pullProgress: null,
  pullModel: async (modelName: string) => {
    set({ isPulling: true, pullProgress: { status: 'starting' } });
    try {
      await ollama.pull(modelName, (progress) => {
        set({ pullProgress: progress });
      });
      toast.success(`Successfully downloaded ${modelName}`);
      await get().fetchModels(); // Refresh list
    } catch (e) {
      toast.error(`Failed to download ${modelName}`);
      console.error(e);
    } finally {
      set({ isPulling: false, pullProgress: null });
    }
  },

  // Data
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
    
    if (typeof window !== 'undefined' && window.api) {
      await window.api.saveSnippets(updatedSnippets);
    }
    toast.success("Snippet saved");
  },

  // Project Management
  activeProjectPath: null,
  projectFiles: [],
  projectContext: '',
  currentFilePath: null,
  openProject: async () => {
    if (typeof window === 'undefined' || !window.api) return;
    const path = await window.api.openFolderDialog();
    if (path) {
      set({ activeProjectPath: path });
      await get().refreshProjectFiles();
      toast.success("Project opened");
    }
  },
  refreshProjectFiles: async () => {
    const { activeProjectPath } = get();
    if (!activeProjectPath || !window.api) return;
    const files = await window.api.readDirectory(activeProjectPath);
    set({ projectFiles: files });
    
    // Build context in background
    get().buildProjectContext();
  },
  buildProjectContext: async () => {
    const { projectFiles } = get();
    if (!window.api || projectFiles.length === 0) return;
    
    let context = "Files in project:\n";
    // Read up to 5 files to avoid token limits
    for (const file of projectFiles.slice(0, 5)) {
      const content = await window.api.readFile(file.path);
      if (content) {
        // Truncate content
        const truncated = content.slice(0, 500).replace(/\s+/g, ' ');
        context += `- ${file.name}: ${truncated}...\n`;
      }
    }
    set({ projectContext: context });
    console.log("Project Context Built:", context.length, "chars");
  },
  openFile: async (path) => {
    if (!window.api) return;
    const content = await window.api.readFile(path);
    if (content !== null) {
      set({ xmlOutput: content, currentFilePath: path });
    } else {
      toast.error("Failed to read file");
    }
  },
  saveCurrentFile: async () => {
    const { currentFilePath, xmlOutput } = get();
    if (!currentFilePath || !window.api) {
      // Fallback to save dialog if no file is open
      if (window.api) {
         const saved = await window.api.saveFileDialog(xmlOutput);
         if (saved) toast.success("File saved");
      }
      return;
    }
    const success = await window.api.writeFile(currentFilePath, xmlOutput);
    if (success) {
      toast.success("File saved");
      get().buildProjectContext(); // Rebuild context on save
    } else {
      toast.error("Failed to save file");
    }
  },

  // Settings & Personas
  settings: {
    systemPrompt: DEFAULT_PERSONAS[0].systemPrompt
  },
  updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),
  
  personas: DEFAULT_PERSONAS,
  activePersonaId: 'default',
  setActivePersona: (id) => set({ activePersonaId: id }),
  addPersona: (persona) => set((state) => ({ personas: [...state.personas, persona] })),

  // Connection State
  isConnected: true,
  checkConnection: async () => {
    await get().fetchModels();
  },

  // Zen Mode
  isZenMode: false,
  toggleZenMode: () => set((state) => ({ isZenMode: !state.isZenMode })),

  // Initialization
  init: async () => {
    if (typeof window !== 'undefined' && window.api) {
      const savedTemplates = await window.api.readTemplates();
      const savedHistory = await window.api.readHistory();
      const savedSnippets = await window.api.readSnippets();
      
      if (savedTemplates && savedTemplates.length > 0) {
        set({ templates: savedTemplates });
      } else {
        set({ templates: templateManager.getTemplates() });
      }

      if (savedHistory && savedHistory.length > 0) {
        set({ history: savedHistory });
      } else {
        set({ history: historyManager.getHistory() });
      }

      if (savedSnippets && savedSnippets.length > 0) {
        set({ snippets: savedSnippets });
      }
    } else {
      set({ 
        templates: templateManager.getTemplates(),
        history: historyManager.getHistory()
      });
    }

    // Start polling in background
    const poll = async () => {
      await get().checkConnection();
    };
    poll(); // Initial check
    setInterval(poll, 10000); // Poll every 10s
  }
}));
