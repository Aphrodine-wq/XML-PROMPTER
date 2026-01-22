import { useAppStore } from '../store';
import { Play, Loader2, Sparkles, ChevronDown, StopCircle, Settings2, Wifi, WifiOff, Wand2, Save, RefreshCcw, MessageSquare, RotateCcw, Image as ImageIcon, X, Mic, MicOff, Bot, Command, Cloud, Server } from 'lucide-react';
import { useEffect, useRef, useState, memo } from 'react';
import { cn } from '../utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ollama, templateManager } from '@xmlpg/core';
import { ModelManager } from './ModelManager';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export const PromptInput = memo(function PromptInput() {
  const { 
    prompt, setPrompt, generatePrompt, enhancePrompt, 
    isGenerating, isRefining, toggleRefineMode,
    models, selectedModel, selectModel, fetchModels, 
    refreshData, settings, isAuthenticated,
    selectedImages, addImages, removeImage, clearImages,
    isListening, toggleVoice,
    isAgentMode, toggleAgentMode, runAgent, agentProgress
  } = useAppStore();
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Re-use logic for image upload
      const newImages: string[] = [];
      Array.from(files).forEach(file => {
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    newImages.push(reader.result);
                    if (newImages.length === files.length) {
                        addImages(newImages);
                    }
                }
            };
            reader.readAsDataURL(file);
          }
      });
    }
  };

  // ... (Keep existing image upload and paste handlers)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                newImages.push(reader.result);
                if (newImages.length === files.length) {
                    addImages(newImages);
                    // Clear input so same file can be selected again
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsDataURL(file);
    });
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            e.preventDefault(); // Prevent pasting image name as text
            const file = items[i].getAsFile();
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                        addImages([reader.result]);
                    }
                };
                reader.readAsDataURL(file);
            }
        }
    }
  };
  
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
    <div 
        className={cn("flex flex-col h-full bg-slate-900/40 transition-colors duration-500 relative group", isRefining && "bg-slate-900/60")}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
      
      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragOver && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-blue-600/20 backdrop-blur-sm border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center pointer-events-none"
            >
                <div className="text-blue-200 font-bold text-lg">Drop images to upload</div>
            </motion.div>
        )}
      </AnimatePresence>

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
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/50 bg-slate-950/20">
        <div className="flex items-center gap-2">
           <DropdownMenu.Root>
             <DropdownMenu.Trigger asChild>
               <button className="flex items-center gap-2 text-sm font-medium text-slate-200 hover:bg-slate-800/50 px-3 py-1.5 rounded-full transition-colors outline-none border border-slate-800 hover:border-slate-700">
                 <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                 {currentModel ? currentModel.name : "Select Model"}
                 <span className="text-slate-500 text-xs ml-1 border-l border-slate-800 pl-2">
                   {currentModel ? `${(currentModel.size / 1024 / 1024 / 1024).toFixed(1)}GB` : ""}
                 </span>
                 <ChevronDown className="w-3 h-3 text-slate-500 ml-1" />
               </button>
             </DropdownMenu.Trigger>

             <DropdownMenu.Portal>
               <DropdownMenu.Content className="min-w-[280px] bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                 <DropdownMenu.Label className="text-xs text-slate-500 px-2 py-1.5 uppercase font-semibold">Available Models</DropdownMenu.Label>
                 {models.map(m => (
                   <DropdownMenu.Item 
                     key={m.digest}
                     className="flex flex-col px-2 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg cursor-pointer outline-none data-[highlighted]:bg-slate-800"
                     onSelect={() => selectModel(m.name)}
                   >
                     <div className="flex items-center justify-between">
                       <span className="font-medium text-slate-200 flex items-center gap-2">
                         {m.provider === 'ollama' ? <Server className="w-3 h-3 text-emerald-400" /> : <Cloud className="w-3 h-3 text-sky-400" />}
                         {m.name}
                       </span>
                       <span className="text-[10px] font-mono bg-slate-800 px-1 rounded text-slate-400 border border-slate-700">
                         {m.details?.quantization_level || "Q4_0"}
                       </span>
                     </div>
                     <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 pl-5">
                       <span>{(m.size / 1024 / 1024 / 1024).toFixed(2)} GB</span>
                       <span>•</span>
                       <span>{m.details?.parameter_size || "7B"} Params</span>
                       <span>•</span>
                       <span>{m.provider === 'ollama' ? 'Local' : 'Cloud'}</span>
                     </div>
                   </DropdownMenu.Item>
                 ))}
                 
                 <DropdownMenu.Separator className="h-px bg-slate-800 my-1" />
                 
                 <ModelManager>
                   <DropdownMenu.Item 
                      className="flex items-center gap-2 px-2 py-2 text-sm text-blue-400 hover:bg-slate-800 rounded-lg cursor-pointer outline-none"
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
           <button 
             onClick={toggleRefineMode}
             className={cn(
               "p-2 rounded-full transition-all relative group border border-transparent",
               isRefining ? "text-blue-400 bg-blue-950/30 border-blue-900/50" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
             )}
             title={isRefining ? "Exit Refine Mode" : "Enter Refine Mode"}
           >
             <RefreshCcw className={cn("w-4 h-4", isRefining && "animate-spin-slow")} />
             {isRefining && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
           </button>

           <button 
             onClick={handleSaveTemplate}
             className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded-full transition-colors"
             title="Save Output as Template"
           >
             <Save className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-1 p-4 overflow-y-auto relative">
        <AnimatePresence>
            {isRefining && (
               <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between"
               >
                 <div className="flex items-center gap-3">
                   <div className="p-1.5 bg-blue-500/20 rounded-md">
                        <MessageSquare className="w-4 h-4 text-blue-400" />
                   </div>
                   <div className="text-sm">
                        <div className="font-semibold text-blue-200">Refinement Mode</div>
                        <div className="text-xs text-blue-300/70">Describe changes to apply to the current XML</div>
                   </div>
                 </div>
                 <button 
                   onClick={toggleRefineMode}
                   className="p-1 hover:bg-blue-500/20 rounded-md text-blue-300 transition-colors"
                 >
                   <X className="w-4 h-4" />
                 </button>
               </motion.div>
            )}
        </AnimatePresence>

        {/* Image Previews */}
        {selectedImages.length > 0 && (
            <div className="flex gap-2 mb-4 flex-wrap">
                {selectedImages.map((img, idx) => (
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        key={idx} 
                        className="relative group w-24 h-24 rounded-lg overflow-hidden border border-slate-700 shadow-lg"
                    >
                        <img src={img} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                               onClick={() => removeImage(idx)}
                               className="bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1.5 transition-transform hover:scale-110"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        )}

        <textarea
          ref={textareaRef}
          className={cn(
            "w-full bg-transparent text-slate-200 placeholder:text-slate-600 outline-none resize-none font-sans text-base leading-relaxed min-h-[120px] transition-all selection:bg-blue-500/30",
            isRefining && "placeholder:text-blue-300/30"
          )}
          placeholder={isRefining 
            ? "e.g., 'Change the hero button to red' or 'Add a contact form to the footer'..." 
            : "Describe the website you want to build... (Cmd+K for commands)"
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onPaste={handlePaste}
        />
        
        <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            multiple 
            accept="image/*"
            onChange={handleImageUpload}
        />
      </div>

      {/* Footer / Actions */}
      <div className="p-4 border-t border-slate-800/50 bg-slate-900/30 flex justify-between items-center backdrop-blur-sm">
        <div className="text-xs text-slate-500 flex items-center gap-3">
          {/* Add Image Button */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 rounded-full text-slate-400 hover:text-blue-400 transition-all border border-transparent hover:border-slate-700"
            title="Upload Images"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">Add Image</span>
          </button>
          
          {/* Voice Input Button */}
          <button 
            onClick={toggleVoice}
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border",
                isListening 
                    ? "bg-red-900/20 text-red-400 border-red-900/30 animate-pulse" 
                    : "bg-slate-800/50 text-slate-400 border-transparent hover:bg-slate-800 hover:text-red-400 hover:border-slate-700"
            )}
            title={isListening ? "Stop Recording" : "Start Voice Input"}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span className="hidden sm:inline font-medium">{isListening ? "Listening..." : "Voice"}</span>
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-600 font-medium mr-2">
             <Command className="w-3 h-3" />
             <span>+ Enter to run</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={enhancePrompt}
            disabled={isGenerating || !prompt || !isOnline || isRefining}
            className="p-2.5 text-purple-400 bg-purple-900/10 hover:bg-purple-900/30 border border-purple-900/20 hover:border-purple-500/30 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative"
            title="Enhance Prompt with AI"
          >
            <Wand2 className="w-4 h-4 group-hover:animate-pulse" />
          </motion.button>

          {isGenerating && (
             <motion.button 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="text-red-400 hover:text-red-300 hover:bg-red-950/30 px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
             >
               <StopCircle className="w-4 h-4" />
               Stop
             </motion.button>
          )}
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={isAgentMode ? runAgent : generatePrompt}
            disabled={isGenerating || !prompt || !isOnline}
            className={cn(
              "px-6 py-2.5 rounded-full flex items-center gap-2 text-sm font-bold transition-all shadow-lg",
              isGenerating || !prompt || !isOnline
                ? "bg-slate-800 text-slate-500 cursor-not-allowed shadow-none" 
                : isAgentMode
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-purple-500/25"
                  : isRefining 
                    ? "bg-gradient-to-r from-indigo-500 to-blue-600 text-white hover:shadow-blue-500/25"
                    : "bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-blue-500/25"
            )}
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAgentMode ? <Bot className="w-4 h-4" /> : (isRefining ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />))}
            {isGenerating ? (isAgentMode ? "Agents Working..." : (isRefining ? "Refining..." : "Generating...")) : (isAgentMode ? "Run Agents" : (isRefining ? "Refine XML" : "Generate XML"))}
          </motion.button>
        </div>
      </div>
    </div>
  );
});
