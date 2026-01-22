import React from 'react';
import './Hero.css';

export const Hero: React.FC<{ title: string; subtitle?: string; }> = ({ title, subtitle }) => (
    <header className="hero-section">
        <div className="hero-content">
            <h1 className="hero-heading">{title}</h1>
            {subtitle && <p className="hero-subheading">{subtitle}</p>}
            <div className="hero-actions">
                <button className="primary-btn">Initialize Project</button>
                <button className="secondary-btn">View Guidelines</button>
            </div>
        </div>
    </header>
);
