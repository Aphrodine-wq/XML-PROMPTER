import { useState, useMemo } from 'react';
import { useAppStore } from '../../store';
import { Search, FileText, Loader2, ArrowRight, BrainCircuit } from 'lucide-react';
import { cn } from '../../utils';

export function SearchSidebar() {
  const { projectFiles, openFile, currentFilePath } = useAppStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ file: string; line: number; content: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mode, setMode] = useState<'simple' | 'semantic'>('simple');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !window.api) return;

    setIsSearching(true);
    setResults([]);

    try {
      if (mode === 'semantic') {
        // Semantic Search (10x Better)
        const semanticResults = await window.api.semanticSearch(query);
        // Map backend results to UI format
        const mappedResults = semanticResults.map((r: any) => ({
          file: r.documentId || 'Unknown File',
          line: 0,
          content: r.content.substring(0, 100) + '...'
        }));
        setResults(mappedResults);
      } else {
        // Simple Client-side Search
        const newResults: { file: string; line: number; content: string }[] = [];
        for (const file of projectFiles) {
            if (file.type !== 'file') continue;
            
            const content = await window.api.readFile(file.path);
            if (!content) continue;

            const lines = content.split('\n');
            lines.forEach((line, index) => {
              if (line.toLowerCase().includes(query.toLowerCase())) {
                newResults.push({
                  file: file.path,
                  line: index + 1,
                  content: line.trim()
                });
              }
            });
        }
        setResults(newResults);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex gap-2 p-1 bg-slate-900 rounded-lg">
            <button
                onClick={() => setMode('simple')}
                className={cn("flex-1 text-xs py-1.5 rounded-md transition-colors", mode === 'simple' ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300")}
            >
                Simple
            </button>
            <button
                onClick={() => setMode('semantic')}
                className={cn("flex-1 text-xs py-1.5 rounded-md transition-colors flex items-center justify-center gap-1", mode === 'semantic' ? "bg-blue-600/20 text-blue-400" : "text-slate-500 hover:text-slate-300")}
            >
                <BrainCircuit className="w-3 h-3" />
                Semantic
            </button>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder={mode === 'semantic' ? "Describe code logic..." : "Search text..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 pl-9 pr-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
          />
        </form>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isSearching ? (
          <div className="flex items-center justify-center h-20 text-slate-500 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Searching...</span>
          </div>
        ) : results.length > 0 ? (
          <div className="py-2">
            <div className="px-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {results.length} results
            </div>
            {results.map((result, i) => (
              <div
                key={i}
                onClick={() => openFile(result.file)}
                className="group flex flex-col gap-1 px-4 py-2 hover:bg-slate-900 cursor-pointer border-b border-slate-900/50"
              >
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <FileText className="w-3 h-3" />
                  <span className="truncate max-w-[180px]" title={result.file}>
                    {result.file.split(/[\\/]/).pop()}
                  </span>
                  <span className="text-slate-600">:</span>
                  <span className="text-blue-400">{result.line}</span>
                </div>
                <div className="text-sm text-slate-300 font-mono truncate pl-5 border-l-2 border-slate-800 group-hover:border-blue-500 transition-colors">
                  {result.content}
                </div>
              </div>
            ))}
          </div>
        ) : query && !isSearching ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-center px-4">
             <p className="text-sm">No results found for "{query}"</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-slate-600 text-center px-4">
            <Search className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-xs">Search for tags, attributes, or content across your project.</p>
          </div>
        )}
      </div>
    </div>
  );
}
