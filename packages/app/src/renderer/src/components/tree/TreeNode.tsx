import { useState } from 'react';
import { ChevronRight, ChevronDown, Hash, Tag, Type } from 'lucide-react';
import { XMLNode } from './xmlParser';
import { cn } from '../../utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TreeNodeProps {
  node: XMLNode;
  depth?: number;
  onSelect?: (node: XMLNode) => void;
}

export function TreeNode({ node, depth = 0, onSelect }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="select-none">
      <div 
        className={cn(
          "flex items-center gap-1 py-1 px-2 hover:bg-slate-800/50 rounded cursor-pointer transition-colors text-xs font-mono group",
          depth > 0 && "ml-4"
        )}
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
          onSelect?.(node);
        }}
      >
        <span className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-slate-300">
          {hasChildren ? (
            expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
          ) : (
            <div className="w-1 h-1 bg-slate-700 rounded-full" />
          )}
        </span>
        
        <Tag className="w-3 h-3 text-blue-400" />
        <span className="text-blue-200 font-semibold">{node.name}</span>
        
        {node.attributes && Object.keys(node.attributes).length > 0 && (
          <div className="flex gap-2 ml-2 overflow-hidden opacity-70 group-hover:opacity-100">
            {Object.entries(node.attributes).map(([key, val]) => (
              <span key={key} className="text-slate-400 flex items-center">
                <span className="text-purple-300">{key}</span>
                <span className="text-slate-500">=</span>
                <span className="text-green-300">"{val}"</span>
              </span>
            ))}
          </div>
        )}

        {node.content && (
           <span className="ml-2 text-slate-400 truncate max-w-[150px] flex items-center gap-1">
             <Type className="w-3 h-3 opacity-50" />
             "{node.content}"
           </span>
        )}
      </div>

      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {node.children!.map((child, i) => (
              <TreeNode key={i} node={child} depth={depth + 1} onSelect={onSelect} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
