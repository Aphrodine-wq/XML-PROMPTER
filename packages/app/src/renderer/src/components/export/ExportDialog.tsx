import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { Code, Layers, FileJson, Loader2, Download } from 'lucide-react';
import { useAppStore } from '../../store';
import { ollama } from '@xmlpg/core';
import { toast } from 'sonner';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ExportType = 'html' | 'react' | 'json';

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const { xmlOutput, selectedModel } = useAppStore();
  const [exportType, setExportType] = useState<ExportType>('html');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!xmlOutput || !selectedModel) return;
    setIsExporting(true);

    let systemPrompt = "";
    if (exportType === 'html') {
      systemPrompt = "You are an expert Frontend Developer. Convert the following XML website definition into a SINGLE HTML file using Tailwind CSS via CDN. Output ONLY the HTML code.";
    } else if (exportType === 'react') {
      systemPrompt = "You are an expert React Developer. Convert the following XML website definition into a React Component (App.tsx). Use Tailwind CSS classes. Output ONLY the React code.";
    } else {
      // JSON export is trivial, no AI needed
      const json = JSON.stringify({ xml: xmlOutput }, null, 2);
      await saveFile(json, 'project.json');
      setIsExporting(false);
      onOpenChange(false);
      return;
    }

    try {
      let code = "";
      await ollama.generate({
        model: selectedModel,
        prompt: `XML Input:\n${xmlOutput}\n\nTask: ${systemPrompt}`,
        stream: true
      }, (chunk) => {
        code += chunk;
      });

      // Simple cleanup of markdown blocks if present
      code = code.replace(/```(html|jsx|tsx)?/g, '').replace(/```/g, '');
      
      const ext = exportType === 'html' ? 'html' : 'tsx';
      await saveFile(code, `index.${ext}`);
      onOpenChange(false);
    } catch (e) {
      toast.error("Export failed");
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const saveFile = async (content: string, filename: string) => {
    if (window.api) {
      const saved = await window.api.saveFileDialog(content, filename);
      if (saved) toast.success("Export saved successfully");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-6 animate-in zoom-in-95 duration-200">
          <Dialog.Title className="text-lg font-semibold text-slate-100 mb-4">Export Project</Dialog.Title>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <ExportOption 
              active={exportType === 'html'} 
              onClick={() => setExportType('html')}
              icon={<Code className="w-6 h-6" />}
              label="HTML + Tailwind"
            />
            <ExportOption 
              active={exportType === 'react'} 
              onClick={() => setExportType('react')}
              icon={<Layers className="w-6 h-6" />}
              label="React + Tailwind"
            />
            <ExportOption 
              active={exportType === 'json'} 
              onClick={() => setExportType('json')}
              icon={<FileJson className="w-6 h-6" />}
              label="Raw JSON"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button 
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isExporting ? 'Generating Code...' : 'Export'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ExportOption({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
        active 
          ? 'bg-blue-600/20 border-blue-500 text-blue-200' 
          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
      }`}
    >
      {icon}
      <span className="text-xs font-medium mt-2 text-center">{label}</span>
    </button>
  );
}
