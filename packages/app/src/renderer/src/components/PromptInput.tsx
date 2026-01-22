import { useAppStore } from '../store';
import { Play, Loader2, Sparkles, ChevronDown, StopCircle, Settings2, Wifi, WifiOff, Wand2, Save, RefreshCcw, MessageSquare, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState, memo } from 'react';
import { cn } from '../utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ollama, templateManager } from '@xmlpg/core';
import { ModelManager } from './ModelManager';
import { toast } from 'sonner';

export const PromptInput = memo(function PromptInput() {
  const { 
    prompt, setPrompt, generatePrompt, enhancePrompt, 
    isGenerating, isRefining, toggleRefineMode,
    models, selectedModel, selectModel, fetchModels, 
    refreshData, settings, isAuthenticated 
  } = useAppStore();
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Health check polling - To be moved to ConnectionManager in Sprint 2
  useEffect(() => {
    fetchModels();
    
    const checkHealth = async () => {
      try {
        await ollama.listModels();
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    };

    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (!isGenerating && prompt) {
          generatePrompt();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prompt, isGenerating]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [prompt]);

  const handleSaveTemplate = async () => {
    if (!prompt) return;
    const name = window.prompt("Enter a name for this template:");
    if (!name) return;

    const { xmlOutput } = useAppStore.getState();
    if (!xmlOutput) {
      toast.error("No XML to save");
      return;
    }

    templateManager.addTemplate({
      name,
      content: xmlOutput
    });
    
    if (window.api) {
      await window.api.saveTemplates(templateManager.getTemplates());
    }
    refreshData();
    toast.success("Template saved!");
  };

  const currentModel = models.find(m => m.name === selectedModel);

  return (
    <div className={cn("flex flex-col h-full bg-slate-900 transition-colors duration-500", isRefining && "bg-slate-900/50")}>
      
      {/* Global Offline Banner (Sprint 2 Preview) */}
      {!isOnline && (
        <div className="bg-red-900/20 text-red-400 text-xs font-medium px-4 py-1 flex items-center justify-center gap-2 border-b border-red-900/30">
          <WifiOff className="w-3 h-3" />
          Ollama Disconnected. Make sure Ollama is running.
          <button 
            onClick={() => window.location.reload()} 
            className="underline hover:text-red-300 ml-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* Header / Model Selector */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-2">
           <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Model</span>
           <DropdownMenu.Root>
             <DropdownMenu.Trigger asChild>
               <button className="flex items-center gap-2 text-sm font-medium text-slate-200 hover:bg-slate-800 px-3 py-1.5 rounded transition-colors outline-none focus:ring-2 focus:ring-blue-500/20">
                 <Sparkles className="w-4 h-4 text-blue-400" />
                 {currentModel ? currentModel.name : "Select Model"}
                 <span className="text-slate-500 text-xs ml-1">
                   {currentModel ? `${(currentModel.size / 1024 / 1024 / 1024).toFixed(1)}GB` : ""}
                 </span>
                 <ChevronDown className="w-3 h-3 text-slate-500 ml-1" />
               </button>
             </DropdownMenu.Trigger>

             <DropdownMenu.Portal>
               <DropdownMenu.Content className="min-w-[280px] bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                 <DropdownMenu.Label className="text-xs text-slate-500 px-2 py-1.5 uppercase font-semibold">Available Models</DropdownMenu.Label>
                 {models.map(m => (
                   <DropdownMenu.Item 
                     key={m.digest}
                     className="flex flex-col px-2 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded cursor-pointer outline-none data-[highlighted]:bg-slate-800"
                     onSelect={() => selectModel(m.name)}
                   >
                     <div className="flex items-center justify-between">
                       <span className="font-medium text-slate-200">{m.name}</span>
                       <span className="text-[10px] font-mono bg-slate-800 px-1 rounded text-slate-400 border border-slate-700">
                         {m.details?.quantization_level || "Q4_0"}
                       </span>
                     </div>
                     <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                       <span>{(m.size / 1024 / 1024 / 1024).toFixed(2)} GB</span>
                       <span>•</span>
                       <span>{m.details?.parameter_size || "7B"} Params</span>
                       <span>•</span>
                       <span>{m.details?.family || "Llama"}</span>
                     </div>
                   </DropdownMenu.Item>
                 ))}
                 
                 <DropdownMenu.Separator className="h-px bg-slate-800 my-1" />
                 
                 <ModelManager>
                   <DropdownMenu.Item 
                      className="flex items-center gap-2 px-2 py-2 text-sm text-blue-400 hover:bg-slate-800 rounded cursor-pointer outline-none"
                      onSelect={(e) => e.preventDefault()} // Prevent closing
                   >
                     <Settings2 className="w-4 h-4" />
                     <span className="font-medium">Manage Models</span>
                   </DropdownMenu.Item>
                 </ModelManager>
               </DropdownMenu.Content>
             </DropdownMenu.Portal>
           </DropdownMenu.Root>
        </div>
        
        <div className="flex items-center gap-2">
           <div className={cn("flex items-center gap-1.5 text-xs px-2 py-1 rounded-full", isOnline ? "text-emerald-400 bg-emerald-950/30" : "text-red-400 bg-red-950/30")}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span className="hidden sm:inline">{isOnline ? "Connected" : "Offline"}</span>
           </div>
           
           <button 
             onClick={toggleRefineMode}
             className={cn(
               "p-2 rounded transition-colors relative group",
               isRefining ? "text-blue-400 bg-blue-950/30" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
             )}
             title={isRefining ? "Exit Refine Mode" : "Enter Refine Mode"}
           >
             <RefreshCcw className={cn("w-4 h-4", isRefining && "animate-spin-slow")} />
             {isRefining && <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
           </button>

           <button 
             onClick={handleSaveTemplate}
             className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors"
             title="Save Output as Template"
           >
             <Save className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-1 p-4 overflow-y-auto relative">
        {isRefining && (
           <div className="absolute top-0 left-0 right-0 px-4 py-2 bg-blue-900/20 border-b border-blue-900/30 text-xs text-blue-300 font-medium flex items-center justify-between animate-in slide-in-from-top-2">
             <div className="flex items-center gap-2">
               <MessageSquare className="w-3 h-3" />
               Refinement Mode Active: Describe changes to apply to the current XML
             </div>
             <button 
               onClick={toggleRefineMode}
               className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider"
             >
               Cancel
             </button>
           </div>
        )}
        <textarea
          ref={textareaRef}
          className={cn(
            "w-full bg-transparent text-slate-200 placeholder:text-slate-600 outline-none resize-none font-sans text-base leading-relaxed min-h-[120px] transition-all",
            isRefining && "pt-10 placeholder:text-blue-300/50"
          )}
          placeholder={isRefining 
            ? "Describe how you want to change the current XML (e.g., 'Add a dark mode toggle to the navbar')" 
            : "Describe the website you want to generate in detail... (e.g., 'A modern landing page for a coffee shop with a hero section, menu grid, and contact form')"
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      {/* Footer / Actions */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center">
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span>{prompt.length} chars</span>
          <span className="text-slate-700">|</span>
          <span className="hidden sm:inline">Press <kbd className="font-sans bg-slate-800 px-1 rounded text-slate-400">Cmd+Enter</kbd> to {isRefining ? 'Refine' : 'Generate'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={enhancePrompt}
            disabled={isGenerating || !prompt || !isOnline || isRefining}
            className="p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-950/30 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed group relative"
            title="Enhance Prompt with AI"
          >
            <Wand2 className="w-4 h-4 group-hover:animate-pulse" />
          </button>

          {isGenerating && (
             <button className="text-red-400 hover:text-red-300 hover:bg-red-950/30 px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2">
               <StopCircle className="w-4 h-4" />
               Stop
             </button>
          )}
          
          <button
            onClick={generatePrompt}
            disabled={isGenerating || !prompt || !isOnline}
            className={cn(
              "px-5 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-all shadow-lg shadow-blue-900/20",
              isGenerating || !prompt || !isOnline
                ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                : isRefining 
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-indigo-900/40 hover:-translate-y-0.5"
                  : "bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-900/40 hover:-translate-y-0.5"
            )}
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : (isRefining ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />)}
            {isGenerating ? (isRefining ? "Refining..." : "Generating...") : (isRefining ? "Refine XML" : "Generate XML")}
          </button>
        </div>
      </div>
    </div>
  );
});
