import { useMemo } from 'react';
import { useAppStore } from '../../store';
import { parseXMLToTree } from './xmlParser';
import { TreeNode } from './TreeNode';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { FileJson, AlertCircle } from 'lucide-react';

export function XMLTreeVisualizer() {
  const { xmlOutput } = useAppStore();

  const tree = useMemo(() => {
    if (!xmlOutput) return null;
    return parseXMLToTree(xmlOutput);
  }, [xmlOutput]);

  const handleNodeSelect = (node: any) => {
    // In a real implementation, we would map the node back to a line number
    // using a parser that supports CST (Concrete Syntax Tree) or location tracking.
    // fast-xml-parser's preserveOrder mode is complex for line mapping.
    // For now, we'll just log or implement a simple text search scroll later.
    console.log("Selected", node);
  };

  if (!xmlOutput) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-4 text-center">
        <FileJson className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">Generate XML to see structure</p>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-amber-500 p-4 text-center">
        <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">Invalid or empty XML</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-2 bg-[#1e1e1e] border-l border-slate-800">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Structure</div>
      <TreeNode node={tree} onSelect={handleNodeSelect} />
    </div>
  );
}
