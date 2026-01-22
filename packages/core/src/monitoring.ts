/**
 * Monitoring & Observability System
 *
 * Provides comprehensive monitoring and observability:
 * - Performance metrics collection
 * - Error tracking and alerting
 * - Distributed tracing
 * - Health checks
 * - Custom metrics
 * - Time-series data
 *
 * Performance Impact: Identify bottlenecks and optimize system performance
 *
 * @module monitoring
 */

export interface Metric {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp: number;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
}

export interface Span {
  id: string;
  traceId: string;
  parentId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags?: Record<string, string>;
  logs?: Array<{ timestamp: number; message: string; level: string }>;
  error?: boolean;
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  timestamp: number;
  duration: number;
  metadata?: Record<string, any>;
}

export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  metric?: string;
  threshold?: number;
  currentValue?: number;
  timestamp: number;
  resolved?: boolean;
}

/**
 * Time-series metric store
 */
export class MetricStore {
  private metrics: Map<string, Metric[]> = new Map();
  private maxAge: number = 3600000; // 1 hour
  private maxPointsPerMetric: number = 1000;

  /**
   * Record a metric
   */
  record(metric: Metric): void {
    const key = this.getMetricKey(metric);
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const points = this.metrics.get(key)!;
    points.push(metric);

    // Limit size
    if (points.length > this.maxPointsPerMetric) {
      points.shift();
    }
  }

  /**
   * Get metrics by name
   */
  getMetrics(name: string, tags?: Record<string, string>): Metric[] {
    const key = this.getMetricKey({ name, tags } as Metric);
    return this.metrics.get(key) || [];
  }

  /**
   * Get all metric names
   */
  getMetricNames(): string[] {
    return Array.from(new Set(Array.from(this.metrics.keys()).map((k) => k.split('|')[0])));
  }

