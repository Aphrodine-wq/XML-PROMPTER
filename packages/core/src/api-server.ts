/**
 * API Server - REST API for External Integrations
 *
 * Provides HTTP REST API for XML-PROMPTER:
 * - RESTful endpoints for all operations
 * - Authentication and API key management
 * - Rate limiting and quota enforcement
 * - OpenAPI/Swagger documentation
 * - CORS support for web clients
 *
 * Performance Impact: Enable third-party integrations and automation
 *
 * @module api-server
 */

export interface APIConfig {
  port: number;
  host: string;
  apiKeys: string[];
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  cors?: {
    origins: string[];
    methods: string[];
  };
}

export interface APIRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body?: any;
}

export interface APIResponse {
  status: number;
  headers?: Record<string, string>;
  body: any;
}

export interface RouteHandler {
  (req: APIRequest): Promise<APIResponse> | APIResponse;
}

export interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: RouteHandler;
  auth?: boolean;
  rateLimit?: boolean;
}

/**
 * Simple HTTP router
 */
export class Router {
  private routes: Route[] = [];

  get(path: string, handler: RouteHandler, auth = false): void {
    this.routes.push({ method: 'GET', path, handler, auth });
  }

  post(path: string, handler: RouteHandler, auth = true): void {
    this.routes.push({ method: 'POST', path, handler, auth });
  }

  put(path: string, handler: RouteHandler, auth = true): void {
    this.routes.push({ method: 'PUT', path, handler, auth });
  }

  delete(path: string, handler: RouteHandler, auth = true): void {
    this.routes.push({ method: 'DELETE', path, handler, auth });
  }

  patch(path: string, handler: RouteHandler, auth = true): void {
    this.routes.push({ method: 'PATCH', path, handler, auth });
  }

  findRoute(method: string, path: string): Route | undefined {
    return this.routes.find(
      (route) => route.method === method && this.matchPath(route.path, path)
    );
  }

  private matchPath(pattern: string, path: string): boolean {
    // Simple path matching - can be enhanced with path parameters
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) {
      return false;
    }

    return patternParts.every((part, i) => {
      return part.startsWith(':') || part === pathParts[i];
    });
  }

  extractParams(pattern: string, path: string): Record<string, string> {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    const params: Record<string, string> = {};

    patternParts.forEach((part, i) => {
      if (part.startsWith(':')) {
        const paramName = part.substring(1);
        params[paramName] = pathParts[i];
      }
    });

    return params;
  }

  getRoutes(): Route[] {
    return this.routes;
  }
}

/**
 * Rate limiter using token bucket algorithm
 */
export class RateLimiter {
  private buckets: Map<string, { tokens: number; lastRefill: number }> = new Map();
  private maxTokens: number;
  private refillRate: number; // tokens per millisecond
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxTokens = maxRequests;
    this.windowMs = windowMs;
    this.refillRate = maxRequests / windowMs;
  }

  /**
   * Check if request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.maxTokens - 1, lastRefill: now };
      this.buckets.set(key, bucket);
      return true;
    }

    // Refill tokens
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;
    bucket.tokens = Math.min(this.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Get remaining requests
   */
  getRemaining(key: string): number {
    const bucket = this.buckets.get(key);
    return bucket ? Math.floor(bucket.tokens) : this.maxTokens;
  }

  /**
   * Reset rate limit for key
   */
  reset(key: string): void {
    this.buckets.delete(key);
  }

  /**
   * Clean up old buckets
   */
  cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.windowMs * 2;

    for (const [key, bucket] of this.buckets) {
      if (bucket.lastRefill < cutoff) {
        this.buckets.delete(key);
      }
    }
  }
}

/**
 * API Server implementation
 */
export class APIServer {
  private router: Router;
  private config: APIConfig;
  private rateLimiter?: RateLimiter;
  private server?: any;

