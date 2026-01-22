import { XMLParser } from 'fast-xml-parser';

export interface XMLNode {
  name: string;
  attributes?: Record<string, string>;
  children?: XMLNode[];
  content?: string;
  line?: number;
}

export function parseXMLToTree(xml: string): XMLNode | null {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      preserveOrder: true,
      textNodeName: '#text'
    });
    
    const parsed = parser.parse(xml);
    if (!parsed || parsed.length === 0) return null;

    // Helper to recursively transform fast-xml-parser output to our Tree format
    const transform = (node: any): XMLNode => {
      const keys = Object.keys(node);
      const tagName = keys.find(k => k !== ':@' && k !== '#text') || 'root';
      const attributes = node[':@'] || {};
      const childrenRaw = node[tagName] || [];
      
      const children = Array.isArray(childrenRaw) 
        ? childrenRaw.map(transform) 
        : [];

      return {
        name: tagName,
        attributes,
        children: children.length > 0 ? children : undefined,
        content: children.length === 0 && node['#text'] ? node['#text'] : undefined
      };
    };
    
    // Root usually comes as an array of one object in preserveOrder mode
    return transform(parsed[0]);
  } catch (e) {
    console.error("Tree Parse Error", e);
    return null;
  }
}
