import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { 
  FileCode, Github, ArrowRight, CheckCircle, Shield, Zap, 
  Clock, Plus, Settings, Activity, Database, Server, Folder
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '../utils';

export function Dashboard() {
  const navigate = useNavigate();
  const { login, history, projectFiles, resetProject, openFile } = useAppStore();
  const [stats, setStats] = useState({
    ollama: 'checking',
    redis: 'checking',
    vectorDB: 'checking'
  });

  const handleNewProject = () => {
    resetProject();
    navigate('/editor');
  };

  const handleOpenProject = (path: string) => {
    openFile(path);
    navigate('/editor');
  };

  // Mock system check (replace with real IPC calls in production)
  useEffect(() => {
    const checkSystem = async () => {
      // Simulate checks
      await new Promise(r => setTimeout(r, 800));
      setStats({
        ollama: 'online',
        redis: 'online',
        vectorDB: 'online'
      });
    };
    checkSystem();
  }, []);

  return (
    <div className="h-screen w-screen bg-slate-950 text-white overflow-y-auto selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-slate-950/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
              <FileCode className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">XML Gen Studio</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 rounded-full border border-slate-800/50 text-xs font-mono text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                System Operational
             </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Quick Actions & Stats */}
          <div className="space-y-6">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-2xl p-6">
               <h2 className="text-lg font-semibold mb-4 text-slate-200">Quick Actions</h2>
               <div className="space-y-3">
                 <button 
                   onClick={handleNewProject}
                   className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover:-translate-y-0.5 group"
                 >
                   <div className="bg-white/20 p-2 rounded-lg group-hover:bg-white/30 transition-colors">
                     <Plus className="w-5 h-5" />
                   </div>
                   <div className="text-left">
                     <div className="font-semibold">New Project</div>
                     <div className="text-xs text-blue-100 opacity-80">Start from scratch</div>
                   </div>
                 </button>

                 <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 transition-all border border-slate-700/50 hover:border-slate-600 group">
                   <div className="bg-slate-700/50 p-2 rounded-lg group-hover:bg-slate-700 transition-colors">
                     <Folder className="w-5 h-5" />
                   </div>
                   <div className="text-left">
                     <div className="font-semibold">Open Folder</div>
                     <div className="text-xs text-slate-500">Browse local system</div>
                   </div>
                 </button>
               </div>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-2xl p-6">
               <h2 className="text-lg font-semibold mb-4 text-slate-200 flex items-center gap-2">
                 <Activity className="w-5 h-5 text-slate-400" />
                 System Health
               </h2>
               <div className="space-y-4">
                 <SystemStatusItem 
                   icon={<Server className="w-4 h-4" />} 
                   label="Ollama Engine" 
                   status={stats.ollama} 
                 />
                 <SystemStatusItem 
                   icon={<Database className="w-4 h-4" />} 
                   label="Redis Cache" 
                   status={stats.redis} 
                 />
                 <SystemStatusItem 
                   icon={<Zap className="w-4 h-4" />} 
                   label="Vector DB" 
                   status={stats.vectorDB} 
                 />
               </div>
            </div>
          </div>

          {/* Right Column: Recent Projects & History */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-2xl p-6 h-full min-h-[500px] flex flex-col">
              <h2 className="text-lg font-semibold mb-6 text-slate-200 flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" />
                Recent History
              </h2>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {history.length > 0 ? (
                  history.slice().reverse().map((item) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="group flex items-start gap-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800/50 hover:border-slate-700/80 hover:bg-slate-900/80 transition-all cursor-pointer"
                      onClick={() => {
                          // In a real app, load this history item
                          navigate('/editor');
                      }}
                    >
                      <div className="mt-1 p-2 rounded-lg bg-blue-900/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <FileCode className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                          {item.prompt}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                           <span className="flex items-center gap-1">
                             <Zap className="w-3 h-3" />
                             {item.model}
                           </span>
                           <span>•</span>
                           <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-500 border-2 border-dashed border-slate-800/50 rounded-xl">
                    <Folder className="w-12 h-12 mb-3 opacity-20" />
                    <p>No recent projects found</p>
                    <button onClick={handleNewProject} className="text-blue-400 hover:text-blue-300 text-sm mt-2 font-medium">Start a new project</button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function SystemStatusItem({ icon, label, status }: { icon: any, label: string, status: string }) {
  const isOnline = status === 'online';
  const isChecking = status === 'checking';
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800/50">
      <div className="flex items-center gap-3">
        <div className="text-slate-400">{icon}</div>
        <span className="text-sm font-medium text-slate-300">{label}</span>
      </div>
      <div className={cn(
        "flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded-full border",
        isOnline 
          ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/30" 
          : isChecking 
            ? "bg-amber-950/30 text-amber-400 border-amber-900/30"
            : "bg-red-950/30 text-red-400 border-red-900/30"
      )}>
        <span className={cn("w-1.5 h-1.5 rounded-full", isOnline ? "bg-emerald-500" : isChecking ? "bg-amber-500 animate-pulse" : "bg-red-500")} />
        {isChecking ? "CHECKING" : isOnline ? "ONLINE" : "OFFLINE"}
      </div>
    </div>
  );
}
