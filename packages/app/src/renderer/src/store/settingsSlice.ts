import { StateCreator } from 'zustand';

export interface Settings {
  systemPrompt: string;
}

export interface Persona {
  id: string;
  name: string;
  systemPrompt: string;
  description: string;
}

const DEFAULT_PERSONAS: Persona[] = [
  {
    id: 'default',
    name: 'Standard Architect',
    description: 'Balanced XML structure with standard conventions',
    systemPrompt: `The output must be a valid XML document starting with <website_prompt>...`
  },
  {
    id: 'designer',
    name: 'Creative Designer',
    description: 'Focuses on rich visual descriptions',
    systemPrompt: `You are a creative UI/UX designer...`
  }
];

export interface SettingsSlice {
  settings: Settings;
  personas: Persona[];
  activePersonaId: string;
  
  updateSettings: (settings: Partial<Settings>) => void;
  setActivePersona: (id: string) => void;
  addPersona: (persona: Persona) => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice> = (set) => ({
  settings: {
    systemPrompt: DEFAULT_PERSONAS[0].systemPrompt
  },
  personas: DEFAULT_PERSONAS,
  activePersonaId: 'default',
  
  updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),
  setActivePersona: (id) => set({ activePersonaId: id }),
  addPersona: (persona) => set((state) => ({ personas: [...state.personas, persona] })),
});
