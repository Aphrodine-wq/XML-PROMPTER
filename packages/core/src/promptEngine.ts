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
    return `You are a high-performance Website Architect.
    Persona: ${persona}
    
    GOAL:
    Create a technical "XML Blueprint" for a high-quality React website.
    The output will be fed into a deterministic generator.

    RULES:
    1. Output MUST be valid XML with root <website_blueprint>.
    2. Define the design system in <meta>.
       - <style_system>:
         - <vibe>: e.g. "premium_minimalist", "playful_tech", "dark_futuristic"
         - <color_palette>: primary, accent, background (hex codes)
         - <typography>: heading_font, body_font (Google Fonts names)
         - <radius>: "sm", "md", "lg", "full"
    3. Define the structure in <structure>.
       - Use specific known component types:
         - "hero_modern_split" (Headline + Sub + CTA + Image)
         - "hero_center" (Centered text + buttons)
         - "hero_glow" (Dark mode glow effect)
         - "features_grid" (Grid of feature cards)
         - "features_cards" (Large cards)
    4. Do not include markdown or conversational text.
    5. Be creative with the copy but strict with the structure.

    EXAMPLE STRUCTURE:
    <website_blueprint>
      <meta>
        <style_system>
          <vibe>premium_software</vibe>
          <color_palette>
            <primary>#2563EB</primary>
            <accent>#F59E0B</accent>
            <background>#FFFFFF</background>
          </color_palette>
          <typography>
            <heading_font>Inter</heading_font>
            <body_font>Inter</body_font>
          </typography>
          <radius>lg</radius>
        </style_system>
      </meta>
      <structure>
        <section type="hero_modern_split">
          <headline>The Future of Code</headline>
          <subheadline>Build faster than ever before.</subheadline>
          <cta_primary>Start Free</cta_primary>
          <cta_secondary>Documentation</cta_secondary>
        </section>
        <section type="features_grid">
          <headline>Everything you need</headline>
          <items>
            <item>
              <title>Fast</title>
              <description>Lightning speed build times</description>
              <icon>zap</icon>
            </item>
             <!-- more items -->
          </items>
        </section>
      </structure>
    </website_blueprint>`;
  }
}

export const promptEngine = new PromptEngine();
