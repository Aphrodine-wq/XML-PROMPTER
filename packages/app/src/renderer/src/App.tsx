import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { PromptInput } from './components/PromptInput';
import { XMLEditor } from './components/XMLEditor';
import { XMLTreeVisualizer } from './components/tree/XMLTreeVisualizer';
import { WireframePreview } from './components/preview/WireframePreview';
import { CodePreview } from './components/preview/CodePreview';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BuilderPage } from './components/BuilderPage';
import { CommandPalette } from './components/CommandPalette'; // Updated from CommandMenu
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useState, useEffect } from 'react';
import { useAppStore } from './store';
import { Toaster } from 'sonner';
import { cn } from './utils';
import { Maximize2, Minimize2, Network, Code2, Layout, AppWindow } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion'; // Added for view transitions

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [layout, setLayout] = useState<number[]>([20, 80]);
  const [activeView, setActiveView] = useState<'code' | 'tree' | 'preview' | 'app'>('code');
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
    <div className="flex h-screen w-screen bg-white text-black overflow-hidden font-sans selection:bg-primary/20 relative">
      <CommandPalette />

      {/* Zen Mode Toggle - Brutalist style */}
      <button
        onClick={toggleZenMode}
        className={cn(
          "absolute top-4 right-4 z-50 p-3 border-3 border-black font-black uppercase text-xs tracking-wider transition-all",
          isZenMode ? "bg-primary" : "bg-white hover:bg-accent"
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
            className="bg-white border-r-4 border-black"
          >
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
          </Panel>

          <PanelResizeHandle className="w-2 bg-black hover:bg-primary transition-colors relative flex items-center justify-center group outline-none focus:bg-primary cursor-col-resize">
            <div className="h-12 w-1 bg-white group-hover:bg-black transition-colors" />
          </PanelResizeHandle>

          <Panel defaultSize={layout[1]}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={35} minSize={20} className="bg-white border-b-4 border-black">
                <PromptInput />
              </Panel>

              <PanelResizeHandle className="h-2 bg-black hover:bg-primary transition-colors relative flex items-center justify-center group outline-none focus:bg-primary cursor-row-resize z-50">
                <div className="w-12 h-1 bg-white group-hover:bg-black transition-colors" />
              </PanelResizeHandle>

              <Panel className="bg-[#1e1e1e] relative">
                {/* View switcher - Brutalist style */}
                <div className="absolute top-4 right-4 z-20 flex border-3 border-white bg-black p-1 gap-1">
                  <button
                    onClick={() => setActiveView('code')}
                    className={cn("p-2 transition-all font-bold", activeView === 'code' ? "bg-primary text-black" : "text-white hover:bg-white hover:text-black")}
                    title="XML Code"
                  >
                    <Code2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveView('tree')}
                    className={cn("p-2 transition-all font-bold", activeView === 'tree' ? "bg-primary text-black" : "text-white hover:bg-white hover:text-black")}
                    title="Structure Tree"
                  >
                    <Network className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveView('preview')}
                    className={cn("p-2 transition-all font-bold", activeView === 'preview' ? "bg-primary text-black" : "text-white hover:bg-white hover:text-black")}
                    title="Wireframe"
                  >
                    <Layout className="w-4 h-4" />
                  </button>
                  <div className="w-0.5 bg-white/30" />
                  <button
                    onClick={() => setActiveView('app')}
                    className={cn("p-2 transition-all font-bold", activeView === 'app' ? "bg-accent text-black" : "text-white hover:bg-white hover:text-black")}
                    title="Generated Web App"
                  >
                    <AppWindow className="w-4 h-4" />
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeView}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="h-full w-full"
                  >
                    {activeView === 'code' && <XMLEditor />}
                    {activeView === 'tree' && <XMLTreeVisualizer />}
                    {activeView === 'preview' && <WireframePreview />}
                    {activeView === 'app' && <CodePreview />}
                  </motion.div>
                </AnimatePresence>
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
          <Route
            path="/editor"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/builder"
            element={
              <ProtectedRoute>
                <BuilderPage />
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
