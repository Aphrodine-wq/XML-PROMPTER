export interface PromptAnalysis {
  clarity: number; // 0-100
  specificity: number; // 0-100
  completeness: number; // 0-100
  issues: string[];
  suggestions: string[];
  score: number; // Overall score 0-100
}

export interface OptimizationOptions {
  style?: 'concise' | 'detailed' | 'technical' | 'creative';
  targetAudience?: string;
  outputLength?: 'short' | 'medium' | 'long';
}

export class PromptOptimizer {
  /**
   * Analyze prompt quality
   */
  static analyze(prompt: string): PromptAnalysis {
    const issues: string[] = [];
    const suggestions: string[] = [];

    let clarity = 100;
    let specificity = 100;
    let completeness = 100;

    // Check clarity
    if (prompt.length < 10) {
      clarity = 20;
      issues.push('Prompt is too short to be clear');
    } else if (prompt.length > 5000) {
      clarity = 70;
      suggestions.push('Consider breaking down into smaller prompts');
    }

    // Check specificity
    const vaguePhrases = [
      'something', 'anything', 'everything', 'somehow', 'some way',
      'kind of', 'sort of', 'maybe', 'probably', 'basically'
    ];

    let vagueCount = 0;
    for (const phrase of vaguePhrases) {
      if (prompt.toLowerCase().includes(phrase)) {
        vagueCount++;
      }
    }

    if (vagueCount > 0) {
      specificity = Math.max(0, 100 - vagueCount * 15);
      suggestions.push('Replace vague language with specific details');
    }

    // Check for missing elements
    const hasContext = prompt.toLowerCase().includes('context') || prompt.length > 500;
    const hasFormat = /format|output|should|return/.test(prompt.toLowerCase());
    const hasConstraints = /limit|max|min|avoid|only|must/.test(prompt.toLowerCase());

    if (!hasContext) {
      completeness -= 20;
      suggestions.push('Add more context about the use case');
    }
    if (!hasFormat) {
      completeness -= 15;
      suggestions.push('Specify the desired output format');
    }
    if (!hasConstraints) {
      completeness -= 10;
      suggestions.push('Add constraints or requirements');
    }

    // Check for structure
    const lines = prompt.split('\n').filter(l => l.trim());
    if (lines.length > 10) {
      suggestions.push('Consider using numbered points or sections for better organization');
    }

    // Grammar and spelling issues
    if (/[.,!?]{2,}/.test(prompt)) {
      issues.push('Multiple punctuation marks detected');
    }

    const score = (clarity + specificity + completeness) / 3;

    return {
      clarity,
      specificity,
      completeness,
      issues,
      suggestions,
      score
    };
  }

  /**
   * Generate optimized version of prompt
   */
  static optimize(prompt: string, options: OptimizationOptions = {}): string {
    let optimized = prompt;
    const style = options.style || 'concise';

    // Add structure
    optimized = this.addStructure(optimized, style);

    // Enhance clarity
    optimized = this.enhanceClarity(optimized);

    // Increase specificity
    optimized = this.increaseSpecificity(optimized);

    // Add constraints if missing
    if (!/limit|max|constraint/i.test(optimized)) {
      optimized += '\n\nConstraints:\n- Be concise and direct';
    }

    // Adjust length based on style
    if (options.outputLength === 'short' && optimized.length > 1000) {
      optimized = this.truncateToLength(optimized, 500);
    } else if (options.outputLength === 'long' && optimized.length < 500) {
      optimized = this.expandWithDetails(optimized);
    }

    return optimized;
  }

  /**
   * Replace vague language with specific language
   */
  private static increaseSpecificity(prompt: string): string {
    const replacements: Record<string, string> = {
      'something': 'a specific element',
      'anything': 'any of the following',
      'somehow': 'specifically by',
      'basically': 'in essence',
      'kind of': 'a type of',
      'sort of': 'similar to',
      'maybe': 'potentially',
      'probably': 'likely',
      'nice': 'visually appealing',
      'good': 'high-quality',
      'bad': 'problematic'
    };

    let result = prompt;
    for (const [vague, specific] of Object.entries(replacements)) {
      const regex = new RegExp(`\\b${vague}\\b`, 'gi');
      result = result.replace(regex, specific);
    }

    return result;
  }

