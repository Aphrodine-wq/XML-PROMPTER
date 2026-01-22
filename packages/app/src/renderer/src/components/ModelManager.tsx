import * as Dialog from '@radix-ui/react-dialog';
import { useAppStore } from '../store';
import { Download, Loader2, X, HardDrive, CheckCircle2, Zap, Brain, Activity } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';

const RECOMMENDED_MODELS = [
  { 
    name: 'llama3', 
    category: 'Balanced',
    description: 'Meta\'s latest open model. Good balance of speed and quality.', 
    size: '4.7GB',
    ram: '8GB'
  },
  { 
    name: 'mistral', 
    category: 'Speed',
    description: 'High performance 7B model. Fast generation.', 
    size: '4.1GB',
    ram: '8GB'
  },
  { 
    name: 'deepseek-coder', 
    category: 'Coding',
    description: 'Specialized for code generation and XML structures.', 
    size: '4.4GB',
    ram: '8GB'
  },
  { 
    name: 'phi3', 
    category: 'Speed',
    description: 'Microsoft\'s lightweight model. Very fast, low memory.', 
    size: '2.3GB',
    ram: '4GB'
  },
  {
    name: 'mixtral',
    category: 'Power',
    description: 'Mixture of Experts. High quality, requires good hardware.',
    size: '26GB',
    ram: '32GB'
  },
  {
    name: 'llama3:70b',
    category: 'Power',
    description: 'The big one. State of the art open source quality.',
    size: '40GB',
    ram: '48GB+'
  }
];

export function ModelManager({ children }: { children: React.ReactNode }) {
  const { isPulling, pullProgress, pullModel, models } = useAppStore();
  const [customModel, setCustomModel] = useState('');
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Speed' | 'Balanced' | 'Power' | 'Coding'>('All');

  const handlePull = (modelName: string) => {
    if (isPulling) return;
    pullModel(modelName);
  };

  const isInstalled = (name: string) => models.some(m => m.name.includes(name));

  const filteredModels = filter === 'All' 
    ? RECOMMENDED_MODELS 
    : RECOMMENDED_MODELS.filter(m => m.category === filter);

  const getCategoryIcon = (cat: string) => {
    switch(cat) {
      case 'Speed': return <Zap className="w-3 h-3 text-yellow-400" />;
      case 'Power': return <Brain className="w-3 h-3 text-purple-400" />;
      case 'Coding': return <Activity className="w-3 h-3 text-blue-400" />;
      default: return <HardDrive className="w-3 h-3 text-slate-400" />;
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {children}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-0 overflow-hidden outline-none animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <HardDrive className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-slate-100">Model Manager</Dialog.Title>
                <Dialog.Description className="text-sm text-slate-500">Download and manage local AI models</Dialog.Description>
              </div>
            </div>
            <Dialog.Close className="text-slate-500 hover:text-slate-300 transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            
            {/* Download Status */}
            <AnimatePresence>
              {isPulling && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 overflow-hidden mb-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-200 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      Downloading Model...
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {pullProgress?.status} 
                      {pullProgress?.completed && pullProgress?.total ? 
                        ` (${Math.round((pullProgress.completed / pullProgress.total) * 100)}%)` : ''}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-blue-500"
                      initial={{ width: 0 }}
                      animate={{ 
                        width: pullProgress?.completed && pullProgress?.total 
                          ? `${(pullProgress.completed / pullProgress.total) * 100}%` 
                          : '100%' 
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Custom Input */}
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Enter model tag (e.g. llama2:13b)" 
                className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-4 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && customModel && handlePull(customModel)}
              />
              <button 
                disabled={!customModel || isPulling}
                onClick={() => handlePull(customModel)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Pull
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-hide">
              {['All', 'Speed', 'Balanced', 'Coding', 'Power'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat as any)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
                    filter === cat 
                      ? "bg-blue-600 border-blue-500 text-white" 
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Recommended List */}
            <div>
              <h3 className="text-xs font-semibold uppercase text-slate-500 mb-3 tracking-wider">Recommended Models</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredModels.map((model) => {
                  const installed = isInstalled(model.name);
                  return (
                    <div 
                      key={model.name}
                      className={cn(
                        "p-3 rounded-lg border transition-all flex flex-col justify-between group",
                        installed 
                          ? "bg-slate-900/50 border-slate-800 opacity-70" 
                          : "bg-slate-800/30 border-slate-700 hover:bg-slate-800 hover:border-slate-600"
                      )}
                    >
                      <div className="mb-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-slate-200 truncate">{model.name}</span>
                          <span className="flex items-center gap-1 text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
                             {getCategoryIcon(model.category)}
                             {model.size}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-2 line-clamp-2">{model.description}</p>
                        <div className="text-[10px] text-slate-600 font-mono flex items-center gap-1">
                           RAM: {model.ram}
                           {model.category === 'Power' && <span className="text-amber-500 ml-1">⚠️ High Req</span>}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handlePull(model.name)}
                        disabled={installed || isPulling}
                        className={cn(
                          "w-full py-1.5 rounded text-xs font-medium flex items-center justify-center gap-2 transition-colors",
                          installed
                            ? "bg-emerald-900/20 text-emerald-400 cursor-default"
                            : "bg-blue-600 hover:bg-blue-500 text-white"
                        )}
                      >
                        {installed ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Installed
                          </>
                        ) : (
                          <>
                            <Download className="w-3 h-3" />
                            Download
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
