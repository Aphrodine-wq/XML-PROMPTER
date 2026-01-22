
import { describe, it, expect } from 'vitest';
import { semanticCache } from './semantic-cache.js';

describe('Semantic Cache 10x Expansion Demo', () => {
    it('should demonstrate rich telemetry and explainability', async () => {
        // 1. Setup - Clear cache
        semanticCache.clearSemanticCache();

        const model = 'gpt-4';
        const provider = 'openai';

        // 2. Seed the cache with a complex prompt
        const originalPrompt = "Write a function to calculate the Fibonacci sequence generally and efficiently.";
        const responseText = "Here is a memoized Fibonacci function in TypeScript...";

        await semanticCache.set(originalPrompt, model, provider, {
            options: {}, // Ignored but kept for strict type compliance if needed by some runtimes
            model: model,
            created_at: new Date().toISOString(),
            response: responseText,
            done: true,
            tokens_used: 100
        } as any); // cast as any to avoid strict interface mismatch if types.ts drifts

        // 3. Query with a similar prompt (Semantic Hit)
        const similarPrompt = "Create an efficient typescript function for fibonacci";

        console.log('\n=============================================');
        console.log('   SEMANTIC CACHE SYSTEM EXPANSION DEMO');
        console.log('=============================================');
        console.log(`Original: "${originalPrompt}"`);
        console.log(`Query:    "${similarPrompt}"`);

        // Use the new explain() feature
        const explanation = semanticCache.explain(similarPrompt, model, provider);
        console.log('\n[10x Output: Explainability]');
        console.log(JSON.stringify(explanation, null, 2));

        // Lower threshold for this lexical-difference test case
        semanticCache.setSimilarityThreshold(0.2);

        expect(explanation.topMatches.length).toBeGreaterThan(0);
        expect(explanation.topMatches[0].score).toBeGreaterThan(0.2);

        // 4. Perform the actual get() to trigger stats
        const hit = await semanticCache.get(similarPrompt, model, provider);
        expect(hit).not.toBeNull();
        if (hit) {
            // Use bracket notation to safely access property if types differ
            console.log(`\n[Cache Result]: Hit! (Saved generation of ${(hit as any).response.length} chars)`);
        }

        // 5. Demonstrate Rich Telemetry
        const stats = semanticCache.getSemanticStats();
        console.log('\n[10x Output: Telemetry & Analytics]');
        console.log(JSON.stringify(stats, null, 2));

        expect(stats.semanticHits).toBe(1);
        expect(stats.estimatedTokensSaved).toBeGreaterThan(0);
        expect(stats.scoreDistribution['<0.90']).toBeGreaterThanOrEqual(1);

        console.log('\n✅ System Expansion Verified.');
    });
});
