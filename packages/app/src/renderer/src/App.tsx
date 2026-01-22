import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { PromptInput } from './components/PromptInput';
import { XMLEditor } from './components/XMLEditor';
import { XMLTreeVisualizer } from './components/tree/XMLTreeVisualizer';
import { WireframePreview } from './components/preview/WireframePreview';
import { LandingPage } from './components/LandingPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CommandMenu } from './components/CommandMenu';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useState, useEffect } from 'react';
import { useAppStore } from './store';
import { Toaster } from 'sonner';
import { cn } from './utils';
import { Maximize2, Minimize2, Network, Code2, Layout } from 'lucide-react';

function Dashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [layout, setLayout] = useState<number[]>([20, 80]);
  const [activeView, setActiveView] = useState<'code' | 'tree' | 'preview'>('code');
  const { init, isZenMode, toggleZenMode } = useAppStore();

  useEffect(() => {
    init();
  }, []);

  // Keyboard shortcut for Zen Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        toggleZenMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-blue-500/30 relative">
      <CommandMenu />
      
      {/* Zen Mode Toggle (Always Visible) */}
      <button 
        onClick={toggleZenMode}
        className={cn(
          "absolute top-4 right-4 z-50 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all backdrop-blur-sm",
          isZenMode && "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30"
        )}
        title={isZenMode ? "Exit Zen Mode (Cmd+Shift+Z)" : "Enter Zen Mode (Cmd+Shift+Z)"}
      >
        {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>

      {isZenMode ? (
        <div className="flex-1 h-full w-full bg-[#1e1e1e] animate-in fade-in duration-300">
           <XMLEditor />
        </div>
      ) : (
        <PanelGroup direction="horizontal" onLayout={setLayout}>
          <Panel 
            defaultSize={layout[0]} 
            minSize={15} 
            maxSize={30} 
            collapsible={true}
            collapsedSize={4}
            onCollapse={() => setCollapsed(true)}
            onExpand={() => setCollapsed(false)}
            className="bg-slate-950"
          >
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
          </Panel>

          <PanelResizeHandle className="w-1 bg-slate-900 hover:bg-blue-600 transition-colors relative flex items-center justify-center group outline-none focus:bg-blue-600">
             <div className="h-8 w-1 bg-slate-700 rounded-full group-hover:bg-white/50 transition-colors" />
          </PanelResizeHandle>

          <Panel defaultSize={layout[1]}>
            <PanelGroup direction="vertical">
               <Panel defaultSize={35} minSize={20} className="bg-slate-900">
                  <PromptInput />
               </Panel>

               <PanelResizeHandle className="h-1 bg-slate-900 hover:bg-blue-600 transition-colors relative flex items-center justify-center group outline-none focus:bg-blue-600 cursor-row-resize z-50">
                  <div className="w-8 h-1 bg-slate-700 rounded-full group-hover:bg-white/50 transition-colors" />
               </PanelResizeHandle>

               <Panel className="bg-[#1e1e1e] relative">
                  <div className="absolute top-2 right-4 z-20 flex bg-slate-800 rounded p-1 gap-1">
                    <button 
                      onClick={() => setActiveView('code')}
                      className={cn("p-1.5 rounded transition-colors", activeView === 'code' ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white")}
                      title="Code View"
                    >
                      <Code2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setActiveView('tree')}
                      className={cn("p-1.5 rounded transition-colors", activeView === 'tree' ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white")}
                      title="Tree Structure View"
                    >
                      <Network className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setActiveView('preview')}
                      className={cn("p-1.5 rounded transition-colors", activeView === 'preview' ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white")}
                      title="Wireframe Preview"
                    >
                      <Layout className="w-4 h-4" />
                    </button>
                  </div>

                  {activeView === 'code' && <XMLEditor />}
                  {activeView === 'tree' && <XMLTreeVisualizer />}
                  {activeView === 'preview' && <WireframePreview />}
               </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      )}
    </div>
  );
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAppStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={<LandingPage />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
      <Toaster position="bottom-right" theme="dark" richColors closeButton />
    </ErrorBoundary>
  );
}

export default App;
