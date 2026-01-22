/**
 * SEO Utility - Enhances generated HTML with meta tags and structure.
 */

export interface SEOConfig {
    title: string;
    description: string;
    keywords?: string[];
    author?: string;
}

export function applySeo(html: string, config: SEOConfig): string {
    let headContent = `
    <title>${config.title}</title>
    <meta name="description" content="${config.description}">
    ${config.keywords ? `<meta name="keywords" content="${config.keywords.join(', ')}">` : ''}
    ${config.author ? `<meta name="author" content="${config.author}">` : ''}
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta charset="UTF-8">
    `;

    // Try to insert into <head>
    if (html.includes('<head>')) {
        return html.replace('<head>', `<head>${headContent}`);
    } else if (html.includes('<html>')) {
        return html.replace('<html>', `<html><head>${headContent}</head>`);
    } else {
        // Just prepand if it's a fragment
        return `<!DOCTYPE html><html><head>${headContent}</head><body>${html}</body></html>`;
    }
}

export function ensureHeadingHierarchy(html: string): string {
    // Basic check to ensure at most one H1, upgrade H2s if none, etc.
    // In a complex system, this would be a full DOM parser.
    const h1Count = (html.match(/<h1/gi) || []).length;

    if (h1Count === 0) {
        // Try to promote the first H2 if exists
        return html.replace(/<h2/i, '<h1').replace(/<\/h2>/i, '</h1>');
    }

    return html;
}
