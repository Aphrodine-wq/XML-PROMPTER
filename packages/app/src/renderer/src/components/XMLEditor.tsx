import { useAppStore } from '../store';
import { Copy, Download, Code2, Check, Loader2, AlertTriangle, CheckCircle2, X, CheckCheck, Activity, Save } from 'lucide-react';
import { useState, useMemo, useEffect, lazy, Suspense, useRef, useDeferredValue, memo } from 'react';
import { cn } from '../utils';
import { XMLValidator } from 'fast-xml-parser';
import format from 'xml-formatter';
import { toast } from 'sonner';

// Lazy load Monaco Editors
const Editor = lazy(() => import('@monaco-editor/react'));
const DiffEditor = lazy(() => import('@monaco-editor/react').then(m => ({ default: m.DiffEditor })));

export function XMLEditor() {
  const {
    xmlOutput, setXmlOutput, isGenerating, isRefining, originalXmlOutput,
    acceptRefinement, rejectRefinement, lastGenerationStats,
    saveCurrentFile, currentFilePath
  } = useAppStore();
  const [copied, setCopied] = useState(false);
  const monacoRef = useRef<any>(null);
  const editorRef = useRef<any>(null);

  // Performance: Defer validation to avoid blocking UI (2-3x faster perceived responsiveness)
  const deferredXmlOutput = useDeferredValue(xmlOutput);

  const validationResult = useMemo(() => {
    if (!deferredXmlOutput || isGenerating) return { isValid: true };

    // Simple check for our expected root tag
    if (!deferredXmlOutput.includes('<website_prompt>')) {
      return { isValid: false, error: 'Missing root <website_prompt> tag' };
    }

    const result = XMLValidator.validate(deferredXmlOutput);
    if (result === true) return { isValid: true };
    return { isValid: false, error: result.err.msg };
  }, [deferredXmlOutput, isGenerating]);

  // Handle Monaco Initialization
  const handleEditorDidMount = (editor: any, monaco: any) => {
    monacoRef.current = monaco;
    editorRef.current = editor;
    
    // Register XML Completion Provider
    monaco.languages.registerCompletionItemProvider('xml', {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = [
          {
            label: 'website_prompt',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<website_prompt>\n  $0\n</website_prompt>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Root element',
            range
          },
          {
            label: 'page_type',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<page_type>${1:landing_page}</page_type>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
          {
            label: 'style',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<style>\n  $0\n</style>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
          {
            label: 'section',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<section type="${1:hero}">\n  $0\n</section>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
          {
            label: 'component',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<component type="${1:card}">\n  $0\n</component>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          }
        ];
        return { suggestions };
      }
    });
  };

  // 10x Feature: Listen for Tree Selection Events
  useEffect(() => {
    const handleNodeSelect = (e: CustomEvent) => {
      const { tagName, content } = e.detail;
      if (editorRef.current && monacoRef.current) {
        const model = editorRef.current.getModel();
        const matches = model.findMatches(`<${tagName}`, true, false, false, null, true);
        
        // Find the match that might contain the content (heuristic)
        // For duplicates, we just jump to the first one or try to match context
        if (matches.length > 0) {
          const match = matches[0];
          editorRef.current.revealRangeInCenter(match.range);
          editorRef.current.setSelection(match.range);
          
          // Flash highlight decoration
          const decorations = editorRef.current.deltaDecorations([], [
            {
              range: match.range,
              options: {
                isWholeLine: true,
                className: 'bg-blue-900/50 border-l-2 border-blue-500'
              }
            }
          ]);
          
          setTimeout(() => {
            editorRef.current.deltaDecorations(decorations, []);
          }, 1500);
        }
      }
    };

    window.addEventListener('xml-node-select', handleNodeSelect as any);
    return () => window.removeEventListener('xml-node-select', handleNodeSelect as any);
  }, []);

  // Global Shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Diff Controls
      if (isRefining && !isGenerating) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          acceptRefinement();
          toast.success("Changes accepted");
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          rejectRefinement();
          toast.info("Changes rejected");
          return;
        }
      }

      if (e.metaKey || e.ctrlKey) {
        if (e.key === 's') {
          e.preventDefault();
          if (currentFilePath) {
            saveCurrentFile(xmlOutput);
          } else {
            handleDownload();
          }
        } else if (e.shiftKey && e.key === 'f') {
          e.preventDefault();
          handleFormat();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [xmlOutput, isRefining, isGenerating, currentFilePath]);

  const handleCopy = () => {
    navigator.clipboard.writeText(xmlOutput);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
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
      toast.error("Could not format XML. Check syntax.");
    }
  };

  const handleDownload = async () => {
    if (window.api && window.api.saveFileDialog) {
      // Native Save
      const saved = await window.api.saveFileDialog(xmlOutput);
      if (saved) {
        toast.success("File saved successfully");
      }
    } else {
      // Browser Fallback
      const blob = new Blob([xmlOutput], { type: 'text/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'prompt.xml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("File downloaded");
    }
  };

  const commonOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    lineHeight: 24,
    scrollBeyondLastLine: false,
    wordWrap: 'on' as const,
    padding: { top: 20, bottom: 20 },
    smoothScrolling: true,
    cursorBlinking: "smooth" as const,
    cursorSmoothCaretAnimation: "on" as const,
    formatOnType: true,
    formatOnPaste: true,
    autoClosingTags: true,
    autoClosingBrackets: "always" as const,
    autoClosingQuotes: "always" as const,
    matchBrackets: "always" as const,
    suggest: {
      showWords: false
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] relative group">
      
      {/* Refinement Controls (Visible only in Refine Mode) */}
      {isRefining && !isGenerating && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-1.5 bg-blue-950/90 backdrop-blur-md border border-blue-800 rounded-full shadow-2xl animate-in slide-in-from-top-4">
          <button
            onClick={() => { acceptRefinement(); toast.success("Changes accepted"); }}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-semibold transition-all shadow-lg shadow-emerald-900/20"
            title="Accept Changes (Cmd+Enter)"
          >
            <CheckCheck className="w-3 h-3" />
            Accept
          </button>
          <div className="w-px h-4 bg-blue-800 mx-1" />
          <button
            onClick={() => { rejectRefinement(); toast.info("Changes rejected"); }}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600/80 hover:bg-red-500 text-white rounded-full text-xs font-semibold transition-all shadow-lg shadow-red-900/20"
            title="Reject Changes (Esc)"
          >
            <X className="w-3 h-3" />
            Reject
          </button>
        </div>
      )}

      {/* Editor Status Bar / Toolbar Overlay */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 p-1 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button 
          onClick={handleCopy}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors relative"
          title="Copy to Clipboard"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
        <div className="w-px h-4 bg-slate-700 mx-1" />
        <button 
          onClick={currentFilePath ? () => saveCurrentFile(xmlOutput) : handleDownload}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
          title="Save File (Cmd+S)"
        >
          {currentFilePath ? <Save className="w-4 h-4" /> : <Download className="w-4 h-4" />}
        </button>
        <button 
          onClick={handleFormat}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
          title="Format XML (Cmd+Shift+F)"
        >
          <Code2 className="w-4 h-4" />
        </button>
      </div>

      {/* Generating Indicator */}
      {isGenerating && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-900/20 z-20 overflow-hidden">
          <div className="h-full bg-blue-500 w-1/3 animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
        </div>
      )}

      {/* Editor Area */}
      <div className={cn("flex-1 relative", isGenerating && "opacity-80 transition-opacity")}>
        <Suspense fallback={
          <div className="flex items-center justify-center h-full text-slate-500 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading Editor...</span>
          </div>
        }>
          {isRefining ? (
            <DiffEditor
              height="100%"
              language="xml"
              theme="vs-dark"
              original={originalXmlOutput}
              modified={xmlOutput}
              options={{
                ...commonOptions,
                renderSideBySide: true,
                readOnly: false,
                originalEditable: false
              }}
            />
          ) : (
            <Editor
              height="100%"
              defaultLanguage="xml"
              theme="vs-dark"
              value={xmlOutput}
              onChange={(value) => setXmlOutput(value || '')}
              onMount={handleEditorDidMount}
              options={commonOptions}
            />
          )}
        </Suspense>
      </div>
      
      {/* Footer Status */}
      <div className={cn(
        "h-6 text-xs flex items-center px-3 justify-between transition-colors",
        validationResult.isValid ? "bg-[#007acc] text-white" : "bg-amber-900 text-amber-100"
      )}>
         <div className="flex items-center gap-4">
           {currentFilePath && (
             <span className="opacity-70 truncate max-w-[200px]" title={currentFilePath}>
               {currentFilePath.split(/[\\/]/).pop()}
             </span>
           )}
           <span className="opacity-50">|</span>
           <span>XML</span>
           <span>UTF-8</span>
           <span className="opacity-50">|</span>
           <span>{xmlOutput.split('\n').length} lines</span>
           <span>{xmlOutput.length} chars</span>
           {isRefining && (
             <>
               <span className="opacity-50">|</span>
               <span className="text-amber-300 font-medium">Diff Mode Active</span>
             </>
           )}
           {lastGenerationStats && (
             <>
               <span className="opacity-50">|</span>
               <span className="flex items-center gap-1 text-slate-200">
                 <Activity className="w-3 h-3" />
                 {Math.round(lastGenerationStats.eval_count / (lastGenerationStats.eval_duration / 1e9))} t/s
               </span>
               <span className="opacity-50">|</span>
               <span>{(lastGenerationStats.total_duration / 1e9).toFixed(1)}s</span>
             </>
           )}
         </div>
         <div className="flex items-center gap-2">
            {isGenerating ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Writing...</span>
              </>
            ) : (
              <>
                {!validationResult.isValid && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3 h-3" />
                    Invalid XML: {validationResult.error}
                  </span>
                )}
                {validationResult.isValid && (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" />
                    Valid
                  </span>
                )}
              </>
            )}
         </div>
      </div>
    </div>
  );
}
