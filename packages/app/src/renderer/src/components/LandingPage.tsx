import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { FileCode, Github, ArrowRight, Square } from 'lucide-react';
import { motion } from 'framer-motion';

export function LandingPage() {
  const navigate = useNavigate();
  const { login } = useAppStore();

  const handleLogin = () => {
    login();
    navigate('/');
  };

  return (
    <div className="h-screen w-screen bg-white text-black overflow-y-auto selection:bg-primary/20">
      {/* Navbar - Brutalist approach */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b-4 border-black bg-white">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-black p-2 border-3 border-black">
              <FileCode className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-2xl tracking-tight uppercase">XML GEN</span>
          </div>
          <div className="flex items-center gap-6">
             <button className="text-sm font-bold uppercase tracking-wider hover:text-primary transition-colors">Docs</button>
             <button className="text-sm font-bold uppercase tracking-wider hover:text-primary transition-colors">GitHub</button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Bold, asymmetric layout */}
      <div className="pt-32 pb-16 px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-12 gap-8"
        >
          {/* Left: Large text */}
          <div className="col-span-12 lg:col-span-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 border-3 border-black mb-8 bg-accent">
              <Square className="w-3 h-3 fill-black" />
              <span className="font-black text-xs uppercase tracking-wider">v1.0 Live</span>
            </div>

            <h1 className="font-black text-6xl md:text-8xl tracking-tighter leading-none mb-8">
              BUILD XML<br/>
              WEBSITES<br/>
              <span className="inline-block border-b-6 border-primary pb-2">INSTANTLY</span>
            </h1>

            <p className="text-xl md:text-2xl font-medium max-w-2xl mb-12 leading-tight text-gray-700">
              No more boilerplate. Describe your vision, get production-ready XML.
              <span className="font-black"> 100% local. 100% private.</span>
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <button
                onClick={handleLogin}
                className="group px-8 py-5 bg-primary border-4 border-black font-black text-lg uppercase tracking-wider flex items-center gap-3 hover:translate-x-1 hover:translate-y-1 transition-transform shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <Github className="w-6 h-6" />
                Sign In
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-5 bg-white border-4 border-black font-black text-lg uppercase tracking-wider hover:bg-black hover:text-white transition-colors">
                Download App
              </button>
            </div>
          </div>

          {/* Right: Visual element - brutalist blocks */}
          <div className="col-span-12 lg:col-span-4 flex items-center justify-center lg:justify-end">
            <div className="relative w-64 h-64">
              <div className="absolute top-0 left-0 w-32 h-32 bg-primary border-4 border-black"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-black"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-accent border-4 border-black"></div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Features - Bold grid */}
      <div className="py-20 bg-black text-white border-t-4 border-black">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="font-black text-4xl uppercase tracking-tight mb-12">Why This Tool Exists</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              number="01"
              title="Privacy First"
              desc="Runs 100% offline using Ollama. Your prompts never leave your machine."
            />
            <FeatureCard
              number="02"
              title="Lightning Fast"
              desc="Optimized for local inference with streaming responses and Monaco editor."
            />
            <FeatureCard
              number="03"
              title="Structured Output"
              desc="Guaranteed valid XML format perfect for automated website generation pipelines."
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-primary border-t-4 border-black">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <h2 className="font-black text-5xl md:text-7xl tracking-tighter mb-8 uppercase">
            Ready to Build?
          </h2>
          <button
            onClick={handleLogin}
            className="px-12 py-6 bg-black text-white border-4 border-black font-black text-xl uppercase tracking-wider hover:bg-white hover:text-black transition-colors shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1"
          >
            Start Now →
          </button>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div className="p-8 border-4 border-white hover:bg-white hover:text-black transition-colors group">
      <div className="font-black text-6xl mb-4 opacity-30 group-hover:opacity-100 transition-opacity group-hover:text-primary">
        {number}
      </div>
      <h3 className="text-2xl font-black mb-3 uppercase tracking-tight">{title}</h3>
      <p className="text-gray-300 group-hover:text-gray-700 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}
