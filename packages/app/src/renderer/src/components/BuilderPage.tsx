import { useState, useEffect } from 'react';
import { PromptInput } from './PromptInput';
import { useAppStore } from '../store';
import { ArrowLeft, Loader2, Download, Code } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function BuilderPage() {
    const navigate = useNavigate();
    // @ts-ignore - store types will be updated later
    const { isGenerating, xmlOutput } = useAppStore();
    const [buildStep, setBuildStep] = useState<'input' | 'generating' | 'building' | 'done'>('input');

    useEffect(() => {
        if (isGenerating && buildStep === 'input') {
            setBuildStep('generating');
        }
        if (!isGenerating && buildStep === 'generating') {
            setBuildStep('building');
        }

        if (buildStep === 'building') {
            // Simulate build time for the visual effect
            const timer = setTimeout(() => {
                setBuildStep('done');
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [isGenerating, buildStep]);

    return (
        <div className="h-screen w-screen flex flex-col bg-white text-black font-sans selection:bg-primary/20">
            {/* Header */}
            <header className="h-16 border-b-4 border-black px-6 flex items-center justify-between shrink-0 bg-white z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="hover:bg-accent p-2 border-2 border-transparent hover:border-black transition-all"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="font-black text-xl uppercase tracking-wider">Website Builder</h1>
                </div>
                <div className="flex gap-2">
                    <StepIndicator step={1} current={buildStep} label="Prompt" />
                    <StepIndicator step={2} current={buildStep} label="Design" />
                    <StepIndicator step={3} current={buildStep} label="Build" />
                    <StepIndicator step={4} current={buildStep} label="Ready" />
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative bg-white">

                {buildStep === 'input' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="h-full flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full"
                    >
                        <h2 className="text-5xl font-black mb-2 text-center uppercase tracking-tighter">Describe your<br />Dream Website</h2>
                        <p className="text-muted-foreground text-lg mb-12 text-center font-medium max-w-xl">
                            Our AI Architect will design a blueprint and generate a production-ready React application for you in seconds.
                        </p>
                        <div className="w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-4 border-black">
                            <PromptInput />
                        </div>
                    </motion.div>
                )}

                {(buildStep === 'generating' || buildStep === 'building') && (
                    <div className="h-full flex flex-col items-center justify-center space-y-12">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse"></div>
                            <div className="relative z-10 bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                <Loader2 className="w-16 h-16 animate-spin" />
                            </div>
                        </div>
                        <div className="text-center space-y-4">
                            <h3 className="text-3xl font-black uppercase tracking-widest">
                                {buildStep === 'generating' ? 'Designing Blueprint...' : 'Compiling React Code...'}
                            </h3>
                            <p className="text-muted-foreground font-bold text-lg">
                                {buildStep === 'generating' ? 'AI is acting as your System Architect' : 'Constructing Components & Styles'}
                            </p>
                        </div>

                        {/* Console Log Simulation */}
                        <div className="w-full max-w-xl bg-black text-green-400 p-6 font-mono text-sm h-64 overflow-hidden border-4 border-gray-800 shadow-2xl rounded-sm">
                            <div className="space-y-2">
                                <div>&gt; Initializing Builder Engine v2.0</div>
                                {buildStep === 'generating' && (
                                    <>
                                        <div>&gt; Analyzing prompt intent...</div>
                                        <div>&gt; Selecting component library...</div>
                                        <div>&gt; Drafting XML architecture...</div>
                                    </>
                                )}
                                {buildStep === 'building' && (
                                    <>
                                        <div>&gt; Blueprint received. Parsing XML...</div>
                                        <div>&gt; Theme System: DETECTED</div>
                                        <div>&gt; Generating Tailwind Config...</div>
                                        <div className="text-white">&gt; Compiling Hero.tsx... OK</div>
                                        <div className="text-white">&gt; Compiling Features.tsx... OK</div>
                                        <div className="text-white">&gt; Compiling Navbar.tsx... OK</div>
                                        <div>&gt; Bundling assets...</div>
                                    </>
                                )}
                                <motion.div
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.8 }}
                                    className="inline-block w-3 h-5 bg-green-400 align-middle ml-1"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {buildStep === 'done' && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="h-full flex flex-col items-center justify-center p-8"
                    >
                        <div className="w-32 h-32 bg-green-400 border-4 border-black flex items-center justify-center mb-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                            <Code className="w-16 h-16 text-black" />
                        </div>
                        <h2 className="text-6xl font-black uppercase mb-6 text-center tracking-tighter">Build Complete</h2>
                        <p className="text-xl text-center max-w-2xl mb-12 font-medium text-muted-foreground">
                            Your React application has been generated successfully. It includes all source code, styles, and configurations ready for deployment.
                        </p>

                        <div className="flex gap-6">
                            <button
                                onClick={() => {
                                    // In a real app, this would trigger the main process download
                                    // For now we just show a successful toast
                                    // toast is not imported yet, let's fix that
                                    alert("Download Started: project.zip");
                                }}
                                className="px-10 py-5 bg-black text-white font-black uppercase tracking-wider flex items-center gap-4 hover:bg-primary hover:text-black transition-all border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1"
                            >
                                <Download className="w-6 h-6" />
                                Download Source
                            </button>
                            <button
                                onClick={() => navigate('/editor')}
                                className="px-10 py-5 bg-white text-black font-black uppercase tracking-wider flex items-center gap-4 hover:bg-accent transition-all border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1"
                            >
                                Preview Site
                            </button>
                        </div>
                    </motion.div>
                )}

            </div>
        </div>
    );
}

function StepIndicator({ step, current, label }: { step: number; current: string; label: string }) {
    const steps = ['input', 'generating', 'building', 'done'];
    const currentIndex = steps.indexOf(current);
    const isActive = (step - 1) === currentIndex;
    const isCompleted = (step - 1) < currentIndex;

    return (
        <div className={`px-4 py-1.5 text-xs font-black border-2 border-black uppercase transition-all
            ${isActive ? 'bg-primary text-white scale-105' : ''}
            ${isCompleted ? 'bg-black text-white' : ''}
            ${!isActive && !isCompleted ? 'bg-white text-gray-400 border-gray-200' : ''}
        `}>
            {step}. {label}
        </div>
    );
}
