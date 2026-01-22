import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useAppStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Settings, Search, Wand2, RefreshCw, 
  LogOut, Plus, Layout, Zap, BrainCircuit, Command as CommandIcon
} from 'lucide-react';
import { toast } from 'sonner';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { 
    projectFiles, 
    openFile, 
    toggleRefineMode, 
    models, 
    selectModel,
    logout,
    resetProject
  } = useAppStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <Command.Dialog 
      open={open} 
      onOpenChange={setOpen}
      label="Global Command Menu"
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[640px] bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl z-[100] p-2 animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="flex items-center border-b border-slate-800/50 px-3 pb-2 mb-2">
        <Search className="w-5 h-5 text-slate-500 mr-2" />
        <Command.Input 
          placeholder="Type a command or search files..." 
          className="flex-1 bg-transparent text-lg text-slate-200 placeholder:text-slate-600 outline-none h-10"
        />
        <div className="flex gap-1">
            <kbd className="px-2 py-1 text-[10px] font-mono bg-slate-800 rounded text-slate-400">ESC</kbd>
        </div>
      </div>

      <Command.List className="max-h-[400px] overflow-y-auto overflow-x-hidden p-1 scrollbar-thin scrollbar-thumb-slate-700">
        <Command.Empty className="py-6 text-center text-slate-500 text-sm">
          No results found.
        </Command.Empty>

        <Command.Group heading="Quick Actions" className="text-xs font-semibold text-slate-500 mb-2 px-2">
          <Command.Item 
            onSelect={() => runCommand(() => { resetProject(); navigate('/editor'); })}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-200 rounded-md aria-selected:bg-blue-600 aria-selected:text-white cursor-pointer transition-colors my-1"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
            <Command.Shortcut className="ml-auto text-xs opacity-50">Cmd+N</Command.Shortcut>
          </Command.Item>
          
          <Command.Item 
            onSelect={() => runCommand(() => toggleRefineMode())}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-200 rounded-md aria-selected:bg-blue-600 aria-selected:text-white cursor-pointer transition-colors my-1"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Toggle Refine Mode</span>
            <Command.Shortcut className="ml-auto text-xs opacity-50">Cmd+R</Command.Shortcut>
          </Command.Item>

          <Command.Item 
            onSelect={() => runCommand(() => navigate('/'))}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-200 rounded-md aria-selected:bg-blue-600 aria-selected:text-white cursor-pointer transition-colors my-1"
          >
            <Layout className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Project Files" className="text-xs font-semibold text-slate-500 mb-2 px-2 mt-4">
            {projectFiles.filter(f => f.type === 'file').slice(0, 10).map(file => (
                <Command.Item 
                    key={file.path}
                    value={file.name}
                    onSelect={() => runCommand(() => { openFile(file.path); navigate('/editor'); })}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-200 rounded-md aria-selected:bg-blue-600 aria-selected:text-white cursor-pointer transition-colors my-1"
                >
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{file.name}</span>
                    <span className="ml-auto text-xs opacity-40 truncate max-w-[100px]">{file.path.split('/').slice(-2).join('/')}</span>
                </Command.Item>
            ))}
        </Command.Group>

        <Command.Group heading="AI Models" className="text-xs font-semibold text-slate-500 mb-2 px-2 mt-4">
            {models.map(model => (
                <Command.Item 
                    key={model.name}
                    value={`model ${model.name}`}
                    onSelect={() => runCommand(() => {
                        selectModel(model.name);
                        toast.success(`Switched to ${model.name}`);
                    })}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-200 rounded-md aria-selected:bg-blue-600 aria-selected:text-white cursor-pointer transition-colors my-1"
                >
                    <BrainCircuit className="w-4 h-4 text-purple-400" />
                    <span>Switch to {model.name}</span>
                </Command.Item>
            ))}
        </Command.Group>

        <Command.Group heading="System" className="text-xs font-semibold text-slate-500 mb-2 px-2 mt-4">
            <Command.Item 
                onSelect={() => runCommand(() => {})}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-200 rounded-md aria-selected:bg-blue-600 aria-selected:text-white cursor-pointer transition-colors my-1"
            >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
            </Command.Item>
            <Command.Item 
                onSelect={() => runCommand(() => logout())}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-300 rounded-md aria-selected:bg-red-600 aria-selected:text-white cursor-pointer transition-colors my-1"
            >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
            </Command.Item>
        </Command.Group>

      </Command.List>
      
      <div className="border-t border-slate-800/50 pt-2 px-2 flex justify-between items-center text-[10px] text-slate-500">
         <div className="flex gap-2">
            <span>Navigate <kbd className="bg-slate-800 px-1 rounded">↓</kbd> <kbd className="bg-slate-800 px-1 rounded">↑</kbd></span>
            <span>Select <kbd className="bg-slate-800 px-1 rounded">↵</kbd></span>
         </div>
         <div className="flex items-center gap-1">
            <CommandIcon className="w-3 h-3" />
            <span>Power Menu</span>
         </div>
      </div>
    </Command.Dialog>
  );
}
