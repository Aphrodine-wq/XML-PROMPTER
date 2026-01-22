import React, { useState, useEffect } from 'react';
import './Previewer.css';

interface PreviewerProps {
    html: string;
    id: string;
    version: number;
}

export const Previewer: React.FC<PreviewerProps> = ({ html, id, version }) => {
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile' | 'immersive'>('desktop');
    const [showCode, setShowCode] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);

    useEffect(() => {
        setIframeKey(prev => prev + 1);
    }, [html]);

    const getIframeStyles = () => {
        switch (viewMode) {
            case 'mobile': return { width: '375px', height: '812px', border: '1px solid var(--color-emerald-deep)' };
            case 'immersive': return { width: '100%', height: '100%', border: '4px solid var(--color-emerald-deep)' };
            default: return { width: '100%', height: '100%', border: '1px solid var(--color-border)' };
        }
    };

    return (
        <div className="emerald-previewer">
            <header className="previewer-header">
                <div className="status-badge">PROJECT ID: {id} // V{version}</div>

                <div className="view-controls">
                    <button
                        className={viewMode === 'desktop' ? 'active-view' : ''}
                        onClick={() => setViewMode('desktop')}
                    >Desktop</button>
                    <button
                        className={viewMode === 'mobile' ? 'active-view' : ''}
                        onClick={() => setViewMode('mobile')}
                    >Mobile</button>
                    <button
                        className={viewMode === 'immersive' ? 'active-view' : ''}
                        onClick={() => setViewMode('immersive')}
                    >Focus-3D</button>
                </div>

                <div className="tool-actions">
                    <button className="code-toggle" onClick={() => setShowCode(!showCode)}>
                        {showCode ? 'PREVIEW' : 'SOURCE'}
                    </button>
                </div>
            </header>

            <main className="preview-viewport">
                {showCode ? (
                    <div className="code-editor">
                        <pre><code>{html}</code></pre>
                    </div>
                ) : (
                    <div className="viewport-shell" style={getIframeStyles()}>
                        <iframe
                            key={iframeKey}
                            srcDoc={html}
                            sandbox="allow-scripts allow-same-origin"
                        />
                    </div>
                )}
            </main>
        </div>
    );
};
