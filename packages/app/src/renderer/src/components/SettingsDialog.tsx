import * as Dialog from '@radix-ui/react-dialog';
import { X, Save, Key } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../store';
import { toast } from 'sonner';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { updateAIConfig } = useAppStore();
  const [geminiKey, setGeminiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');

  const handleSave = (provider: 'google' | 'groq') => {
    if (provider === 'google') {
      updateAIConfig('google', { apiKey: geminiKey });
    } else {
      updateAIConfig('groq', { apiKey: groqKey });
    }
    // toast handled in store
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-6 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-semibold text-slate-100">Settings</Dialog.Title>
            <Dialog.Close className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <div className="space-y-6">
            {/* Google Gemini */}
            <div className="space-y-3 p-4 bg-slate-950/50 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-blue-900/30 rounded text-blue-400">
                   <Key className="w-4 h-4" />
                </div>
                <h3 className="font-medium text-slate-200">Google Gemini API</h3>
              </div>
              <p className="text-xs text-slate-500 mb-2">
                Required for Gemini 2.0 Flash models. Get a free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-blue-400 hover:underline">Google AI Studio</a>.
              </p>
              <div className="flex gap-2">
                <input 
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="Enter Gemini API Key"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
                <button 
                  onClick={() => handleSave('google')}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>

            {/* Groq */}
            <div className="space-y-3 p-4 bg-slate-950/50 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-orange-900/30 rounded text-orange-400">
                   <Key className="w-4 h-4" />
                </div>
                <h3 className="font-medium text-slate-200">Groq API</h3>
              </div>
              <p className="text-xs text-slate-500 mb-2">
                Required for Llama 3 70b (Free Tier). Get a free key at <a href="https://console.groq.com/keys" target="_blank" className="text-blue-400 hover:underline">Groq Console</a>.
              </p>
              <div className="flex gap-2">
                <input 
                  type="password"
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder="Enter Groq API Key"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
                <button 
                  onClick={() => handleSave('groq')}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
