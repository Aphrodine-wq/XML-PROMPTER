import { describe, it, expect, vi } from 'vitest';
import { generationService } from './generation-service.js';
import { aiManager } from './ai-manager.js';
import { semanticCache } from './semantic-cache.js';
import fs from 'fs/promises';
import path from 'path';

describe('High-Quality Website System Verification', () => {
    it('should coordinate all features: Cache, SEO, Persistence, Versioning', async () => {
        const id = 'test-site-' + Date.now();
        const prompt = 'Create a landing page for an organic coffee brand.';

        // Mock AI Manager to avoid real API calls
        const mockResponse = {
            model: 'gpt-4',
            created_at: new Date().toISOString(),
            response: '<h2>Organic Beans</h2><p>Our coffee is the best.</p>',
            done: true
        };
        vi.spyOn(aiManager, 'generate').mockResolvedValue(mockResponse);

        // Ensure cache is clear
        semanticCache.clearSemanticCache();

        // 1. First Generation
        console.log('\n[Phase 1: First Generation]');
        const result1 = await generationService.generateWebsite({
            id,
            prompt,
            seo: {
                title: 'Best Organic Coffee',
                description: 'Buy premium organic beans here.'
            }
        });

        expect(result1.response).toContain('<title>Best Organic Coffee</title>');
        expect(result1.response).toContain('<h1>Organic Beans</h1>'); // H2 should be promoted to H1

        // 2. Verify Persistence
        const storageDir = process.env.GENERATED_PAGES_DIR || './generated_pages';
        const metaFile = path.join(storageDir, `${id}_v1.json`);
        const stats = await fs.stat(metaFile);
        expect(stats.size).toBeGreaterThan(0);
        console.log('✅ Persistence verified: Meta file exists.');

        // 3. Second Generation (Same prompt -> Semantic Cache Hit)
        console.log('\n[Phase 2: Semantic Cache Hit]');
        const startTime = Date.now();
        const result2 = await generationService.generateWebsite({
            id,
            prompt
        });
        const duration = Date.now() - startTime;

        expect(result2.response).toBe(result1.response);
        expect(duration).toBeLessThan(100); // Should be very fast
        console.log(`✅ Cache hit verified: Duration ${duration}ms.`);

        // 4. Versioning (New prompt -> New Version)
        console.log('\n[Phase 3: Versioning]');
        const newPrompt = 'Update coffee brand with more focus on sustainability.';
        const mockResponse2 = { ...mockResponse, response: '<h2>Sustainability First</h2>' };
        vi.spyOn(aiManager, 'generate').mockResolvedValue(mockResponse2);

        const result3 = await generationService.generateWebsite({
            id,
            prompt: newPrompt
        });

        const history = await generationService.getWebsiteHistory(id);
        expect(history.length).toBe(2);
        expect(history[0].version).toBe(2);
        console.log(`✅ Versioning verified: Latest version is ${history[0].version}.`);

        console.log('\n🚀 All High-Quality Features Verified.');
    });
});
