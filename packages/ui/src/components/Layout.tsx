import React from 'react';
import './Layout.css';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="emerald-snow-layout">
        <nav className="nav-bar">
            <div className="nav-container">
                <div className="brand">XML-PROMPTER</div>
                <div className="nav-links">
                    <a href="#solutions">Solutions</a>
                    <a href="#about">Philosophy</a>
                    <button className="nav-cta">Get Started</button>
                </div>
            </div>
        </nav>
        <main className="content-main">
            {children}
        </main>
        <footer className="footer-bar">
            <div className="nav-container">
                <div className="footer-grid">
                    <div className="footer-col">
                        <h4 className="footer-title">Platform</h4>
                        <a href="#">Engine</a>
                        <a href="#">Security</a>
                    </div>
                    <div className="footer-col">
                        <h4 className="footer-title">Company</h4>
                        <a href="#">About</a>
                        <a href="#">Contact</a>
                    </div>
                </div>
                <div className="footer-bottom">
                    &copy; 2026 Emerald & Snow Generation. All Rights Reserved.
                </div>
            </div>
        </footer>
    </div>
);
