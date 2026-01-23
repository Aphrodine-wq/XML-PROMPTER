import React from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Zap, Shield, Globe, BarChart } from 'lucide-react';

interface FeatureItem {
    title: string;
    description: string;
    icon?: string;
}

interface FeaturesProps {
    variant?: 'grid' | 'cards' | 'bento';
    headline: string;
    subheadline: string;
    items: FeatureItem[];
}

const IconMap: Record<string, any> = {
    check: Check,
    star: Star,
    zap: Zap,
    shield: Shield,
    globe: Globe,
    chart: BarChart,
};

export const Features: React.FC<FeaturesProps> = ({
    variant = 'grid',
    headline,
    subheadline,
    items
}) => {
    return (
        <section className="py-24 bg-muted/30">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
                        {headline}
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        {subheadline}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {items.map((item, index) => {
                        const Icon = item.icon && IconMap[item.icon] ? IconMap[item.icon] : Zap;

                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-background p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow"
                            >
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 text-primary">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {item.description}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
