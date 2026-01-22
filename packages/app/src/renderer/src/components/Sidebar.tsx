import { 
  Folder, History, Settings, FileCode, Plus, ChevronLeft, ChevronRight, LogOut, User,
  Layout, Type, Image, Code, Files, Search
} from 'lucide-react';
import { cn } from '../utils';
import { useAppStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
import { FileExplorer } from './explorer/FileExplorer';
import { SearchSidebar } from './search/SearchSidebar';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { templates, history, loadTemplate, loadHistory, logout, user, setXmlOutput, xmlOutput, snippets, addSnippet } = useAppStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'files' | 'snippets' | 'project' | 'search'>('project');
  const [snippetDialogOpen, setSnippetDialogOpen] = useState(false);
  const [currentSnippet, setCurrentSnippet] = useState<{ content: string; variables: string[] } | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const parseVariables = (content: string) => {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = [...content.matchAll(regex)];
    return matches.map(m => m[1]);
  };

  const handleSnippetClick = (content: string) => {
    const variables = parseVariables(content);
    if (variables.length > 0) {
      setCurrentSnippet({ content, variables });
      setVariableValues({});
      setSnippetDialogOpen(true);
    } else {
      insertSnippet(content);
    }
  };

  const insertSnippet = (content: string) => {
    setXmlOutput(xmlOutput + '\n\n' + content);
    toast.success("Snippet inserted");
  };

  const handleVariableSubmit = () => {
    if (!currentSnippet) return;
    let finalContent = currentSnippet.content;
    Object.entries(variableValues).forEach(([key, value]) => {
      finalContent = finalContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    insertSnippet(finalContent);
    setSnippetDialogOpen(false);
  };

  const handleCreateSnippet = async () => {
    const name = window.prompt("Snippet Name:");
    if (!name) return;
    
    const content = window.prompt("Snippet XML Content (use {{var}} for variables):", "<section title=\"{{Title}}\">\n  {{Content}}\n</section>");
    if (!content) return;

    await addSnippet(name, content);
  };

  return (
    <>
      <motion.div 
        initial={false}
        animate={{ width: collapsed ? 56 : '100%' }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-slate-950/95 backdrop-blur-sm text-slate-400 flex flex-col h-full border-r border-slate-800"
      >
        {/* Header */}
        <div className={cn(
          "h-14 border-b border-slate-800 flex items-center px-4",
          collapsed ? "justify-center px-0" : "justify-between"
        )}>
          {!collapsed && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex items-center gap-2 font-bold text-slate-100"
            >
              <div className="bg-blue-600 p-1 rounded shadow-lg shadow-blue-900/50">
                <FileCode className="w-4 h-4 text-white" />
              </div>
              <span>XML Gen</span>
            </motion.div>
          )}
          <button 
            onClick={onToggle}
            className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Tab Switcher (New) */}
        {!collapsed && (
          <div className="flex p-2 gap-1 border-b border-slate-800">
             <button 
              onClick={() => setActiveTab('project')}
              className={cn(
                "flex-1 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-2",
                activeTab === 'project' ? "bg-slate-800 text-slate-200" : "hover:bg-slate-900 text-slate-500"
              )}
              title="Project Explorer"
            >
              <Files className="w-3 h-3" />
            </button>
            <button 
              onClick={() => setActiveTab('search')}
              className={cn(
                "flex-1 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-2",
                activeTab === 'search' ? "bg-slate-800 text-slate-200" : "hover:bg-slate-900 text-slate-500"
              )}
              title="Global Search"
            >
              <Search className="w-3 h-3" />
            </button>
            <button 
              onClick={() => setActiveTab('files')}
              className={cn(
                "flex-1 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-2",
                activeTab === 'files' ? "bg-slate-800 text-slate-200" : "hover:bg-slate-900 text-slate-500"
              )}
              title="Templates & History"
            >
              <Folder className="w-3 h-3" />
            </button>
            <button 
               onClick={() => setActiveTab('snippets')}
               className={cn(
                 "flex-1 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-2",
                 activeTab === 'snippets' ? "bg-slate-800 text-slate-200" : "hover:bg-slate-900 text-slate-500"
               )}
               title="Snippets"
            >
              <Code className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col py-2">
          {activeTab === 'project' ? (
             <FileExplorer />
          ) : activeTab === 'search' ? (
             <SearchSidebar />
          ) : activeTab === 'files' ? (
            <>
               {/* New Action */}
              <div className="px-2 mb-2">
                <button className={cn(
                  "w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover:-translate-y-0.5",
                  collapsed ? "h-10 w-10 p-0" : "h-8 px-4 gap-2"
                )}>
                  <Plus className="w-4 h-4" />
                  {!collapsed && <span className="font-medium text-sm">New Prompt</span>}
                </button>
              </div>

              {!collapsed && <div className="px-4 py-2 text-xs font-semibold uppercase text-slate-600 shrink-0">Templates</div>}
              <div className={cn("shrink-0", collapsed ? "h-0 hidden" : "max-h-[30%]")}>
                {templates.map(t => (
                   <NavItem 
                     key={t.id} 
                     icon={<Folder className="w-4 h-4" />} 
                     label={t.name} 
                     collapsed={collapsed}
                     onClick={() => loadTemplate(t)}
                   />
                 ))}
              </div>
              
              {!collapsed && <div className="px-4 mt-4 py-2 text-xs font-semibold uppercase text-slate-600 shrink-0">Recent</div>}
              <div className="flex-1">
                {history.length > 0 ? (
                  <Virtuoso
                    style={{ height: '100%' }}
                    data={history}
                    itemContent={(index, h) => (
                      <NavItem 
                        key={h.id} 
                        icon={<History className="w-4 h-4" />} 
                        label={h.prompt} 
                        collapsed={collapsed}
                        onClick={() => loadHistory(h)}
                      />
                    )}
                  />
                ) : (
                  <div className="px-4 py-2 text-sm text-slate-600 italic">No history yet</div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto px-2 space-y-1">
               <div className="px-2 mb-2">
                <button 
                  onClick={handleCreateSnippet}
                  className={cn(
                    "w-full bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md flex items-center justify-center transition-all border border-slate-700",
                    collapsed ? "h-10 w-10 p-0" : "h-8 px-4 gap-2"
                  )}
                >
                  <Plus className="w-3 h-3" />
                  {!collapsed && <span className="font-medium text-xs">Add Snippet</span>}
                </button>
               </div>

               {snippets.map(s => (
                 <NavItem 
                   key={s.id}
                   icon={<Code className="w-4 h-4" />}
                   label={s.name}
                   collapsed={collapsed}
                   onClick={() => handleSnippetClick(s.content)}
                 />
               ))}
               {snippets.length === 0 && (
                 <div className="px-4 py-2 text-sm text-slate-600 italic text-center">No snippets</div>
               )}
            </div>
          )}

          <div className="shrink-0 border-t border-slate-800 mt-2">
            {!collapsed && <div className="px-4 mt-2 py-2 text-xs font-semibold uppercase text-slate-600">App</div>}
            <NavItem icon={<Settings className="w-4 h-4" />} label="Settings" collapsed={collapsed} />
          </div>
        </div>

        {/* User Footer */}
        <div className="p-2 border-t border-slate-800 shrink-0">
          <div className={cn(
            "flex items-center gap-3 p-2 rounded-md hover:bg-slate-900 transition-colors cursor-pointer group",
            collapsed && "justify-center px-0"
          )}>
             <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700 shadow-inner">
               {user?.avatar ? <img src={user.avatar} alt="User" /> : <User className="w-4 h-4" />}
             </div>
             {!collapsed && (
               <div className="flex-1 min-w-0">
                 <div className="text-sm font-medium text-slate-200 truncate">{user?.name}</div>
                 <div className="text-xs text-slate-500">Pro Plan</div>
               </div>
             )}
             {!collapsed && (
               <button onClick={handleLogout} className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-red-400 transition-colors">
                 <LogOut className="w-4 h-4" />
               </button>
             )}
          </div>
        </div>
      </motion.div>

      {/* Snippet Variable Dialog */}
      <Dialog.Root open={snippetDialogOpen} onOpenChange={setSnippetDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-6 animate-in zoom-in-95 duration-200">
            <Dialog.Title className="text-lg font-semibold text-slate-100 mb-4">Snippet Variables</Dialog.Title>
            <div className="space-y-4">
              {currentSnippet?.variables.map(variable => (
                <div key={variable} className="space-y-1">
                  <label className="text-xs font-medium text-slate-400 uppercase">{variable}</label>
                  <input 
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
                    value={variableValues[variable] || ''}
                    onChange={(e) => setVariableValues(prev => ({ ...prev, [variable]: e.target.value }))}
                    placeholder={`Enter ${variable}...`}
                    autoFocus={variable === currentSnippet.variables[0]}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button 
                onClick={() => setSnippetDialogOpen(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleVariableSubmit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors"
              >
                Insert Snippet
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function NavItem({ icon, label, collapsed, active, onClick }: { icon: React.ReactNode, label: string, collapsed: boolean, active?: boolean, onClick?: () => void }) {
  return (
    <motion.div 
      onClick={onClick}
      whileHover={{ scale: 1.02, x: 2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex items-center mx-2 my-1 px-2 py-2 cursor-pointer rounded-md transition-all group relative",
        active ? "bg-slate-800 text-slate-100" : "hover:bg-slate-900 text-slate-400 hover:text-slate-200",
        collapsed && "justify-center px-0 mx-2"
      )}
    >
      {icon}
      {!collapsed && <span className="ml-3 text-sm truncate">{label}</span>}
      
      {/* Tooltip for collapsed mode */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-slate-700 shadow-xl">
          {label}
        </div>
      )}
    </motion.div>
  );
}
