import { useState, useEffect } from 'react';
import { FolderOpen, RefreshCw, Wand2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Skill {
  name: string;
  description: string;
  id: string;
}

export function SkillsManager() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [skillsPath, setSkillsPath] = useState<string | null>(null);

  useEffect(() => {
    // Initial load check
    loadSkills(undefined, true);
  }, []);

  const loadSkills = async (path?: string, silent = false) => {
    if (!window.api?.loadSkills) return;
    
    setLoading(true);
    try {
      const result = await window.api.loadSkills(path);
      if (result.success) {
        setSkillsPath(result.path);
        if (!silent) toast.success(`Skills loaded from ${result.path}`);
        
        // Since we don't have an API to list skills yet, we assume success means they are loaded.
        // In a real app, we'd fetch the list from the PluginManager via IPC.
        // For now, we'll show a success state.
      } else {
        if (!silent) toast.error(`Failed to load skills: ${result.error}`);
      }
    } catch (e) {
      console.error(e);
      if (!silent) toast.error("Error loading skills");
    } finally {
      setLoading(false);
    }
  };

  const handleBrowse = async () => {
    if (!window.api?.openFolderDialog) return;
    const path = await window.api.openFolderDialog();
    if (path) {
      loadSkills(path);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="p-4 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Skills & Tools</h3>
        
        <div className="flex gap-2">
          <button 
            onClick={handleBrowse}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 px-3 rounded-md flex items-center justify-center gap-2 transition-colors border border-slate-700"
          >
            <FolderOpen className="w-3 h-3" />
            Load Folder
          </button>
          <button 
            onClick={() => loadSkills(skillsPath || undefined)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-md transition-colors border border-slate-700"
            title="Reload Skills"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {skillsPath && (
          <div className="mt-2 text-[10px] text-slate-600 truncate font-mono">
            {skillsPath}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {skillsPath ? (
          <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/50">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-slate-200">Skills System Active</span>
            </div>
            <p className="text-xs text-slate-500">
              The AI can now use custom skills found in your skills folder.
              Add <code>.js</code> or <code>.ts</code> files to extend capabilities.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-slate-600 text-center px-4">
            <Wand2 className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-xs">Load a folder containing skill scripts to extend the AI.</p>
          </div>
        )}
      </div>
    </div>
  );
}
