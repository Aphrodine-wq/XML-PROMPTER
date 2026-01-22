import { parse, validate } from 'fast-xml-parser';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  corrected?: string;
}

export interface XMLSchema {
  allowedElements?: string[];
  requiredAttributes?: Record<string, string[]>;
  maxNestingLevel?: number;
}

export class XMLValidator {
  /**
   * Validate XML string
   */
  static validate(xml: string, schema?: XMLSchema): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if XML is not empty
    if (!xml || xml.trim().length === 0) {
      errors.push('XML content is empty');
      return { isValid: false, errors, warnings };
    }

    // Try to parse XML
    try {
      const parsed = parse(xml, {
        ignoreAttributes: false,
        parseTagValue: false
      });

      if (!parsed) {
        errors.push('Failed to parse XML');
        return { isValid: false, errors, warnings };
      }
    } catch (e) {
      errors.push(`XML parsing error: ${e instanceof Error ? e.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings };
    }

    // Validate against schema if provided
    if (schema) {
      const schemaErrors = this.validateAgainstSchema(xml, schema);
      errors.push(...schemaErrors);
    }

    // Check for common issues
    if (xml.includes('< ')) {
      warnings.push('Found spaces after opening angle bracket');
    }
    if (xml.includes(' >')) {
      warnings.push('Found spaces before closing angle bracket');
    }

    // Check nesting depth
    const maxDepth = this.getMaxNestingDepth(xml);
    if (schema?.maxNestingLevel && maxDepth > schema.maxNestingLevel) {
      warnings.push(`Max nesting depth ${maxDepth} exceeds recommended ${schema.maxNestingLevel}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Attempt to auto-correct common XML errors
   */
  static autoCorrect(xml: string): string {
    let corrected = xml;

    // Fix spaces around brackets
    corrected = corrected.replace(/< /g, '<');
    corrected = corrected.replace(/ >/g, '>');

    // Fix unclosed tags
    corrected = this.fixUnclosedTags(corrected);

    // Fix mismatched quotes
    corrected = this.fixQuotes(corrected);

    // Normalize whitespace
    corrected = corrected.replace(/>\s+</g, '><');

    return corrected;
  }

  /**
   * Attempt to close unclosed tags
   */
  private static fixUnclosedTags(xml: string): string {
    const tagRegex = /<([a-zA-Z][a-zA-Z0-9]*)[^>]*(?<!\/?)>/g;
    const openTags: string[] = [];
    let result = xml;
    let offset = 0;

    let match;
    while ((match = tagRegex.exec(xml)) !== null) {
      const tagName = match[1];
      const fullTag = match[0];

      if (!fullTag.endsWith('/>')) {
        openTags.push(tagName);
      }
    }

    // Close any unclosed tags at the end
    for (let i = openTags.length - 1; i >= 0; i--) {
      result += `</${openTags[i]}>`;
    }

    return result;
  }

  /**
   * Fix quote mismatches in attributes
   */
  private static fixQuotes(xml: string): string {
    return xml.replace(/([a-zA-Z]+)='([^']*)(?<!\\)$/gm, '$1="$2"');
  }

  /**
   * Validate against schema
   */
  private static validateAgainstSchema(xml: string, schema: XMLSchema): string[] {
    const errors: string[] = [];

    if (schema.allowedElements && schema.allowedElements.length > 0) {
      const elementRegex = /<([a-zA-Z][a-zA-Z0-9]*)/g;
      let match;
      while ((match = elementRegex.exec(xml)) !== null) {
        const element = match[1];
        if (!schema.allowedElements.includes(element)) {
          errors.push(`Element '${element}' is not allowed`);
        }
      }
    }

    if (schema.requiredAttributes) {
      for (const [element, attrs] of Object.entries(schema.requiredAttributes)) {
        const elementRegex = new RegExp(`<${element}[^>]*>`, 'g');
        let match;
        while ((match = elementRegex.exec(xml)) !== null) {
          for (const attr of attrs) {
            if (!match[0].includes(`${attr}=`)) {
              errors.push(`Element '${element}' is missing required attribute '${attr}'`);
            }
          }
        }
      }
    }

    return errors;
  }

  /**
   * Get maximum nesting depth of XML
   */
  private static getMaxNestingDepth(xml: string): number {
    let maxDepth = 0;
    let currentDepth = 0;

    const lines = xml.split('\n');
    for (const line of lines) {
      const openCount = (line.match(/<[^/][^>]*>/g) || []).length;
      const closeCount = (line.match(/<\/[^>]*>/g) || []).length;

      currentDepth += openCount - closeCount;
      maxDepth = Math.max(maxDepth, currentDepth);
    }

    return maxDepth;
  }

  /**
   * Format XML with proper indentation
   */
  static format(xml: string, indent: number = 2): string {
    try {
      const parsed = parse(xml);
      const builder = new (require('fast-xml-parser').XMLBuilder)({
        ignoreAttributes: false,
        format: true,
        indentBy: ' '.repeat(indent)
      });
      return builder.build(parsed);
    } catch {
      return xml;
    }
  }
}
