import { WebsiteBlueprint } from '../schema';
import { generateAppTsx } from './ComponentMapper';
import { generateTailwindConfig, generateGlobalCss } from './StyleGenerator';
import * as fs from 'fs';
import * as path from 'path';

export interface GeneratedFile {
    path: string;
    content: string;
}

export class ProjectGenerator {
    generate(blueprint: WebsiteBlueprint, outputDir: string): void {
        const files: GeneratedFile[] = [];

        // 1. Generate App.tsx
        files.push({
            path: 'src/App.tsx',
            content: generateAppTsx(blueprint)
        });

        // 2. Generate Styles
        files.push({
            path: 'tailwind.config.js',
            content: generateTailwindConfig(blueprint)
        });

        files.push({
            path: 'src/index.css',
            content: generateGlobalCss(blueprint)
        });

        // 3. Main entry point
        files.push({
            path: 'src/main.tsx',
            content: `
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`
        });

        // 4. Index HTML
        files.push({
            path: 'index.html',
            content: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Generated Site</title>
    <!-- Font Imports from Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=${blueprint.meta.style_system.typography.heading_font.replace(' ', '+')}:wght@400;700&family=${blueprint.meta.style_system.typography.body_font.replace(' ', '+')}:wght@400;500&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`
        });

        // 5. Write files
        files.forEach(file => {
            const fullPath = path.join(outputDir, file.path);
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(fullPath, file.content);
        });

        // Copy component files (In a real scenario, these might be copy-pasted or symlinked)
        // For now we assume the source components are available or we re-generate them.
        // To simplify this POC, we will assume standard Vite + simple copy isn't enough without node_modules.
        // A better approach for the POC is to output to a specific folder that is ALREADY a vite app, 
        // OR we just write the source files and assume the user will run 'npm install'
    }
}