  /**
   * Enhance clarity by improving sentence structure
   */
  private static enhanceClarity(prompt: string): string {
    let result = prompt;

    // Replace passive voice with active voice (basic)
    result = result.replace(/be generated/gi, 'generate');
    result = result.replace(/be created/gi, 'create');
    result = result.replace(/is required/gi, 'required');

    // Add missing articles
    result = result.replace(/\b(component|button|form|section|element)\b/gi, 'a $1');

    // Improve punctuation
    result = result.replace(/\n\n+/g, '\n\n');

    return result.trim();
  }

  /**
   * Add structure with numbered points or sections
   */
  private static addStructure(prompt: string, style: string): string {
    const lines = prompt.split('\n').filter(l => l.trim());

    if (lines.length < 3) {
      return prompt; // Too short to restructure
    }

    // Group into logical sections
    let structured = '';

    if (style === 'technical') {
      structured = 'REQUIREMENTS:\n';
      for (let i = 0; i < lines.length; i++) {
        structured += `${i + 1}. ${lines[i].trim()}\n`;
      }
    } else if (style === 'detailed') {
      structured = 'OVERVIEW:\n';
      structured += lines[0] + '\n\nDETAILS:\n';
      for (let i = 1; i < lines.length; i++) {
        structured += `• ${lines[i].trim()}\n`;
      }
    } else {
      // 'concise' or 'creative'
      structured = prompt;
    }

    return structured;
  }

  /**
   * Expand prompt with more details
   */
  private static expandWithDetails(prompt: string): string {
    const questions = [
      'What is the target audience?',
      'What specific use case should it solve?',
      'Are there any constraints or limitations?',
      'What tone or style is preferred?',
      'What are the success criteria?'
    ];

    let expanded = prompt;
    if (!prompt.endsWith('\n')) {
      expanded += '\n';
    }

    expanded += '\n\nAdditional Context:\n';
    for (const q of questions) {
      if (!prompt.includes(q)) {
        expanded += `• ${q}\n`;
      }
    }

    return expanded;
  }

  /**
   * Truncate prompt to target length
   */
  private static truncateToLength(prompt: string, maxLength: number): string {
    if (prompt.length <= maxLength) return prompt;

    const lines = prompt.split('\n');
    let truncated = '';

    for (const line of lines) {
      if ((truncated + line).length > maxLength) break;
      truncated += line + '\n';
    }

    return truncated.trim();
  }

  /**
   * Generate prompt variations
   */
  static generateVariations(prompt: string, count: number = 3): string[] {
    const variations: string[] = [prompt];

    // Variation 1: Add examples
    if (count > 1) {
      variations.push(
        prompt +
          '\n\nExample format:\n- [Describe expected output format here]'
      );
    }

    // Variation 2: Add constraints
    if (count > 2) {
      variations.push(
        prompt +
          '\n\nMust:\n- Be concise\n- Use clear language\n- Follow best practices'
      );
    }

    // Variation 3: Add target output
    if (count > 3) {
      variations.push(
        prompt +
          '\n\nOutput should:\n- Be well-structured\n- Include all necessary details\n- Be ready for immediate use'
      );
    }

    return variations.slice(0, count);
  }

  /**
   * Compare two prompts for quality
   */
  static compare(
    prompt1: string,
    prompt2: string
  ): {
    prompt1Score: number;
    prompt2Score: number;
    winner: 'prompt1' | 'prompt2' | 'tie';
  } {
    const analysis1 = this.analyze(prompt1);
    const analysis2 = this.analyze(prompt2);

    let winner: 'prompt1' | 'prompt2' | 'tie' = 'tie';
    if (analysis1.score > analysis2.score) {
      winner = 'prompt1';
    } else if (analysis2.score > analysis1.score) {
      winner = 'prompt2';
    }

    return {
      prompt1Score: analysis1.score,
      prompt2Score: analysis2.score,
      winner
    };
  }
}

export const promptOptimizer = new PromptOptimizer();
