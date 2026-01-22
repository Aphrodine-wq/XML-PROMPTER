import { StateCreator } from 'zustand';
import { Model, aiManager, voiceService, ollama, PullProgress } from '@xmlpg/core';
import { toast } from 'sonner';

export interface EditorSlice {
  prompt: string;
  setPrompt: (prompt: string) => void;
  
  // Voice
  isListening: boolean;
  toggleVoice: () => void;
  
  // Vision / Images
  selectedImages: string[];
  setSelectedImages: (images: string[]) => void;
  addImages: (newImages: string[]) => void;
  removeImage: (index: number) => void;
  clearImages: () => void;

  xmlOutput: string;
  setXmlOutput: (xmlOutput: string) => void;
  originalXmlOutput: string; // For refinement diffing
  
  models: Model[];
  selectedModel: string;
  fetchModels: () => Promise<void>;
  selectModel: (model: string) => void;
  
  // Model Management
  isPulling: boolean;
  pullProgress: PullProgress | null;
  pullModel: (model: string) => Promise<void>;

  isGenerating: boolean;
  generatePrompt: () => Promise<void>;
  
  isRefining: boolean;
  setIsRefining: (isRefining: boolean) => void;
  refinePrompt: () => Promise<void>;
  acceptRefinement: () => void;
  rejectRefinement: () => void;

  enhancePrompt: () => Promise<void>;
  stopGeneration: () => void;

  // Code Generation
  codeOutput: string;
  setCodeOutput: (code: string) => void;
  isGeneratingCode: boolean;
  generateCode: () => Promise<void>;
  generateProject: () => Promise<void>;

  // Agents
  isAgentMode: boolean;
  toggleAgentMode: () => void;
  agentProgress: string[];
  addAgentProgress: (msg: string) => void;
  runAgent: () => Promise<void>;
}

export const createEditorSlice: StateCreator<EditorSlice> = (set, get) => ({
  prompt: '',
  setPrompt: (prompt) => set({ prompt }),

  xmlOutput: '',
  setXmlOutput: (xmlOutput) => set({ xmlOutput }),
  originalXmlOutput: '',

  models: [],
  selectedModel: '',
  fetchModels: async () => {
    try {
        const models = await aiManager.listModels();
        set({ models });
        if (models.length > 0 && !get().selectedModel) {
            const preferred = models.find(m => m.name.includes('llama3')) || models[0];
            set({ selectedModel: preferred.name });
        }
    } catch (e) {
        console.error("Failed to fetch models", e);
    }
  },
  selectModel: (model) => set({ selectedModel: model }),

  isPulling: false,
  pullProgress: null,
  pullModel: async (modelName: string) => {
    set({ isPulling: true, pullProgress: { status: 'starting', completed: 0, total: 0 } });
    try {
        await ollama.pull(modelName, (progress) => {
            set({ pullProgress: progress });
        });
        toast.success(`Model ${modelName} downloaded successfully`);
        await get().fetchModels(); // Refresh list
    } catch (e: any) {
        console.error("Pull failed", e);
        toast.error(`Failed to download model: ${e.message}`);
    } finally {
        set({ isPulling: false, pullProgress: null });
    }
  },

  isGenerating: false,
  generatePrompt: async () => { /* Implemented in main store */ },

  isRefining: false,
  setIsRefining: (isRefining) => set({ isRefining }),
  refinePrompt: async () => { /* Implemented in main store */ },
  
  acceptRefinement: () => {
      set({ isRefining: false, originalXmlOutput: '' });
      toast.success("Refinement accepted");
  },
  rejectRefinement: () => {
      const { originalXmlOutput } = get();
      if (originalXmlOutput) {
          set({ xmlOutput: originalXmlOutput, isRefining: false, originalXmlOutput: '' });
          toast.info("Refinement rejected");
      }
  },

  enhancePrompt: async () => { /* Implemented in main store */ },
  stopGeneration: () => { /* Implemented in main store */ },
  
  // Voice
  isListening: false,
  toggleVoice: () => {
    const { isListening } = get();
    if (isListening) {
        voiceService.stop();
        set({ isListening: false });
    } else {
        if (!voiceService.isSupported()) {
            console.error("Voice not supported");
            return;
        }
        set({ isListening: true });
        voiceService.start(
            (text, isFinal) => {
                if (isFinal) {
                    set((state) => ({ prompt: state.prompt + (state.prompt ? ' ' : '') + text }));
                }
            },
            (error) => {
                console.error("Voice error", error);
                set({ isListening: false });
            }
        );
    }
  },

  selectedImages: [],
  setSelectedImages: (images) => set({ selectedImages: images }),
  addImages: (newImages) => set((state) => ({ selectedImages: [...state.selectedImages, ...newImages] })),
  removeImage: (index) => set((state) => ({ 
    selectedImages: state.selectedImages.filter((_, i) => i !== index) 
  })),
  clearImages: () => set({ selectedImages: [] }),

  // Code Generation
  codeOutput: '',
  setCodeOutput: (code) => set({ codeOutput: code }),
  isGeneratingCode: false,
  generateCode: async () => { /* Implemented in main store */ },
  generateProject: async () => { /* Implemented in main store */ },

  // Agents
  isAgentMode: false,
  toggleAgentMode: () => set((state) => ({ isAgentMode: !state.isAgentMode })),
  agentProgress: [],
  addAgentProgress: (msg) => set((state) => ({ agentProgress: [...state.agentProgress, msg] })),
  runAgent: async () => { /* Implemented in main store */ },
});
