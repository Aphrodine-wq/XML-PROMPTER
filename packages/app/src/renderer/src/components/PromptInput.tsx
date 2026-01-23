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
        className={cn("flex flex-col h-full bg-white transition-colors duration-500 relative group", isRefining && "bg-accent/10")}
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
                className="absolute inset-0 z-50 bg-primary/20 border-4 border-dashed border-black flex items-center justify-center pointer-events-none"
            >
                <div className="text-black font-black text-2xl uppercase tracking-wider">Drop Images Here</div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Global Offline Banner */}
      {!isOnline && (
        <div className="bg-primary text-black text-xs font-black px-4 py-2 flex items-center justify-center gap-2 border-b-3 border-black uppercase tracking-wider">
          <WifiOff className="w-4 h-4" />
          Ollama Offline - Check Connection
          <button
            onClick={() => window.location.reload()}
            className="ml-2 px-3 py-1 bg-black text-white border-2 border-black hover:bg-white hover:text-black transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Header / Model Selector */}
      <div className="flex items-center justify-between px-4 py-3 border-b-3 border-black bg-white">
        <div className="flex items-center gap-2">
           <DropdownMenu.Root>
             <DropdownMenu.Trigger asChild>
               <button className="flex items-center gap-3 text-sm font-black uppercase tracking-wider hover:bg-accent px-4 py-2 transition-colors outline-none border-3 border-black">
                 <Sparkles className="w-4 h-4" />
                 {currentModel ? currentModel.name : "Select Model"}
                 <span className="text-xs ml-1 border-l-2 border-black pl-3 font-mono">
                   {currentModel ? `${(currentModel.size / 1024 / 1024 / 1024).toFixed(1)}GB` : ""}
                 </span>
                 <ChevronDown className="w-4 h-4" />
               </button>
             </DropdownMenu.Trigger>

             <DropdownMenu.Portal>
               <DropdownMenu.Content className="min-w-[320px] bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                 <DropdownMenu.Label className="text-xs px-3 py-2 uppercase font-black tracking-wider border-b-2 border-black">Models</DropdownMenu.Label>
                 {models.map(m => (
                   <DropdownMenu.Item
                     key={m.digest}
                     className="flex flex-col px-3 py-3 text-sm hover:bg-accent border-2 border-transparent hover:border-black cursor-pointer outline-none my-1"
                     onSelect={() => selectModel(m.name)}
                   >
                     <div className="flex items-center justify-between">
                       <span className="font-bold flex items-center gap-2 uppercase tracking-wide">
                         {m.provider === 'ollama' ? <Server className="w-4 h-4" /> : <Cloud className="w-4 h-4" />}
                         {m.name}
                       </span>
                       <span className="text-[10px] font-black font-mono bg-black text-white px-2 py-0.5 border-2 border-black">
                         {m.details?.quantization_level || "Q4_0"}
                       </span>
                     </div>
                     <div className="flex items-center gap-2 text-xs font-medium mt-2 pl-6">
                       <span>{(m.size / 1024 / 1024 / 1024).toFixed(2)} GB</span>
                       <span>•</span>
                       <span>{m.details?.parameter_size || "7B"}</span>
                       <span>•</span>
                       <span className="font-black">{m.provider === 'ollama' ? 'LOCAL' : 'CLOUD'}</span>
                     </div>
                   </DropdownMenu.Item>
                 ))}

                 <DropdownMenu.Separator className="h-0.5 bg-black my-2" />

                 <ModelManager>
                   <DropdownMenu.Item
                      className="flex items-center gap-3 px-3 py-3 text-sm font-black uppercase tracking-wider hover:bg-black hover:text-white border-2 border-black cursor-pointer outline-none"
                      onSelect={(e) => e.preventDefault()}
                   >
                     <Settings2 className="w-4 h-4" />
                     <span>Manage</span>
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
               "p-2 transition-all relative group border-3 border-black",
               isRefining ? "bg-primary" : "bg-white hover:bg-accent"
             )}
             title={isRefining ? "Exit Refine Mode" : "Enter Refine Mode"}
           >
             <RefreshCcw className={cn("w-4 h-4", isRefining && "animate-spin-slow")} />
             {isRefining && <span className="absolute -top-1 -right-1 w-3 h-3 bg-black animate-pulse" />}
           </button>

           <button
             onClick={handleSaveTemplate}
             className="p-2 bg-white hover:bg-accent border-3 border-black transition-colors"
             title="Save Output as Template"
           >
             <Save className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-1 p-6 overflow-y-auto relative">
        <AnimatePresence>
            {isRefining && (
               <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 px-4 py-4 bg-accent border-3 border-black flex items-center justify-between"
               >
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-black">
                        <MessageSquare className="w-5 h-5 text-white" />
                   </div>
                   <div className="text-sm">
                        <div className="font-black text-base uppercase tracking-wide">Refine Mode</div>
                        <div className="text-xs font-medium">Describe changes to apply</div>
                   </div>
                 </div>
                 <button
                   onClick={toggleRefineMode}
                   className="p-2 hover:bg-black hover:text-white border-2 border-black transition-colors"
                 >
                   <X className="w-4 h-4" />
                 </button>
               </motion.div>
            )}
        </AnimatePresence>

        {/* Image Previews */}
        {selectedImages.length > 0 && (
            <div className="flex gap-3 mb-4 flex-wrap">
                {selectedImages.map((img, idx) => (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        key={idx}
                        className="relative group w-24 h-24 overflow-hidden border-3 border-black"
                    >
                        <img src={img} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                               onClick={() => removeImage(idx)}
                               className="bg-primary border-2 border-black p-2 transition-transform hover:scale-110"
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
            "w-full bg-transparent text-black placeholder:text-gray-400 outline-none resize-none font-medium text-lg leading-relaxed min-h-[120px] transition-all selection:bg-primary/30",
            isRefining && "placeholder:text-black/40"
          )}
          placeholder={isRefining
            ? "Describe what you want to change..."
            : "Describe your website idea... (Cmd+K for commands)"
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
      <div className="p-4 border-t-3 border-black bg-white flex justify-between items-center">
        <div className="text-xs flex items-center gap-2">
          {/* Add Image Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-accent transition-all border-3 border-black font-bold uppercase tracking-wide text-xs"
            title="Upload Images"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Image</span>
          </button>

          {/* Voice Input Button */}
          <button
            onClick={toggleVoice}
            className={cn(
                "flex items-center gap-2 px-4 py-2 transition-all border-3 border-black font-bold uppercase tracking-wide text-xs",
                isListening
                    ? "bg-primary animate-pulse"
                    : "bg-white hover:bg-accent"
            )}
            title={isListening ? "Stop Recording" : "Start Voice Input"}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span className="hidden sm:inline">{isListening ? "Stop" : "Voice"}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-black uppercase tracking-wider mr-2 opacity-50">
             <Command className="w-3 h-3" />
             <span>+Enter</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={enhancePrompt}
            disabled={isGenerating || !prompt || !isOnline || isRefining}
            className="p-3 bg-accent hover:bg-black hover:text-white border-3 border-black transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
            title="Enhance Prompt"
          >
            <Wand2 className="w-4 h-4" />
          </motion.button>

          {isGenerating && (
             <motion.button
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="px-4 py-2 bg-primary border-3 border-black font-black uppercase text-xs tracking-wider hover:bg-black hover:text-white transition-colors flex items-center gap-2"
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
              "px-8 py-3 flex items-center gap-3 text-sm font-black uppercase tracking-wider transition-all border-3 border-black",
              isGenerating || !prompt || !isOnline
                ? "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300"
                : "bg-primary hover:bg-black hover:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5"
            )}
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : (isAgentMode ? <Bot className="w-5 h-5" /> : (isRefining ? <RotateCcw className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />))}
            {isGenerating ? (isAgentMode ? "Working..." : (isRefining ? "Refining..." : "Building...")) : (isAgentMode ? "Run" : (isRefining ? "Refine" : "Generate"))}
          </motion.button>
        </div>
      </div>
    </div>
  );
});
