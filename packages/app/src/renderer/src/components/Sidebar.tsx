import { 
  Folder, History, Settings, FileCode, Plus, ChevronLeft, ChevronRight, LogOut, User,
  Layout, Type, Image, Code, Files, Search, Wand2
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
import { SkillsManager } from './skills/SkillsManager';
import { SettingsDialog } from './SettingsDialog';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { templates, history, loadTemplate, loadHistory, logout, user, setXmlOutput, xmlOutput, snippets, addSnippet } = useAppStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'files' | 'snippets' | 'project' | 'search' | 'skills'>('project');
  const [snippetDialogOpen, setSnippetDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
        animate={{ width: collapsed ? 60 : '100%' }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="bg-white text-black flex flex-col h-full"
      >
        {/* Header */}
        <div className={cn(
          "h-16 border-b-3 border-black flex items-center px-4",
          collapsed ? "justify-center px-0" : "justify-between"
        )}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 font-black uppercase text-sm tracking-tight"
            >
              <div className="bg-black p-1.5">
                <FileCode className="w-4 h-4 text-white" />
              </div>
              <span>XML Gen</span>
            </motion.div>
          )}
          <button
            onClick={onToggle}
            className="p-2 hover:bg-black hover:text-white transition-colors border-2 border-black"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Tab Switcher - Brutalist */}
        {!collapsed && (
          <div className="flex p-2 gap-1 border-b-3 border-black">
             <button
              onClick={() => setActiveTab('project')}
              className={cn(
                "flex-1 py-2 text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1 border-2 border-black",
                activeTab === 'project' ? "bg-black text-white" : "bg-white hover:bg-accent"
              )}
              title="Project Explorer"
            >
              <Files className="w-3 h-3" />
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={cn(
                "flex-1 py-2 text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1 border-2 border-black",
                activeTab === 'search' ? "bg-black text-white" : "bg-white hover:bg-accent"
              )}
              title="Global Search"
            >
              <Search className="w-3 h-3" />
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={cn(
                "flex-1 py-2 text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1 border-2 border-black",
                activeTab === 'files' ? "bg-black text-white" : "bg-white hover:bg-accent"
              )}
              title="Templates & History"
            >
              <Folder className="w-3 h-3" />
            </button>
            <button
               onClick={() => setActiveTab('snippets')}
               className={cn(
                 "flex-1 py-2 text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1 border-2 border-black",
                 activeTab === 'snippets' ? "bg-black text-white" : "bg-white hover:bg-accent"
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
                  "w-full bg-primary border-3 border-black font-black uppercase text-xs tracking-wider flex items-center justify-center transition-all hover:bg-black hover:text-white",
                  collapsed ? "h-10 w-10 p-0" : "h-10 px-4 gap-2"
                )}>
                  <Plus className="w-4 h-4" />
                  {!collapsed && <span>New</span>}
                </button>
              </div>

              {!collapsed && <div className="px-4 py-2 text-xs font-black uppercase tracking-wider shrink-0 border-b-2 border-black">Templates</div>}
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
              
              {!collapsed && <div className="px-4 mt-4 py-2 text-xs font-black uppercase tracking-wider shrink-0 border-b-2 border-black">Recent</div>}
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
                  <div className="px-4 py-2 text-sm font-bold">No history yet</div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto px-2 space-y-1">
               <div className="px-2 mb-2">
                <button
                  onClick={handleCreateSnippet}
                  className={cn(
                    "w-full bg-white border-3 border-black font-black uppercase text-xs tracking-wider flex items-center justify-center transition-all hover:bg-black hover:text-white",
                    collapsed ? "h-10 w-10 p-0" : "h-10 px-4 gap-2"
                  )}
                >
                  <Plus className="w-4 h-4" />
                  {!collapsed && <span>Add</span>}
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
                 <div className="px-4 py-2 text-sm font-bold text-center">No snippets</div>
               )}
            </div>
          )}

          <div className="shrink-0 border-t-3 border-black mt-2">
            {!collapsed && <div className="px-4 mt-2 py-2 text-xs font-black uppercase tracking-wider">App</div>}
            <NavItem icon={<Settings className="w-4 h-4" />} label="Settings" collapsed={collapsed} onClick={() => setSettingsOpen(true)} />
          </div>
        </div>

        {/* User Footer */}
        <div className="p-2 border-t-3 border-black shrink-0">
          <div className={cn(
            "flex items-center gap-3 p-2 hover:bg-accent transition-colors cursor-pointer group",
            collapsed && "justify-center px-0"
          )}>
             <div className="w-8 h-8 bg-black flex items-center justify-center overflow-hidden border-3 border-black">
               {user?.avatar ? <img src={user.avatar} alt="User" /> : <User className="w-4 h-4 text-white" />}
             </div>
             {!collapsed && (
               <div className="flex-1 min-w-0">
                 <div className="text-sm font-bold truncate uppercase">{user?.name}</div>
                 <div className="text-xs font-medium">Pro</div>
               </div>
             )}
             {!collapsed && (
               <button onClick={handleLogout} className="p-1.5 hover:bg-black hover:text-white border-2 border-black transition-colors">
                 <LogOut className="w-4 h-4" />
               </button>
             )}
          </div>
        </div>
      </motion.div>

      {/* Snippet Variable Dialog - Brutalist style */}
      <Dialog.Root open={snippetDialogOpen} onOpenChange={setSnippetDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 z-50 animate-in fade-in duration-200" />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-md bg-white border-4 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] z-50 p-6 animate-in zoom-in-95 duration-200">
            <Dialog.Title className="text-2xl font-black uppercase tracking-tight mb-6">Snippet Variables</Dialog.Title>
            <div className="space-y-4">
              {currentSnippet?.variables.map(variable => (
                <div key={variable} className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider">{variable}</label>
                  <input
                    className="w-full bg-white border-3 border-black px-4 py-3 text-sm font-medium outline-none focus:bg-accent"
                    value={variableValues[variable] || ''}
                    onChange={(e) => setVariableValues(prev => ({ ...prev, [variable]: e.target.value }))}
                    placeholder={`Enter ${variable}...`}
                    autoFocus={variable === currentSnippet.variables[0]}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setSnippetDialogOpen(false)}
                className="px-6 py-3 text-sm font-black uppercase tracking-wider border-3 border-black hover:bg-black hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVariableSubmit}
                className="px-6 py-3 bg-primary border-3 border-black text-sm font-black uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
              >
                Insert
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Settings Dialog */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}

function NavItem({ icon, label, collapsed, active, onClick }: { icon: React.ReactNode, label: string, collapsed: boolean, active?: boolean, onClick?: () => void }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex items-center mx-2 my-1 px-3 py-2 cursor-pointer transition-all group relative border-2 border-transparent font-medium",
        active ? "bg-black text-white border-black" : "hover:bg-accent hover:border-black",
        collapsed && "justify-center px-0 mx-2"
      )}
    >
      {icon}
      {!collapsed && <span className="ml-3 text-sm truncate uppercase tracking-wide">{label}</span>}

      {/* Tooltip for collapsed mode */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-3 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border-3 border-black">
          {label}
        </div>
      )}
    </motion.div>
  );
}
