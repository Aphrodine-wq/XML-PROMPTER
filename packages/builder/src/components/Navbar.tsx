import React from 'react';
import { motion } from 'framer-motion';

interface Link {
    label: string;
    url: string;
}

interface NavbarProps {
    brand_name: string;
    links: Link[];
    cta_label?: string;
    variant?: 'sticky' | 'floating';
}

export const Navbar: React.FC<NavbarProps> = ({
    brand_name,
    links,
    cta_label = "Get Started",
    variant = 'sticky'
}) => {
    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`w-full z-50 bg-background/80 backdrop-blur-md border-b ${variant === 'sticky' ? 'sticky top-0' : 'fixed top-4 left-4 right-4 rounded-full border shadow-lg max-w-5xl mx-auto'
                }`}
        >
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <a href="/" className="font-bold text-xl tracking-tight">
                    {brand_name}
                </a>

                <nav className="hidden md:flex gap-8">
                    {links.map((link, i) => (
                        <a
                            key={i}
                            href={link.url}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>

                <button className="hidden md:inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                    {cta_label}
                </button>
            </div>
        </motion.header>
    );
};
