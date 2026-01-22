import { ollama } from './ollama.js';

export interface PromptContext {
  projectFiles?: string;
  persona?: string;
  history?: string[];
  userInstruction: string;
}

export class PromptEngine {
  
  async enhance(prompt: string, model: string): Promise<string> {
    let enhanced = '';
    await ollama.generate({
      model,
      prompt: `Act as a professional prompt engineer. Rewrite the following request to be more specific, detailed, and structured for an XML generator.
      
      Request: "${prompt}"
      
      Output ONLY the rewritten prompt. Do not add conversational text.`,
      stream: true
    }, (chunk) => enhanced += chunk);
    return enhanced.trim();
  }

  async refine(xml: string, instruction: string, model: string): Promise<string> {
    // We construct a specific prompt for refinement
    return `You are an expert XML editor.
    
    EXISTING XML:
    ${xml}
    
    USER INSTRUCTION:
    ${instruction}
    
    TASK:
    Modify the Existing XML to satisfy the User Instruction.
    - Preserve the overall structure.
    - Only change what is necessary.
    - Ensure valid XML output.
    - Output ONLY the XML.`;
  }

  buildSystemPrompt(persona: string): string {
    return `You are a high-performance XML Website Generator.
    Persona: ${persona}
    
    Rules:
    1. Output MUST be valid XML.
    2. Root element: <website_prompt>
    3. Structure: <page_type>, <meta>, <sections>, <styles>
    4. Do not include markdown code blocks (backticks).
    5. Do not include conversational text.`;
  }
}

export const promptEngine = new PromptEngine();
