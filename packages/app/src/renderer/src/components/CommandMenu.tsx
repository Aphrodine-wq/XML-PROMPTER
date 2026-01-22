import { Command } from 'cmdk';
import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { 
  Settings, 
  Search,
  FileCode,
  Sparkles,
  Download,
  RefreshCcw,
  Code2,
  Maximize2,
  Minimize2,
  AlignLeft,
  User,
  Plus,
  Code,
  Users,
  Share2
} from 'lucide-react';
import format from 'xml-formatter';
import { toast } from 'sonner';
import { ExportDialog } from './export/ExportDialog';

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const { 
    models, 
    selectModel, 
    templates, 
    loadTemplate, 
    history, 
    loadHistory,
    toggleRefineMode,
    isRefining,
    xmlOutput,
    setXmlOutput,
    isZenMode,
    toggleZenMode,
    snippets,
    addSnippet,
    personas,
    activePersonaId,
    setActivePersona
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

  const handleFormat = () => {
    try {
      const formatted = format(xmlOutput, {
        indentation: '  ',
        filter: (node) => node.type !== 'Comment',
        collapseContent: true,
        lineSeparator: '\n'
      });
      setXmlOutput(formatted);
      toast.success("XML formatted");
    } catch (e) {
      toast.error("Could not format XML");
    }
  };

  const insertSnippet = (content: string) => {
    setXmlOutput(xmlOutput + '\n\n' + content);
    toast.success("Snippet inserted");
  };

  return (
    <>
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Global Command Menu"
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[640px] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      >
        <div className="flex items-center border-b border-slate-800 px-3" cmdk-input-wrapper="">
          <Search className="w-5 h-5 text-slate-500 mr-2" />
          <Command.Input 
            className="w-full bg-transparent p-4 text-lg text-slate-200 outline-none placeholder:text-slate-600 font-sans"
            placeholder="Type a command or search..." 
          />
        </div>
        
        <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-hide">
          <Command.Empty className="py-6 text-center text-slate-500">No results found.</Command.Empty>

          <Command.Group heading="Global Actions" className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Command.Item 
              className="flex items-center gap-2 px-2 py-2 text-sm text-slate-300 rounded-md cursor-pointer aria-selected:bg-blue-600 aria-selected:text-white transition-colors"
              onSelect={() => runCommand(() => toggleZenMode())}
            >
              {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span>{isZenMode ? 'Exit Zen Mode' : 'Enter Zen Mode'}</span>
            </Command.Item>

            <Command.Item 
              className="flex items-center gap-2 px-2 py-2 text-sm text-slate-300 rounded-md cursor-pointer aria-selected:bg-blue-600 aria-selected:text-white transition-colors"
              onSelect={() => runCommand(() => toggleRefineMode())}
            >
              <RefreshCcw className="w-4 h-4" />
              <span>{isRefining ? 'Exit Refine Mode' : 'Enter Refine Mode'}</span>
            </Command.Item>
            
            <Command.Item 
              className="flex items-center gap-2 px-2 py-2 text-sm text-slate-300 rounded-md cursor-pointer aria-selected:bg-blue-600 aria-selected:text-white transition-colors"
              onSelect={() => runCommand(() => handleFormat())}
            >
              <AlignLeft className="w-4 h-4" />
              <span>Format XML Document</span>
            </Command.Item>

            <Command.Item 
              className="flex items-center gap-2 px-2 py-2 text-sm text-slate-300 rounded-md cursor-pointer aria-selected:bg-blue-600 aria-selected:text-white transition-colors"
              onSelect={() => runCommand(() => {
                 if (window.api && window.api.saveFileDialog) {
                   window.api.saveFileDialog(xmlOutput);
                 }
              })}
            >
              <Download className="w-4 h-4" />
              <span>Save XML File</span>
            </Command.Item>

            <Command.Item 
              className="flex items-center gap-2 px-2 py-2 text-sm text-slate-300 rounded-md cursor-pointer aria-selected:bg-blue-600 aria-selected:text-white transition-colors"
              onSelect={() => runCommand(() => setExportOpen(true))}
            >
              <Share2 className="w-4 h-4" />
              <span>Export Project Code...</span>
            </Command.Item>
          </Command.Group>

          <Command.Group heading="AI Personas" className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">
            {personas.map(p => (
              <Command.Item 
                key={p.id}
                className="flex items-center gap-2 px-2 py-2 text-sm text-slate-300 rounded-md cursor-pointer aria-selected:bg-blue-600 aria-selected:text-white transition-colors"
                onSelect={() => runCommand(() => setActivePersona(p.id))}
              >
                <Users className="w-4 h-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{p.name} {activePersonaId === p.id && "(Active)"}</span>
                  <span className="text-[10px] text-slate-500">{p.description}</span>
                </div>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="AI Models" className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">
            {models.map(m => (
              <Command.Item 
                key={m.digest}
                className="flex items-center gap-2 px-2 py-2 text-sm text-slate-300 rounded-md cursor-pointer aria-selected:bg-blue-600 aria-selected:text-white transition-colors"
                onSelect={() => runCommand(() => selectModel(m.name))}
              >
                <Sparkles className="w-4 h-4" />
                <span>Switch to {m.name}</span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Snippets" className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">
            <Command.Item 
              className="flex items-center gap-2 px-2 py-2 text-sm text-slate-300 rounded-md cursor-pointer aria-selected:bg-blue-600 aria-selected:text-white transition-colors"
              onSelect={() => runCommand(async () => {
                const name = window.prompt("Snippet Name:");
                if (!name) return;
                const content = window.prompt("Content:");
                if (!content) return;
                await addSnippet(name, content);
              })}
            >
              <Plus className="w-4 h-4" />
              <span>Create New Snippet...</span>
            </Command.Item>
            
            {snippets.map(s => (
              <Command.Item 
                key={s.id}
                className="flex items-center gap-2 px-2 py-2 text-sm text-slate-300 rounded-md cursor-pointer aria-selected:bg-blue-600 aria-selected:text-white transition-colors"
                onSelect={() => runCommand(() => insertSnippet(s.content))}
              >
                <Code className="w-4 h-4" />
                <span>Insert: {s.name}</span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Templates" className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">
            {templates.map(t => (
              <Command.Item 
                key={t.id}
                className="flex items-center gap-2 px-2 py-2 text-sm text-slate-300 rounded-md cursor-pointer aria-selected:bg-blue-600 aria-selected:text-white transition-colors"
                onSelect={() => runCommand(() => loadTemplate(t))}
              >
                <FileCode className="w-4 h-4" />
                <span>Load: {t.name}</span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Recent History" className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">
            {history.slice(0, 5).map(h => (
              <Command.Item 
                key={h.id}
                className="flex items-center gap-2 px-2 py-2 text-sm text-slate-300 rounded-md cursor-pointer aria-selected:bg-blue-600 aria-selected:text-white transition-colors"
                onSelect={() => runCommand(() => loadHistory(h))}
              >
                <Code2 className="w-4 h-4" />
                <span className="truncate">{h.prompt}</span>
              </Command.Item>
            ))}
          </Command.Group>

        </Command.List>
      </Command.Dialog>

      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
    </>
  );
}
