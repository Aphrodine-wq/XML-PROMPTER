import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import {
  FileCode, ArrowRight, Clock, Plus, Activity, Database, Server, Folder, Square, Circle
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
    navigate('/builder'); // Re-routed to the new builder interface
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
    <div className="h-screen w-screen bg-white text-black overflow-y-auto selection:bg-primary/20">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b-4 border-black bg-white">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-black p-2 border-3 border-black">
              <FileCode className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-2xl tracking-tight uppercase">XML Gen</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 border-3 border-black bg-accent">
            <Circle className="w-3 h-3 fill-black" />
            <span className="font-black text-xs uppercase tracking-wider">All Systems Go</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-32 pb-20 px-8 max-w-7xl mx-auto">
        {/* Hero/Quick Start */}
        <div className="mb-16">
          <h1 className="font-black text-6xl md:text-7xl tracking-tighter mb-6 uppercase">
            Your<br />Workspace
          </h1>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleNewProject}
              className="group px-8 py-5 bg-primary border-4 border-black font-black text-lg uppercase tracking-wider flex items-center gap-3 hover:translate-x-1 hover:translate-y-1 transition-transform shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <Plus className="w-6 h-6" />
              Build Website
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-5 bg-white border-4 border-black font-black text-lg uppercase tracking-wider hover:bg-black hover:text-white transition-colors flex items-center gap-3">
              <Folder className="w-6 h-6" />
              Open Folder
            </button>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* System Health - Compact */}
          <div className="lg:col-span-4 border-4 border-black p-6 bg-white">
            <h2 className="font-black text-2xl uppercase tracking-tight mb-6 flex items-center gap-2">
              <Activity className="w-6 h-6" />
              System
            </h2>
            <div className="space-y-3">
              <SystemStatusItem
                icon={<Server className="w-5 h-5" />}
                label="Ollama"
                status={stats.ollama}
              />
              <SystemStatusItem
                icon={<Database className="w-5 h-5" />}
                label="Redis"
                status={stats.redis}
              />
              <SystemStatusItem
                icon={<Square className="w-5 h-5" />}
                label="Vector DB"
                status={stats.vectorDB}
              />
            </div>
          </div>

          {/* Recent History - Large */}
          <div className="lg:col-span-8 border-4 border-black p-6 bg-white min-h-[600px] flex flex-col">
            <h2 className="font-black text-2xl uppercase tracking-tight mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Recent
            </h2>

            <div className="flex-1 overflow-y-auto space-y-3">
              {history.length > 0 ? (
                history.slice().reverse().map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group flex items-start gap-4 p-5 border-3 border-black hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => {
                      navigate('/editor');
                    }}
                  >
                    <div className="mt-1 p-3 bg-black text-white group-hover:bg-primary group-hover:text-black transition-colors">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate uppercase tracking-tight">
                        {item.prompt}
                      </h3>
                      <div className="flex items-center gap-3 mt-2 text-sm font-medium">
                        <span>{item.model}</span>
                        <span>•</span>
                        <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity group-hover:translate-x-1 transform" />
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-64 border-4 border-dashed border-black">
                  <Folder className="w-16 h-16 mb-4" />
                  <p className="font-bold text-lg uppercase mb-4">No Projects Yet</p>
                  <button
                    onClick={handleNewProject}
                    className="px-6 py-3 bg-black text-white font-bold uppercase tracking-wider hover:bg-primary hover:text-black transition-colors"
                  >
                    Create First Project
                  </button>
                </div>
              )}
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
    <div className="flex items-center justify-between p-4 border-3 border-black bg-white hover:bg-accent transition-colors">
      <div className="flex items-center gap-3">
        <div className="font-bold">{icon}</div>
        <span className="font-bold uppercase tracking-wide text-sm">{label}</span>
      </div>
      <div className={cn(
        "flex items-center gap-2 font-black text-xs px-3 py-1 border-3 border-black uppercase tracking-wider",
        isOnline
          ? "bg-accent"
          : isChecking
            ? "bg-white animate-pulse"
            : "bg-primary"
      )}>
        <span className={cn("w-2 h-2 bg-black", isChecking && "animate-pulse")} />
        {isChecking ? "WAIT" : isOnline ? "OK" : "ERR"}
      </div>
    </div>
  );
}
