export interface ComposableTemplate {
  id: string;
  name: string;
  content: string;
  parent?: string; // ID of parent template to inherit from
  overrides?: Record<string, string>; // Override specific sections
  metadata?: Record<string, unknown>;
}

export interface CompositionResult {
  id: string;
  name: string;
  content: string;
  chain: string[]; // Chain of templates used (parent -> child)
}

export class TemplateComposition {
  private templates: Map<string, ComposableTemplate> = new Map();

  /**
   * Register a template
   */
  registerTemplate(template: ComposableTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Compose templates with inheritance
   */
  compose(templateId: string): CompositionResult {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const chain: string[] = [templateId];
    let content = template.content;

    // Build inheritance chain
    let current = template;
    while (current.parent) {
      const parent = this.templates.get(current.parent);
      if (!parent) break;

      chain.unshift(current.parent);
      content = this.mergeTemplates(parent.content, content, current.overrides || {});
      current = parent;
    }

    return {
      id: templateId,
      name: template.name,
      content,
      chain
    };
  }

  /**
   * Merge parent and child templates with overrides
   */
  private mergeTemplates(
    parentContent: string,
    childContent: string,
    overrides: Record<string, string>
  ): string {
    // Find slots in parent and replace with child content or overrides
    let merged = parentContent;

    // Replace {{ slot:name }} patterns with child content
    const slotPattern = /\{\{\s*slot:\s*(\w+)\s*\}\}/g;
    merged = merged.replace(slotPattern, (match, slotName) => {
      return overrides[slotName] || childContent || match;
    });

    // Replace {{ extend:section }} with child's equivalent section
    const extendPattern = /\{\{\s*extend:\s*(\w+)\s*\}\}/g;
    merged = merged.replace(extendPattern, (match, sectionName) => {
      const childSection = this.extractSection(childContent, sectionName);
      return childSection || match;
    });

    return merged;
  }

  /**
   * Extract a named section from content
   */
  private extractSection(content: string, sectionName: string): string {
    const pattern = new RegExp(
      `<!--\\s*@section\\s+${sectionName}\\s*-->([\\s\\S]*?)<!--\\s*@endsection\\s*-->`,
      'i'
    );
    const match = content.match(pattern);
    return match ? match[1].trim() : '';
  }

  /**
   * Create a new template with mixins
   */
  applyMixins(baseContent: string, mixinIds: string[]): string {
    let result = baseContent;

    for (const mixinId of mixinIds) {
      const mixin = this.templates.get(mixinId);
      if (!mixin) continue;

      // Replace {{ mixin:id }} with mixin content
      const mixinPattern = new RegExp(`\\{\\{\\s*mixin:\\s*${mixinId}\\s*\\}\\}`, 'g');
      result = result.replace(mixinPattern, mixin.content);
    }

    return result;
  }

  /**
   * Get template inheritance chain
   */
  getInheritanceChain(templateId: string): string[] {
    const template = this.templates.get(templateId);
    if (!template) return [];

    const chain = [templateId];
    let current = template;

    while (current.parent) {
      const parent = this.templates.get(current.parent);
      if (!parent) break;
      chain.unshift(current.parent);
      current = parent;
    }

    return chain;
  }

  /**
   * Get templates that inherit from a given template
   */
  getChildren(templateId: string): string[] {
    const children: string[] = [];
    for (const [id, template] of this.templates.entries()) {
      if (template.parent === templateId) {
        children.push(id);
        children.push(...this.getChildren(id));
      }
    }
    return children;
  }

  /**
   * Delete a template
   */
  deleteTemplate(templateId: string): void {
    this.templates.delete(templateId);
  }

  /**
   * Get all templates
   */
  getAllTemplates(): ComposableTemplate[] {
    return Array.from(this.templates.values());
  }
}

export const templateComposition = new TemplateComposition();
