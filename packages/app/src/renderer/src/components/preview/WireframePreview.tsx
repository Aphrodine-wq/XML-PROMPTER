import { useMemo } from 'react';
import { useAppStore } from '../../store';
import { parseXMLToTree, XMLNode } from '../tree/xmlParser';
import { FileCode, AlertCircle, Layout, Image as ImageIcon, Type, Box } from 'lucide-react';

export function WireframePreview() {
  const { xmlOutput } = useAppStore();

  const tree = useMemo(() => {
    if (!xmlOutput) return null;
    return parseXMLToTree(xmlOutput);
  }, [xmlOutput]);

  if (!xmlOutput) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-4 text-center bg-slate-950">
        <Layout className="w-10 h-10 mb-2 opacity-50" />
        <p className="text-sm">Generate XML to see wireframe</p>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-amber-500 p-4 text-center bg-slate-950">
        <AlertCircle className="w-10 h-10 mb-2 opacity-50" />
        <p className="text-sm">Invalid XML Structure</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-100 p-8 shadow-inner">
      <div className="max-w-4xl mx-auto bg-white min-h-[800px] shadow-2xl rounded-lg overflow-hidden flex flex-col">
        {/* Browser Mockup Header */}
        <div className="h-8 bg-slate-200 border-b border-slate-300 flex items-center px-4 gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <div className="flex-1 mx-4 h-5 bg-white rounded-md border border-slate-300" />
        </div>
        
        {/* Content */}
        <div className="flex-1 p-8 space-y-8">
           <RenderNode node={tree} />
        </div>
      </div>
    </div>
  );
}

function RenderNode({ node }: { node: XMLNode }) {
  const type = node.attributes?.type || node.name;

  // Root wrapper
  if (node.name === 'website_prompt') {
    return (
      <div className="space-y-8">
        {node.children?.map((child, i) => <RenderNode key={i} node={child} />)}
      </div>
    );
  }

  // Sections
  if (node.name === 'section') {
    return (
      <section className="border-2 border-dashed border-slate-300 rounded-lg p-6 relative group hover:border-blue-400 transition-colors">
        <div className="absolute top-0 left-0 bg-slate-200 text-slate-500 text-[10px] font-mono px-2 py-0.5 rounded-br-lg uppercase tracking-wider group-hover:bg-blue-500 group-hover:text-white">
          Section: {type}
        </div>
        
        <div className="space-y-4 mt-2">
          {/* Mock Content based on Type */}
          {type === 'hero' && (
            <div className="flex flex-col items-center text-center space-y-4 py-10">
              <div className="h-12 w-3/4 bg-slate-800 rounded-lg animate-pulse" />
              <div className="h-4 w-1/2 bg-slate-300 rounded animate-pulse" />
              <div className="flex gap-4 mt-4">
                <div className="h-10 w-32 bg-blue-600 rounded-md shadow-md" />
                <div className="h-10 w-32 bg-white border border-slate-300 rounded-md shadow-sm" />
              </div>
            </div>
          )}

          {type === 'features' && (
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 mb-2">
                    <Box className="w-6 h-6" />
                  </div>
                  <div className="h-4 w-24 bg-slate-800 rounded" />
                  <div className="h-2 w-full bg-slate-300 rounded" />
                  <div className="h-2 w-2/3 bg-slate-300 rounded" />
                </div>
              ))}
            </div>
          )}

          {type === 'footer' && (
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
               <div className="h-6 w-24 bg-slate-800 rounded" />
               <div className="flex gap-4">
                 <div className="h-4 w-16 bg-slate-300 rounded" />
                 <div className="h-4 w-16 bg-slate-300 rounded" />
                 <div className="h-4 w-16 bg-slate-300 rounded" />
               </div>
            </div>
          )}

          {/* Generic Children */}
          {node.children?.map((child, i) => <RenderNode key={i} node={child} />)}
        </div>
      </section>
    );
  }

  // Components
  if (node.name === 'component' || node.name === 'element') {
    return (
      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center">
          {type === 'image' ? <ImageIcon className="w-5 h-5 text-slate-400" /> : <Box className="w-5 h-5 text-slate-400" />}
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 bg-slate-800 rounded" />
          <div className="h-2 w-full bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  return null;
}
