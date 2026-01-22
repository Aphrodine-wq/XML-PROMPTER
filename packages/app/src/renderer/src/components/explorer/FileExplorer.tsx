import { useAppStore } from '../../store';
import { FolderOpen, FileText, RefreshCw, Plus } from 'lucide-react';
import { cn } from '../../utils';

export function FileExplorer() {
  const { 
    activeProjectPath, 
    projectFiles, 
    openProject, 
    refreshProjectFiles, 
    openFile, 
    currentFilePath,
    setXmlOutput,
    saveCurrentFile
  } = useAppStore();

  const handleCreateFile = async () => {
    if (!window.api || !activeProjectPath) return;
    const name = window.prompt("New File Name (e.g., page.xml):");
    if (!name) return;
    
    // Simple path join (could be more robust)
    // Assuming windows for now based on env, but let's try to use forward slashes for consistency or just concat
    // Ideally we'd use a path joiner from preload but let's just use string concat carefully
    const separator = activeProjectPath.includes('\\') ? '\\' : '/';
    const newPath = `${activeProjectPath}${separator}${name.endsWith('.xml') ? name : name + '.xml'}`;
    
    const success = await window.api.writeFile(newPath, '<website_prompt>\n  <!-- New File -->\n</website_prompt>');
    if (success) {
      await refreshProjectFiles();
      await openFile(newPath);
    }
  };

  if (!activeProjectPath) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center space-y-4">
        <FolderOpen className="w-10 h-10 text-slate-600" />
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-300">No Project Open</h3>
          <p className="text-xs text-slate-500">Open a folder to manage your XML files.</p>
        </div>
        <button 
          onClick={openProject}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-md transition-colors shadow-lg shadow-blue-900/20"
        >
          Open Folder
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 shrink-0">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate" title={activeProjectPath}>
          {activeProjectPath.split(/[\\/]/).pop()}
        </span>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleCreateFile}
            className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="New File"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button 
            onClick={refreshProjectFiles}
            className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2">
        {projectFiles.length === 0 ? (
           <div className="px-4 py-2 text-xs text-slate-500 italic">No XML files found</div>
        ) : (
          projectFiles.map(file => (
            <div 
              key={file.path}
              onClick={() => openFile(file.path)}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 cursor-pointer text-sm transition-colors border-l-2",
                currentFilePath === file.path 
                  ? "bg-slate-800/50 text-blue-400 border-blue-500" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border-transparent"
              )}
            >
              <FileText className="w-3.5 h-3.5 opacity-70" />
              <span className="truncate">{file.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