  /**
   * Calculate aggregate statistics
   */
  getStats(
    name: string,
    tags?: Record<string, string>
  ): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } {
    const metrics = this.getMetrics(name, tags);
    if (metrics.length === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };
    }

    const values = metrics.map((m) => m.value).sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      sum,
      avg: sum / values.length,
      min: values[0],
      max: values[values.length - 1],
      p50: this.percentile(values, 0.5),
      p95: this.percentile(values, 0.95),
      p99: this.percentile(values, 0.99),
    };
  }

  /**
   * Clean up old metrics
   */
  cleanup(): void {
    const cutoff = Date.now() - this.maxAge;

    for (const [key, metrics] of this.metrics) {
      const filtered = metrics.filter((m) => m.timestamp > cutoff);
      if (filtered.length === 0) {
        this.metrics.delete(key);
      } else {
        this.metrics.set(key, filtered);
      }
    }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  private getMetricKey(metric: { name: string; tags?: Record<string, string> }): string {
    const tagStr = metric.tags
      ? Object.entries(metric.tags)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}=${v}`)
          .join(',')
      : '';
    return `${metric.name}|${tagStr}`;
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }
}

/**
 * Distributed tracing
 */
export class Tracer {
  private spans: Map<string, Span> = new Map();
  private traces: Map<string, Span[]> = new Map();

  /**
   * Start a new span
   */
  startSpan(name: string, traceId?: string, parentId?: string): Span {
    const span: Span = {
      id: this.generateId(),
      traceId: traceId || this.generateId(),
      parentId,
      name,
      startTime: Date.now(),
      tags: {},
      logs: [],
    };

    this.spans.set(span.id, span);
    return span;
  }

  /**
   * End a span
   */
  endSpan(spanId: string, error?: Error): void {
    const span = this.spans.get(spanId);
    if (!span) {
      return;
    }

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;

    if (error) {
      span.error = true;
      this.addLog(spanId, 'error', error.message);
    }

    // Add to trace
    if (!this.traces.has(span.traceId)) {
      this.traces.set(span.traceId, []);
    }
    this.traces.get(span.traceId)!.push(span);

    this.spans.delete(spanId);
  }

  /**
   * Add tags to a span
   */
  addTags(spanId: string, tags: Record<string, string>): void {
    const span = this.spans.get(spanId);
    if (span) {
      span.tags = { ...span.tags, ...tags };
    }
  }

  /**
   * Add log to a span
   */
  addLog(spanId: string, level: string, message: string): void {
    const span = this.spans.get(spanId);
    if (span) {
      span.logs!.push({ timestamp: Date.now(), level, message });
    }
  }

  /**
   * Get trace by ID
   */
  getTrace(traceId: string): Span[] {
    return this.traces.get(traceId) || [];
  }

  /**
   * Get all traces
   */
  getAllTraces(): Map<string, Span[]> {
    return this.traces;
  }

  /**
   * Clear traces
   */
  clear(): void {
    this.spans.clear();
    this.traces.clear();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Health check system
 */
export class HealthChecker {
  private checks: Map<string, () => Promise<HealthCheck>> = new Map();
  private lastResults: Map<string, HealthCheck> = new Map();

  /**
   * Register a health check
   */
  register(name: string, check: () => Promise<HealthCheck>): void {
    this.checks.set(name, check);
  }

  /**
   * Run all health checks
   */
  async runAll(): Promise<Map<string, HealthCheck>> {
    const results = new Map<string, HealthCheck>();

    for (const [name, check] of this.checks) {
      try {
        const result = await check();
        results.set(name, result);
        this.lastResults.set(name, result);
      } catch (error) {
        const result: HealthCheck = {
          name,
          status: 'unhealthy',
          message: (error as Error).message,
          timestamp: Date.now(),
          duration: 0,
        };
        results.set(name, result);
        this.lastResults.set(name, result);
      }
    }

    return results;
  }

  /**
   * Get overall health status
   */
  async getOverallStatus(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    const results = await this.runAll();
    const statuses = Array.from(results.values()).map((r) => r.status);

    if (statuses.some((s) => s === 'unhealthy')) {
      return 'unhealthy';
    }
    if (statuses.some((s) => s === 'degraded')) {
      return 'degraded';
    }
    return 'healthy';
  }

  /**
   * Get last results
   */
  getLastResults(): Map<string, HealthCheck> {
    return this.lastResults;
  }
}

/**
 * Alert manager
 */
export class AlertManager {
  private alerts: Alert[] = [];
  private rules: Map<string, (metric: Metric) => boolean> = new Map();
  private handlers: Array<(alert: Alert) => void> = [];

  /**
   * Add alert rule
   */
  addRule(
    metricName: string,
    condition: (metric: Metric) => boolean,
    severity: Alert['severity'],
    title: string
  ): void {
    this.rules.set(metricName, condition);
  }

  /**
   * Check metric against rules
   */
  checkMetric(metric: Metric): void {
    const rule = this.rules.get(metric.name);
    if (rule && rule(metric)) {
      this.createAlert({
        severity: 'warning',
        title: `Metric threshold exceeded: ${metric.name}`,
        message: `Value: ${metric.value}`,
        metric: metric.name,
        currentValue: metric.value,
      });
    }
  }

  /**
   * Create alert
   */
  createAlert(alertData: Omit<Alert, 'id' | 'timestamp'>): Alert {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...alertData,
    };

    this.alerts.push(alert);
    this.notifyHandlers(alert);
    return alert;
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  /**
   * Subscribe to alerts
   */
  onAlert(handler: (alert: Alert) => void): () => void {
    this.handlers.push(handler);
    return () => {
      const index = this.handlers.indexOf(handler);
      if (index > -1) {
        this.handlers.splice(index, 1);
      }
    };
  }

  /**
   * Get all alerts
   */
  getAlerts(resolved?: boolean): Alert[] {
    return this.alerts.filter((a) => (resolved === undefined ? true : a.resolved === resolved));
  }

  private notifyHandlers(alert: Alert): void {
    this.handlers.forEach((handler) => {
      try {
        handler(alert);
      } catch (error) {
        console.error('Error in alert handler:', error);
      }
    });
  }
}

/**
 * Main monitoring system
 */
export class MonitoringSystem {
  private metricStore: MetricStore;
  private tracer: Tracer;
  private healthChecker: HealthChecker;
  private alertManager: AlertManager;

  constructor() {
    this.metricStore = new MetricStore();
    this.tracer = new Tracer();
    this.healthChecker = new HealthChecker();
    this.alertManager = new AlertManager();

    // Register default health checks
    this.registerDefaultHealthChecks();

    // Start periodic cleanup
    setInterval(() => this.metricStore.cleanup(), 300000); // 5 minutes
  }

  /**
   * Record a counter metric
   */
  counter(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.metricStore.record({
      name,
      value,
      tags,
      timestamp: Date.now(),
      type: 'counter',
    });
  }

  /**
   * Record a gauge metric
   */
  gauge(name: string, value: number, tags?: Record<string, string>): void {
    this.metricStore.record({
      name,
      value,
      tags,
      timestamp: Date.now(),
      type: 'gauge',
    });
  }

  /**
   * Record a histogram metric
   */
  histogram(name: string, value: number, tags?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      tags,
      timestamp: Date.now(),
      type: 'histogram',
    };
    this.metricStore.record(metric);
    this.alertManager.checkMetric(metric);
  }

  /**
   * Time a function execution
   */
  async timer<T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      this.histogram(name, Date.now() - start, tags);
      return result;
    } catch (error) {
      this.histogram(name, Date.now() - start, { ...tags, error: 'true' });
      throw error;
    }
  }

  /**
   * Start a trace span
   */
  startSpan(name: string, traceId?: string, parentId?: string): Span {
    return this.tracer.startSpan(name, traceId, parentId);
  }

  /**
   * End a trace span
   */
  endSpan(spanId: string, error?: Error): void {
    this.tracer.endSpan(spanId, error);
  }

  /**
   * Get metrics
   */
  getMetrics(name: string, tags?: Record<string, string>): Metric[] {
    return this.metricStore.getMetrics(name, tags);
  }

  /**
   * Get metric statistics
   */
  getMetricStats(name: string, tags?: Record<string, string>): ReturnType<MetricStore['getStats']> {
    return this.metricStore.getStats(name, tags);
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<Map<string, HealthCheck>> {
    return this.healthChecker.runAll();
  }

  /**
   * Register custom health check
   */
  registerHealthCheck(name: string, check: () => Promise<HealthCheck>): void {
    this.healthChecker.register(name, check);
  }

  /**
   * Get alerts
   */
  getAlerts(resolved?: boolean): Alert[] {
    return this.alertManager.getAlerts(resolved);
  }

  /**
   * Subscribe to alerts
   */
  onAlert(handler: (alert: Alert) => void): () => void {
    return this.alertManager.onAlert(handler);
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboard(): Promise<any> {
    const health = await this.healthChecker.getOverallStatus();
    const alerts = this.alertManager.getAlerts(false);
    const metricNames = this.metricStore.getMetricNames();

    const metrics: any = {};
    for (const name of metricNames) {
      metrics[name] = this.metricStore.getStats(name);
    }

    return {
      health,
      alertCount: alerts.length,
      alerts: alerts.slice(0, 10), // Latest 10
      metrics,
      timestamp: Date.now(),
    };
  }

  private registerDefaultHealthChecks(): void {
    // Memory health check
    this.healthChecker.register('memory', async () => {
      const start = Date.now();
      const usage = process.memoryUsage();
      const heapUsedPct = (usage.heapUsed / usage.heapTotal) * 100;

      return {
        name: 'memory',
        status: heapUsedPct > 90 ? 'unhealthy' : heapUsedPct > 75 ? 'degraded' : 'healthy',
        message: `Heap usage: ${heapUsedPct.toFixed(1)}%`,
        duration: Date.now() - start,
        timestamp: Date.now(),
        metadata: usage,
      };
    });

    // Event loop health check
    this.healthChecker.register('eventloop', async () => {
      const start = Date.now();
      await new Promise((resolve) => setImmediate(resolve));
      const duration = Date.now() - start;

      return {
        name: 'eventloop',
        status: duration > 100 ? 'unhealthy' : duration > 50 ? 'degraded' : 'healthy',
        message: `Event loop lag: ${duration}ms`,
        duration,
        timestamp: Date.now(),
      };
    });
  }
}

// Singleton instance
export const monitoring = new MonitoringSystem();
