import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface HeroProps {
    variant?: 'split' | 'center' | 'glow';
    headline: string;
    subheadline: string;
    cta_primary: string;
    cta_secondary?: string;
    image_url?: string;
}

export const Hero: React.FC<HeroProps> = ({
    variant = 'center',
    headline,
    subheadline,
    cta_primary,
    cta_secondary,
    image_url
}) => {
    if (variant === 'split') {
        return (
            <section className="relative w-full py-20 lg:py-32 overflow-hidden bg-background">
                <div className="container px-4 md:px-6 mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col gap-6"
                        >
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
                                {headline}
                            </h1>
                            <p className="text-lg md:text-xl text-muted-foreground max-w-[600px]">
                                {subheadline}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 mt-4">
                                <button className="inline-flex items-center justify-center h-12 px-8 rounded-md bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                    {cta_primary}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </button>
                                {cta_secondary && (
                                    <button className="inline-flex items-center justify-center h-12 px-8 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-foreground font-medium transition-colors">
                                        {cta_secondary}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="relative aspect-video rounded-xl overflow-hidden shadow-2xl bg-muted"
                        >
                            <img
                                src={image_url || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80"}
                                alt="Hero"
                                className="object-cover w-full h-full"
                            />
                        </motion.div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="relative w-full py-24 lg:py-40 flex flex-col items-center text-center overflow-hidden bg-background">
            <div className="container px-4 md:px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-4xl mx-auto flex flex-col items-center gap-6"
                >
                    <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm text-muted-foreground backdrop-blur-sm">
                        <span className="flex h-2 w-2 rounded-full bg-primary mr-2" />
                        New Features Available
                    </div>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground text-balance">
                        {headline}
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-[800px] text-balance">
                        {subheadline}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 mt-8">
                        <button className="inline-flex items-center justify-center h-14 px-10 rounded-full bg-primary text-primary-foreground text-lg font-semibold transition-transform hover:scale-105 shadow-lg hover:shadow-xl">
                            {cta_primary}
                        </button>
                        {cta_secondary && (
                            <button className="inline-flex items-center justify-center h-14 px-10 rounded-full border border-input bg-background/50 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground text-foreground text-lg font-medium transition-colors">
                                {cta_secondary}
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Background decorations for glow variant */}
            {variant === 'glow' && (
                <>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 blur-[120px] rounded-full sm:w-[800px] pointer-events-none opacity-50" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-soft-light" />
                </>
            )}
        </section>
    );
};
