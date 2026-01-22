import { XMLParser } from 'fast-xml-parser';

export type ExportFormat = 'html' | 'react' | 'vue' | 'css' | 'tailwind' | 'json';

export interface ExportOptions {
  minify?: boolean;
  responsive?: boolean;
  darkMode?: boolean;
  componentName?: string;
}

export class FormatExporter {
  /**
   * Export XML to multiple formats
   */
  static export(xml: string, format: ExportFormat, options: ExportOptions = {}): string {
    const parsed = this.parseXML(xml);

    switch (format) {
      case 'html':
        return this.toHTML(parsed, options);
      case 'react':
        return this.toReact(parsed, options);
      case 'vue':
        return this.toVue(parsed, options);
      case 'css':
        return this.toCSS(parsed, options);
      case 'tailwind':
        return this.toTailwind(parsed, options);
      case 'json':
        return JSON.stringify(parsed, null, options.minify ? 0 : 2);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Parse XML to object
   */
  private static parseXML(xml: string): unknown {
    const parser = new XMLParser({
      ignoreAttributes: false,
      parseTagValue: true
    });
    return parser.parse(xml);
  }

  /**
   * Convert to HTML
   */
  private static toHTML(data: unknown, options: ExportOptions): string {
    const content = this.objectToHTML(data, options);
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Layout</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; }
    ${options.darkMode ? 'body { background: #1a1a1a; color: #fff; }' : 'body { background: #fff; }'}
    ${options.responsive ? '@media (max-width: 768px) { body { padding: 1rem; } }' : ''}
  </style>
</head>
<body>
${content}
</body>
</html>`;
    return options.minify ? html.replace(/\s+/g, ' ').trim() : html;
  }

  /**
   * Convert to React JSX
   */
  private static toReact(data: unknown, options: ExportOptions): string {
    const componentName = options.componentName || 'GeneratedComponent';
    const content = this.objectToReact(data);

    return `import React from 'react';

export function ${componentName}() {
  return (
${content}
  );
}

export default ${componentName};`;
  }

  /**
   * Convert to Vue template
   */
  private static toVue(data: unknown, options: ExportOptions): string {
    const componentName = options.componentName || 'GeneratedComponent';
    const content = this.objectToVue(data);

    return `<template>
${content}
</template>

<script setup>
// Component logic here
</script>

<style scoped>
/* Styles here */
</style>`;
  }

  /**
   * Convert to CSS
   */
  private static toCSS(data: unknown, options: ExportOptions): string {
    const classes = new Set<string>();
    this.extractClasses(data, classes);

    let css = '';
    for (const className of classes) {
      css += `.${className} {\n  /* Add styles here */\n}\n\n`;
    }

    return css || '/* No classes found in XML */';
  }

  /**
   * Convert to Tailwind CSS
   */
  private static toTailwind(data: unknown, options: ExportOptions): string {
    const content = this.objectToTailwind(data);
    return content;
  }

  /**
   * Convert object to HTML string recursively
   */
  private static objectToHTML(obj: unknown, options: ExportOptions, depth: number = 0): string {
    if (obj === null || obj === undefined) return '';

    if (typeof obj === 'string') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.objectToHTML(item, options, depth + 1)).join('\n');
    }

    if (typeof obj === 'object') {
      const record = obj as Record<string, unknown>;
      let html = '';

      for (const [key, value] of Object.entries(record)) {
        if (key.startsWith('@')) continue; // Skip attributes

        const attrs = this.getAttributes(record, '@');
        const attrStr = attrs ? ' ' + attrs : '';

        if (Array.isArray(value)) {
          html += `<${key}${attrStr}>\n${value.map(v => this.objectToHTML(v, options, depth + 1)).join('\n')}\n</${key}>\n`;
        } else if (typeof value === 'object') {
          html += `<${key}${attrStr}>\n${this.objectToHTML(value, options, depth + 1)}\n</${key}>\n`;
        } else {
          html += `<${key}${attrStr}>${value}</${key}>\n`;
        }
      }

      return html;
    }

    return String(obj);
  }

  /**
   * Convert object to React JSX
   */
  private static objectToReact(obj: unknown, depth: number = 0): string {
    const indent = '    '.repeat(Math.max(1, depth));

    if (typeof obj === 'string') {
      return `${indent}{${JSON.stringify(obj)}}`;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.objectToReact(item, depth)).join('\n');
    }

    if (typeof obj === 'object' && obj !== null) {
      const record = obj as Record<string, unknown>;
      let jsx = '';

      for (const [key, value] of Object.entries(record)) {
        if (key.startsWith('@')) continue;

        const attrs = Object.entries(record)
          .filter(([k]) => k.startsWith('@'))
          .map(([k, v]) => `${k.slice(1)}="${v}"`)
          .join(' ');

        const attrStr = attrs ? ' ' + attrs : '';

        if (Array.isArray(value)) {
          jsx += `${indent}<${key}${attrStr}>\n${value.map(v => this.objectToReact(v, depth + 1)).join('\n')}\n${indent}</${key}>\n`;
        } else if (typeof value === 'object') {
          jsx += `${indent}<${key}${attrStr}>\n${this.objectToReact(value, depth + 1)}\n${indent}</${key}>\n`;
        } else {
          jsx += `${indent}<${key}${attrStr}>{${JSON.stringify(value)}}</${key}>\n`;
        }
      }

      return jsx;
    }

    return String(obj);
  }

  /**
   * Convert object to Vue template
   */
  private static objectToVue(obj: unknown, depth: number = 0): string {
    const indent = '  '.repeat(Math.max(1, depth));

    if (typeof obj === 'string') {
      return `${indent}{{ text }}`;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.objectToVue(item, depth)).join('\n');
    }

    if (typeof obj === 'object' && obj !== null) {
      const record = obj as Record<string, unknown>;
      let vue = '';

      for (const [key, value] of Object.entries(record)) {
        if (key.startsWith('@')) continue;

        const attrStr = this.getAttributes(record, '@');

        if (Array.isArray(value)) {
          vue += `${indent}<${key}${attrStr ? ' ' + attrStr : ''}>\n${value.map(v => this.objectToVue(v, depth + 1)).join('\n')}\n${indent}</${key}>\n`;
        } else if (typeof value === 'object') {
          vue += `${indent}<${key}${attrStr ? ' ' + attrStr : ''}>\n${this.objectToVue(value, depth + 1)}\n${indent}</${key}>\n`;
        } else {
          vue += `${indent}<${key}${attrStr ? ' ' + attrStr : ''}>{{ ${JSON.stringify(value)} }}</${key}>\n`;
        }
      }

      return vue;
    }

    return String(obj);
  }

  /**
   * Convert object to Tailwind CSS
   */
  private static objectToTailwind(obj: unknown, depth: number = 0): string {
    const indent = '  '.repeat(Math.max(1, depth));

    if (typeof obj === 'string') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.objectToTailwind(item, depth)).join('\n');
    }

    if (typeof obj === 'object' && obj !== null) {
      const record = obj as Record<string, unknown>;
      let html = '';

      for (const [key, value] of Object.entries(record)) {
        if (key.startsWith('@')) continue;

        // Map common element names to Tailwind classes
        let classes = this.getElementTailwindClasses(key);

        if (Array.isArray(value)) {
          html += `${indent}<${key} class="${classes}">\n${value.map(v => this.objectToTailwind(v, depth + 1)).join('\n')}\n${indent}</${key}>\n`;
        } else if (typeof value === 'object') {
          html += `${indent}<${key} class="${classes}">\n${this.objectToTailwind(value, depth + 1)}\n${indent}</${key}>\n`;
        } else {
          html += `${indent}<${key} class="${classes}">${value}</${key}>\n`;
        }
      }

      return html;
    }

    return String(obj);
  }

  /**
   * Get attributes from object
   */
  private static getAttributes(obj: Record<string, unknown>, prefix: string): string {
    return Object.entries(obj)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, value]) => `${key.slice(prefix.length)}="${value}"`)
      .join(' ');
  }

  /**
   * Extract classes from object
   */
  private static extractClasses(obj: unknown, classes: Set<string>): void {
    if (typeof obj === 'object' && obj !== null) {
      const record = obj as Record<string, unknown>;
      if (record['@class']) {
        classes.add(String(record['@class']));
      }
      for (const value of Object.values(record)) {
        this.extractClasses(value, classes);
      }
    } else if (Array.isArray(obj)) {
      for (const item of obj) {
        this.extractClasses(item, classes);
      }
    }
  }

  /**
   * Map element names to Tailwind classes
   */
  private static getElementTailwindClasses(element: string): string {
    const tailwindMap: Record<string, string> = {
      'header': 'bg-gray-100 p-4 shadow',
      'nav': 'flex gap-4 p-4',
      'main': 'flex-1 p-4',
      'section': 'mb-8',
      'article': 'bg-white p-4 rounded shadow',
      'button': 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600',
      'input': 'px-3 py-2 border border-gray-300 rounded',
      'form': 'space-y-4',
      'footer': 'bg-gray-800 text-white p-4 mt-8'
    };

    return tailwindMap[element] || '';
  }
}

export const formatExporter = new FormatExporter();
