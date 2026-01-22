export interface Template {
  id: string;
  name: string;
  content: string;
  category?: string;
  lastModified: number;
}

export class TemplateManager {
  private templates: Template[] = [];

  constructor() {
    // Load initial mock templates
    this.templates = [
      {
        id: '1',
        name: 'Basic Landing Page',
        category: 'Marketing',
        lastModified: Date.now(),
        content: '<website_prompt>\n  <page_type>landing</page_type>\n  <sections>\n    <hero>\n      <headline>Welcome to Future</headline>\n    </hero>\n  </sections>\n</website_prompt>'
      },
      {
        id: '2',
        name: 'Blog Post Layout',
        category: 'Blog',
        lastModified: Date.now(),
        content: '<website_prompt>\n  <page_type>blog_post</page_type>\n  <layout>sidebar_right</layout>\n</website_prompt>'
      }
    ];
  }

  getTemplates(): Template[] {
    return this.templates;
  }

  saveTemplate(template: Omit<Template, 'id' | 'lastModified'>): Template {
    const newTemplate = {
      ...template,
      id: Math.random().toString(36).substring(7),
      lastModified: Date.now()
    };
    this.templates.push(newTemplate);
    return newTemplate;
  }
  
  deleteTemplate(id: string): void {
    this.templates = this.templates.filter(t => t.id !== id);
  }
}

export const templateManager = new TemplateManager();
