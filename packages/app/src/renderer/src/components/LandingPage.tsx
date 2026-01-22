import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { FileCode, Github, ArrowRight, CheckCircle, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export function LandingPage() {
  const navigate = useNavigate();
  const { login } = useAppStore();

  const handleLogin = () => {
    login();
    navigate('/');
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-white overflow-y-auto selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
              <FileCode className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">XML Gen</span>
          </div>
          <div className="flex items-center gap-4">
             <button className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Documentation</button>
             <button className="text-sm font-medium text-slate-400 hover:text-white transition-colors">GitHub</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-6 max-w-6xl mx-auto text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/20 border border-blue-800 text-blue-400 text-xs font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            v1.0 Now Available
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Generate XML Websites <br/>
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">with Local AI</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop writing boilerplate. Describe your website in plain English and let your local LLM generate production-ready XML prompts instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={handleLogin}
              className="px-8 py-4 bg-white text-slate-950 rounded-lg font-bold text-lg flex items-center gap-3 hover:bg-slate-200 transition-all shadow-xl shadow-white/5 hover:scale-105"
            >
              <Github className="w-5 h-5" />
              Sign in with GitHub
            </button>
            <button className="px-8 py-4 bg-slate-800 text-white rounded-lg font-bold text-lg flex items-center gap-2 hover:bg-slate-700 transition-all border border-slate-700">
              Download Desktop App
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="py-20 bg-slate-900/50 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Shield className="w-6 h-6 text-emerald-400" />}
            title="Privacy First"
            desc="Runs 100% offline using Ollama. Your prompts never leave your machine."
          />
          <FeatureCard 
            icon={<Zap className="w-6 h-6 text-amber-400" />}
            title="Lightning Fast"
            desc="Optimized for local inference with streaming responses and Monaco editor."
          />
          <FeatureCard 
            icon={<CheckCircle className="w-6 h-6 text-blue-400" />}
            title="Structured Output"
            desc="Guaranteed valid XML format perfect for automated website generation pipelines."
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors">
      <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2 text-slate-100">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
