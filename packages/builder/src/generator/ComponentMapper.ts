// ComponentMapper.ts
import { WebsiteBlueprint } from '../schema';

export function mapStructureToImports(structure: WebsiteBlueprint['structure']): string[] {
    const imports = new Set<string>();

    structure.forEach(section => {
        switch (section.type) {
            case 'hero_modern_split':
            case 'hero_center':
            case 'hero_glow':
                imports.add("import { Hero } from './components/Hero';");
                break;
            case 'features_grid':
            case 'features_cards':
                imports.add("import { Features } from './components/Features';");
                break;
            // Add other mappings
        }
    });

    return Array.from(imports);
}

export function generateAppTsx(blueprint: WebsiteBlueprint): string {
    const imports = mapStructureToImports(blueprint.structure);
    // Always include Navbar and Footer for now
    imports.push("import { Navbar } from './components/Navbar';");
    imports.push("import { Footer } from './components/Footer';");

    let jsxContent = '';

    // 1. Add Navbar
    jsxContent += `
      <Navbar 
        brand_name="GenSite" 
        links={[{label: 'Home', url: '#'}, {label: 'Features', url: '#'}]} 
        variant="sticky"
      />
  `;

    // 2. Add Sections
    blueprint.structure.forEach((section, index) => {
        if (section.type.includes('hero')) {
            const variant = section.type.includes('split') ? 'split' : section.type.includes('glow') ? 'glow' : 'center';
            jsxContent += `
      <Hero 
        variant="${variant}"
        headline="${section.props.headline}"
        subheadline="${section.props.subheadline}"
        cta_primary="${section.props.cta_primary}"
        cta_secondary="${section.props.cta_secondary || ''}"
      />
      `;
        } else if (section.type.includes('features')) {
            jsxContent += `
       <Features 
         variant="grid"
         headline="${section.props.headline}"
         subheadline="${section.props.subheadline}"
         items={${JSON.stringify(section.props.items)}}
       />
       `;
        }
    });

    // 3. Add Footer
    jsxContent += `
      <Footer brand_name="GenSite" copyright_text="© 2026 GenSite Inc. All rights reserved." />
  `;

    return `
import React from 'react';
${imports.join('\n')}

export default function App() {
  return (
    <main className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary/20">
      ${jsxContent}
    </main>
  );
}
`;
}