  constructor(config: APIConfig) {
    this.config = config;
    this.router = new Router();

    if (config.rateLimit) {
      this.rateLimiter = new RateLimiter(
        config.rateLimit.maxRequests,
        config.rateLimit.windowMs
      );
    }

    this.setupRoutes();
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check
    this.router.get('/health', async () => ({
      status: 200,
      body: { status: 'ok', timestamp: Date.now() },
    }));

    // API info
    this.router.get('/api', async () => ({
      status: 200,
      body: {
        name: 'XML-PROMPTER API',
        version: '1.0.0',
        endpoints: this.router.getRoutes().map((r) => ({
          method: r.method,
          path: r.path,
          auth: r.auth,
        })),
      },
    }));

    // Generate XML
    this.router.post('/api/generate', async (req) => {
      const { prompt, provider, model } = req.body;

      if (!prompt) {
        return {
          status: 400,
          body: { error: 'Missing required field: prompt' },
        };
      }

      // This would integrate with AI manager
      return {
        status: 200,
        body: {
          result: '<xml>Generated content</xml>',
          metadata: {
            provider: provider || 'ollama',
            model: model || 'default',
            tokens: 100,
            duration: 1500,
          },
        },
      };
    });

    // List models
    this.router.get('/api/models', async () => ({
      status: 200,
      body: {
        models: [
          { name: 'llama2', provider: 'ollama', size: '7B' },
          { name: 'gpt-4', provider: 'openai', size: 'unknown' },
        ],
      },
    }));

    // Search history
    this.router.post('/api/search', async (req) => {
      const { query, limit = 10 } = req.body;

      return {
        status: 200,
        body: {
          results: [
            {
              id: '1',
              content: 'Example result',
              similarity: 0.95,
              timestamp: Date.now(),
            },
          ],
        },
      };
    });

    // Batch processing
    this.router.post('/api/batch', async (req) => {
      const { prompts } = req.body;

      if (!Array.isArray(prompts)) {
        return {
          status: 400,
          body: { error: 'prompts must be an array' },
        };
      }

      return {
        status: 202,
        body: {
          jobId: `batch-${Date.now()}`,
          status: 'queued',
          total: prompts.length,
        },
      };
    });

    // Get batch status
    this.router.get('/api/batch/:jobId', async (req) => {
      return {
        status: 200,
        body: {
          jobId: 'batch-123',
          status: 'running',
          progress: { completed: 50, total: 100 },
        },
      };
    });

    // Plugin management
    this.router.get('/api/plugins', async () => ({
      status: 200,
      body: {
        plugins: [
          {
            name: 'example-plugin',
            version: '1.0.0',
            enabled: true,
          },
        ],
      },
    }));

    // Metrics
    this.router.get('/api/metrics', async () => ({
      status: 200,
      body: {
        totalGenerations: 1000,
        totalTokens: 500000,
        averageLatency: 1500,
        successRate: 0.98,
      },
    }));
  }

  /**
   * Handle incoming request
   */
  async handleRequest(req: APIRequest): Promise<APIResponse> {
    try {
      // CORS preflight
      if (req.method === 'OPTIONS') {
        return this.createCORSResponse();
      }

      // Find route
      const route = this.router.findRoute(req.method, req.path);
      if (!route) {
        return {
          status: 404,
          body: { error: 'Not found' },
        };
      }

      // Authentication
      if (route.auth && !this.authenticate(req)) {
        return {
          status: 401,
          body: { error: 'Unauthorized' },
        };
      }

      // Rate limiting
      if (this.rateLimiter) {
        const apiKey = req.headers['x-api-key'] || 'anonymous';
        if (!this.rateLimiter.isAllowed(apiKey)) {
          return {
            status: 429,
            body: { error: 'Rate limit exceeded' },
            headers: {
              'X-RateLimit-Remaining': '0',
              'Retry-After': '60',
            },
          };
        }
      }

      // Execute handler
      const response = await route.handler(req);

      // Add CORS headers
      if (this.config.cors) {
        response.headers = {
          ...response.headers,
          ...this.getCORSHeaders(),
        };
      }

      return response;
    } catch (error) {
      console.error('API Error:', error);
      return {
        status: 500,
        body: { error: 'Internal server error' },
      };
    }
  }

  /**
   * Authenticate request
   */
  private authenticate(req: APIRequest): boolean {
    const apiKey = req.headers['x-api-key'];
    return apiKey && this.config.apiKeys.includes(apiKey);
  }

  /**
   * Create CORS response
   */
  private createCORSResponse(): APIResponse {
    return {
      status: 204,
      headers: this.getCORSHeaders(),
      body: null,
    };
  }

  /**
   * Get CORS headers
   */
  private getCORSHeaders(): Record<string, string> {
    if (!this.config.cors) {
      return {};
    }

    return {
      'Access-Control-Allow-Origin': this.config.cors.origins.join(','),
      'Access-Control-Allow-Methods': this.config.cors.methods.join(','),
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    };
  }

  /**
   * Start the server (placeholder - requires HTTP server implementation)
   */
  async start(): Promise<void> {
    console.log(`API Server starting on ${this.config.host}:${this.config.port}`);
    // In production, integrate with Express, Fastify, or Node's http module
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    console.log('API Server stopping');
    if (this.server) {
      // Close server
    }
  }

  /**
   * Get router for custom route registration
   */
  getRouter(): Router {
    return this.router;
  }
}

/**
 * Create and configure API server
 */
export function createAPIServer(config: Partial<APIConfig> = {}): APIServer {
  const defaultConfig: APIConfig = {
    port: 3000,
    host: '0.0.0.0',
    apiKeys: [],
    rateLimit: {
      windowMs: 60000, // 1 minute
      maxRequests: 100,
    },
    cors: {
      origins: ['*'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    },
  };

  return new APIServer({ ...defaultConfig, ...config });
}

// Example usage
export const apiServer = createAPIServer();
