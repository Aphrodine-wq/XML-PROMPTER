import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generationService } from './generation-service.js';
import { aiManager } from './ai-manager.js';
import { semanticCache } from './semantic-cache.js';
import { PREMIUM_DESIGN_PROMPT } from './prompts.js';

describe('Emerald & Snow Aesthetic Verification', () => {
    beforeEach(() => {
        semanticCache.clearSemanticCache();
    });

    it('should use the new high-end Emerald & Snow design prompt', async () => {
        const id = 'emerald-test-' + Date.now();
        const prompt = 'Create a luxury real estate landing page.';

        const mockProvider = {
            generate: vi.fn().mockResolvedValue({
                model: 'mistral',
                created_at: new Date().toISOString(),
                response: '<html>Luxury Estate</html>',
                done: true
            }),
            listModels: vi.fn(),
            isAvailable: vi.fn().mockResolvedValue(true)
        };

        // Inject into current AIManager instance
        (aiManager as any).providers.set('ollama', mockProvider);
        (aiManager as any).currentProvider = 'ollama';

        // 1. Trigger generation
        await generationService.generateWebsite({ id, prompt });

        // 2. Verify that Emerald & Snow instructions were used
        const calls = mockProvider.generate.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const fullOptions = calls[0][0];

        expect(fullOptions.system).toContain('world-class UI/UX Designer');
        expect(fullOptions.system).toContain('Emerald & Snow');
        expect(fullOptions.system).toContain('NO TRANSPARENCY');
        expect(fullOptions.system).toContain('NO GRADIENTS');

        console.log('✅ Emerald & Snow verification passed.');
    });
});
