import { AIProvider } from './types.js';

export interface ProviderMetrics {
  provider: AIProvider;
  avgResponseTime: number; // milliseconds
  successRate: number; // 0-100
  avgCostPerRequest: number; // USD
  totalRequests: number;
  failureCount: number;
  score: number; // 0-100, higher is better
}

export interface RequestMetric {
  provider: AIProvider;
  responseTime: number;
  success: boolean;
  cost: number;
}

export class ProviderRanking {
  private metrics: Map<AIProvider, ProviderMetrics> = new Map();

  constructor() {
    // Initialize providers
    const providers: AIProvider[] = ['ollama', 'openai', 'anthropic', 'groq', 'lm-studio', 'huggingface'];
    for (const provider of providers) {
      this.metrics.set(provider, {
        provider,
        avgResponseTime: 0,
        successRate: 100,
        avgCostPerRequest: 0,
        totalRequests: 0,
        failureCount: 0,
        score: 0
      });
    }
  }

  /**
   * Record a request metric
   */
  recordMetric(metric: RequestMetric): void {
    const providerMetrics = this.metrics.get(metric.provider);
    if (!providerMetrics) return;

    const { totalRequests, failureCount, avgResponseTime, avgCostPerRequest } = providerMetrics;

    // Update average response time
    const newTotal = totalRequests + 1;
    providerMetrics.avgResponseTime = (avgResponseTime * totalRequests + metric.responseTime) / newTotal;

    // Update cost
    providerMetrics.avgCostPerRequest = (avgCostPerRequest * totalRequests + metric.cost) / newTotal;

    // Update success rate
    if (!metric.success) {
      providerMetrics.failureCount++;
    }
    providerMetrics.successRate = ((newTotal - providerMetrics.failureCount) / newTotal) * 100;
    providerMetrics.totalRequests = newTotal;

    // Calculate score
    this.updateScore(metric.provider);
  }

  /**
   * Calculate provider score (0-100)
   */
  private updateScore(provider: AIProvider): void {
    const metrics = this.metrics.get(provider);
    if (!metrics || metrics.totalRequests === 0) return;

    // Score components:
    // - Success rate (40% weight)
    // - Response time (40% weight, lower is better)
    // - Cost (20% weight, lower is better)

    const successScore = metrics.successRate;

    // Normalize response time (assume 5s is worst, 100ms is best)
    const responseTimeScore = Math.max(0, 100 - (metrics.avgResponseTime / 50));

    // Normalize cost (assume $0.01 is worst, $0 is best)
    const costScore = Math.max(0, 100 - (metrics.avgCostPerRequest * 10000));

    metrics.score = successScore * 0.4 + responseTimeScore * 0.4 + costScore * 0.2;
  }

  /**
   * Get ranking of all providers
   */
  getRanking(): ProviderMetrics[] {
    return Array.from(this.metrics.values())
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Get best provider for specific criteria
   */
  getBestProvider(criteria: 'speed' | 'cost' | 'reliability' | 'balanced'): AIProvider {
    const providers = Array.from(this.metrics.values());

    if (providers.length === 0) return 'ollama';

    let best = providers[0];

    if (criteria === 'speed') {
      best = providers.reduce((fastest, p) =>
        p.avgResponseTime < fastest.avgResponseTime ? p : fastest
      );
    } else if (criteria === 'cost') {
      best = providers.reduce((cheapest, p) =>
        p.avgCostPerRequest < cheapest.avgCostPerRequest ? p : cheapest
      );
    } else if (criteria === 'reliability') {
      best = providers.reduce((most, p) =>
        p.successRate > most.successRate ? p : most
      );
    } else {
      // Balanced: use score
      best = providers.reduce((highest, p) =>
        p.score > highest.score ? p : highest
      );
    }

    return best.provider;
  }

  /**
   * Get metrics for a specific provider
   */
  getMetrics(provider: AIProvider): ProviderMetrics | null {
    return this.metrics.get(provider) || null;
  }

  /**
   * Reset metrics for all providers
   */
  reset(): void {
    for (const metrics of this.metrics.values()) {
      metrics.avgResponseTime = 0;
      metrics.successRate = 100;
      metrics.avgCostPerRequest = 0;
      metrics.totalRequests = 0;
      metrics.failureCount = 0;
      metrics.score = 0;
    }
  }
}

export const providerRanking = new ProviderRanking();
