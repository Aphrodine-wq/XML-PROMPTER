import { aiManager } from './ai-manager.js';
import { semanticCache } from './semantic-cache.js';
import { applySeo, SEOConfig, ensureHeadingHierarchy } from './seo.js';
import { versionManager } from './versioning.js';
import { GenerationResponse, GenerationOptions } from './types.js';

export interface WebsiteGenerationRequest {
    prompt: string;
    id: string; // Persistent ID for the website project
    seo?: SEOConfig;
    options?: Partial<GenerationOptions>;
}

export class GenerationService {
    /**
     * Generate a high-quality website with full orchestration.
     */
    async generateWebsite(req: WebsiteGenerationRequest): Promise<GenerationResponse> {
        const { prompt, id, seo, options } = req;
        const model = options?.model || 'llama3';
        const provider = options?.provider || 'ollama';

        // 1. Semantic Cache Lookup (High Speed Reuse)
        const cached = await semanticCache.get(prompt, model, provider);
        if (cached) {
            console.log(`[GenerationService] Semantic Cache hit for ID: ${id}`);
            return cached;
        }

        // 2. AI Generation
        console.log(`[GenerationService] Cache miss. Generating via ${provider}/${model}...`);
        const response = await aiManager.generate({ prompt, model, ...options });

        // 3. Post-Processing: Quality & SEO
        let finalHtml = response.response;

        // Ensure proper heading hierarchy
        finalHtml = ensureHeadingHierarchy(finalHtml);

        // Apply SEO if requested
        if (seo) {
            finalHtml = applySeo(finalHtml, seo);
        }

        const enrichedResponse: GenerationResponse = {
            ...response,
            response: finalHtml
        };

        // 4. Persistence & Versioning
        const version = await versionManager.createNextVersion(id, prompt, enrichedResponse);
        console.log(`[GenerationService] Saved ${id} version ${version}`);

        // 5. Update Semantic Cache
        await semanticCache.set(prompt, model, provider, enrichedResponse);

        return enrichedResponse;
    }

    /**
     * Retrieve version history for a website.
     */
    async getWebsiteHistory(id: string) {
        return await versionManager.getHistory(id);
    }
}

export const generationService = new GenerationService();
