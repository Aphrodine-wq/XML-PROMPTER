import { useAppStore } from '../../store';
import { Loader2, Code2, Download, RefreshCcw, FolderOutput } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { cn } from '../../utils';

const Editor = lazy(() => import('@monaco-editor/react'));

export function CodePreview() {
  const { codeOutput, isGeneratingCode, generateCode, generateProject, setCodeOutput, activeProjectPath } = useAppStore();

  const handleDownload = () => {
    const blob = new Blob([codeOutput], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!codeOutput && !isGeneratingCode) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-4 text-center bg-[#1e1e1e]">
        <Code2 className="w-12 h-12 mb-4 opacity-30" />
        <h3 className="text-lg font-medium text-slate-300 mb-2">Ready to Build</h3>
        <p className="text-sm max-w-xs mb-6">Convert your XML blueprint into code.</p>
        
        <div className="flex gap-4">
            <button 
              onClick={generateCode}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-medium transition-colors flex items-center gap-2"
            >
              <Code2 className="w-4 h-4" />
              Generate Single File
            </button>
            
            <button 
              onClick={generateProject}
              disabled={!activeProjectPath}
              title={!activeProjectPath ? "Open a project folder first" : "Generate full React project structure"}
              className={cn(
                  "px-6 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-md font-medium transition-colors flex items-center gap-2",
                  !activeProjectPath && "opacity-50 cursor-not-allowed"
              )}
            >
              <FolderOutput className="w-4 h-4" />
              Generate Project
            </button>
        </div>
        {!activeProjectPath && (
            <p className="text-xs text-orange-400 mt-4">Open a folder to enable Project Generation</p>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Toolbar */}
      <div className="h-10 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/50">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Code2 className="w-4 h-4" />
          <span>Generated App</span>
          {isGeneratingCode && <span className="text-blue-400 animate-pulse text-xs ml-2">Building...</span>}
        </div>
        <div className="flex items-center gap-2">
          <button 
             onClick={generateProject}
             disabled={isGeneratingCode || !activeProjectPath}
             className={cn(
                 "flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors text-xs font-medium mr-2",
                 !activeProjectPath && "opacity-50 cursor-not-allowed"
             )}
             title="Generate full project to disk"
          >
            <FolderOutput className="w-3 h-3" />
            <span>Generate Project</span>
          </button>
          
          <div className="w-px h-4 bg-slate-700 mx-1" />

          <button 
             onClick={generateCode}
             className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
             title="Regenerate Single File"
             disabled={isGeneratingCode}
          >
            <RefreshCcw className={cn("w-4 h-4", isGeneratingCode && "animate-spin")} />
          </button>
          <button 
             onClick={handleDownload}
             className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
             title="Download HTML"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Source Code */}
        <div className="w-1/2 border-r border-slate-800 relative group">
          <Suspense fallback={<div className="p-4 text-slate-500">Loading Editor...</div>}>
            <Editor
              height="100%"
              defaultLanguage="html"
              theme="vs-dark"
              value={codeOutput}
              onChange={(v) => setCodeOutput(v || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 12,
                wordWrap: 'on',
                readOnly: false
              }}
            />
          </Suspense>
          {isGeneratingCode && (
            <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center z-10 backdrop-blur-sm">
               <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg shadow-2xl flex flex-col items-center gap-3">
                 <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                 <span className="text-sm font-medium text-blue-200">Writing Code...</span>
               </div>
            </div>
          )}
        </div>

        {/* Live Preview */}
        <div className="w-1/2 bg-white relative">
          {codeOutput ? (
            <iframe 
              srcDoc={codeOutput}
              className="w-full h-full border-none"
              title="App Preview"
              sandbox="allow-scripts" // Allow JS to run
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Preview will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
