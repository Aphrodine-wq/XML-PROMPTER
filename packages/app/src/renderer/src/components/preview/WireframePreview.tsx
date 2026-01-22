import { useMemo } from 'react';
import { useAppStore } from '../../store';
import { parseXMLToTree, XMLNode } from '../tree/xmlParser';
import { AlertCircle, Layout, Box, Image as ImageIcon, Type, Link, List, Hash } from 'lucide-react';
import { cn } from '../../utils';

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
      <div className="max-w-4xl mx-auto bg-white min-h-[800px] shadow-2xl rounded-lg overflow-hidden flex flex-col transition-all duration-300">
        {/* Browser Mockup Header */}
        <div className="h-8 bg-slate-200 border-b border-slate-300 flex items-center px-4 gap-2 sticky top-0 z-10">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <div className="flex-1 mx-4 h-5 bg-white rounded-md border border-slate-300 flex items-center px-2">
             <span className="text-[10px] text-slate-400 font-mono">localhost:3000</span>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 p-8 space-y-8 font-sans">
           <RecursiveRenderer node={tree} />
        </div>
      </div>
    </div>
  );
}

// 10x Improvement: Generic Recursive Renderer
// Uses heuristics to determine layout based on tag names and attributes
function RecursiveRenderer({ node }: { node: XMLNode }) {
  const tag = node.name.toLowerCase();
  const type = node.attributes?.type || '';
  const style = node.attributes?.style || '';
  
  // Heuristic: Is this a layout container?
  const isLayout = ['section', 'div', 'container', 'row', 'grid', 'header', 'footer', 'main', 'nav'].includes(tag);
  const isList = ['ul', 'ol', 'list', 'features', 'cards'].includes(tag);
  const isText = ['h1', 'h2', 'h3', 'p', 'span', 'text', 'headline', 'subheadline', 'title'].includes(tag);
  const isMedia = ['img', 'image', 'video', 'icon'].includes(tag);
  const isAction = ['button', 'a', 'link', 'cta'].includes(tag);

  // Layout Styles
  const layoutClass = cn(
    "relative transition-all",
    // Grid/Flex heuristics
    (tag === 'grid' || type === 'grid') && "grid grid-cols-1 md:grid-cols-3 gap-6",
    (tag === 'row' || type === 'flex') && "flex flex-wrap gap-4 items-center",
    // Specific container styles
    tag === 'section' && "py-12 border-b border-slate-100 last:border-0",
    tag === 'header' && "flex justify-between items-center py-4 border-b border-slate-200 mb-8",
    tag === 'footer' && "bg-slate-50 mt-12 py-12 border-t border-slate-200",
    tag === 'nav' && "flex gap-6",
    tag === 'card' && "bg-white p-6 rounded-lg shadow-sm border border-slate-100",
  );

  // --- Specialized Renderers ---

  if (tag === 'website_prompt') {
    return <div className="space-y-4">{node.children?.map((c, i) => <RecursiveRenderer key={i} node={c} />)}</div>;
  }

  if (isMedia) {
    return (
      <div className="flex flex-col items-center justify-center bg-slate-100 rounded-lg aspect-video w-full relative overflow-hidden group">
        <ImageIcon className="w-8 h-8 text-slate-300 group-hover:scale-110 transition-transform" />
        <span className="text-[10px] text-slate-400 mt-2 font-mono">{node.content || 'Image'}</span>
      </div>
    );
  }

  if (isAction) {
    return (
      <button className={cn(
        "px-6 py-2 rounded font-medium transition-all active:scale-95",
        type === 'primary' || tag === 'cta' ? "bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
      )}>
        {node.content || 'Click Me'}
      </button>
    );
  }

  if (isText) {
    const TagName = (['h1', 'h2', 'h3'].includes(tag) ? tag : 'p') as any;
    const textClass = cn(
      "text-slate-800",
      tag === 'h1' && "text-4xl font-bold tracking-tight mb-4",
      tag === 'h2' && "text-2xl font-semibold mb-3",
      tag === 'h3' && "text-xl font-medium mb-2",
      tag === 'p' && "text-slate-600 leading-relaxed mb-4",
      type === 'muted' && "text-slate-400"
    );
    return <TagName className={textClass}>{node.content || 'Lorem ipsum text'}</TagName>;
  }

  if (isList) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {node.children?.map((child, i) => (
          <div key={i} className="bg-slate-50 p-4 rounded border border-slate-100">
             <RecursiveRenderer node={child} />
          </div>
        ))}
      </div>
    );
  }

  // Default Container Renderer
  return (
    <div className={layoutClass}>
      {/* Label for debugging/clarity in wireframe */}
      {(tag === 'section' || tag === 'div') && (
        <div className="absolute top-0 left-0 -mt-3 text-[9px] text-slate-300 uppercase tracking-widest font-mono select-none pointer-events-none">
          {tag}
        </div>
      )}
      
      {node.content && <p className="mb-4">{node.content}</p>}
      
      {node.children?.map((child, i) => (
        <RecursiveRenderer key={i} node={child} />
      ))}
    </div>
  );
}
