import React from 'react';

interface FooterProps {
    brand_name: string;
    copyright_text: string;
}

export const Footer: React.FC<FooterProps> = ({ brand_name, copyright_text }) => {
    return (
        <footer className="py-12 border-t bg-muted/20">
            <div className="container mx-auto px-4 text-center">
                <h3 className="font-bold text-lg mb-4">{brand_name}</h3>
                <p className="text-muted-foreground text-sm">
                    {copyright_text}
                </p>
            </div>
        </footer>
    );
};
