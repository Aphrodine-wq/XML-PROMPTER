import { aiManager } from './ai-manager.js';
import { VirtualFileSystem } from './vfs.js';

export class CodeGenerator {
  
  // Legacy Single File Mode
  async generateWebApp(xmlBlueprint: string, model: string, onChunk?: (chunk: string) => void): Promise<string> {
    const prompt = `You are an expert Frontend Engineer. 
    Convert the following XML Blueprint into a **Single-File Self-Contained HTML Web App**.
    
    Requirements:
    1. Use **React** (via CDN).
    2. Use **Tailwind CSS** (via CDN).
    3. Use **Babel** (via CDN) to compile JSX in the browser.
    4. The output must be a valid, runnable .html file.
    5. Implement the logic and interactivity implied by the XML structure.
    6. Make it look modern and professional.
    7. NO markdown code blocks (backticks). Output RAW HTML only.

    XML Blueprint:
    ${xmlBlueprint}
    
    Structure your response as:
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    </head>
    <body>
        <div id="root"></div>
        <script type="text/babel">
            // Your React Code Here
        </script>
    </body>
    </html>`;

    let output = '';
    await aiManager.generate({
      model,
      prompt,
      stream: true
    }, (chunk) => {
      output += chunk;
      if (onChunk) onChunk(chunk);
    });

    return output;
  }

  // New Multi-File Mode
  async generateProject(xmlBlueprint: string, model: string, onChunk?: (chunk: string) => void): Promise<VirtualFileSystem> {
     const prompt = `You are a Senior Software Architect.
     Convert this XML Blueprint into a **Production-Ready React Project Structure**.

     XML Blueprint:
     ${xmlBlueprint}

     Output Format:
     Return a JSON object where keys are file paths and values are file contents.
     Example:
     {
       "src/App.jsx": "...",
       "src/index.css": "...",
       "package.json": "..."
     }
     
     Rules:
     1. Use Create React App or Vite structure.
     2. Include package.json with dependencies.
     3. Use Tailwind CSS.
     4. Return ONLY valid JSON.
     `;
     
     let output = '';
     await aiManager.generate({
        model,
        prompt,
        stream: true
     }, (chunk) => {
        output += chunk;
        if (onChunk) onChunk(chunk);
     });

     // Parse JSON (Naive implementation for now, will improve with structured output mode later)
     const vfs = new VirtualFileSystem();
     try {
        // Simple heuristic to extract JSON from potential markdown blocks
        const jsonMatch = output.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const files = JSON.parse(jsonMatch[0]);
            Object.entries(files).forEach(([path, content]) => {
                vfs.addFile(path as string, content as string);
            });
        }
     } catch (e) {
         console.error("Failed to parse project JSON", e);
     }
     
     return vfs;
  }
}

export const codeGenerator = new CodeGenerator();
