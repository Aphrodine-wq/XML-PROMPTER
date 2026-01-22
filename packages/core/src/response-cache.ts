import { GenerationResponse } from './types.js';
import crypto from 'crypto';

export interface CacheEntry {
  key: string;
  response: GenerationResponse;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  hitCount: number;
}

export class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number = 1000;
  private defaultTTL: number = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Generate cache key from prompt and options
   */
  private generateKey(prompt: string, model: string, provider: string): string {
    const hash = crypto
      .createHash('sha256')
      .update(`${prompt}:${model}:${provider}`)
      .digest('hex');
    return hash;
  }

  /**
   * Get cached response if available and not expired
   */
  get(prompt: string, model: string, provider: string): GenerationResponse | null {
    const key = this.generateKey(prompt, model, provider);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    entry.hitCount++;
    return entry.response;
  }

  /**
   * Store response in cache
   */
  set(
    prompt: string,
    model: string,
    provider: string,
    response: GenerationResponse,
    ttl: number = this.defaultTTL
  ): void {
    const key = this.generateKey(prompt, model, provider);

    // Evict least used entry if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const leastUsed = Array.from(this.cache.values()).reduce((min, entry) =>
        entry.hitCount < min.hitCount ? entry : min
      );
      this.cache.delete(leastUsed.key);
    }

    this.cache.set(key, {
      key,
      response,
      timestamp: Date.now(),
      ttl,
      hitCount: 0
    });
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
  } {
    const totalHits = Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.hitCount,
      0
    );
    const totalRequests = totalHits + this.cache.size;
    const hitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate
    };
  }

  /**
   * Get all cached entries
   */
  getAllEntries(): CacheEntry[] {
    return Array.from(this.cache.values());
  }
}

export const responseCache = new ResponseCache();
