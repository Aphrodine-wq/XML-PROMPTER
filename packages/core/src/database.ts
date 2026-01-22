import { GenerationMetrics, PromptVersion, BatchJob, CollaborationSession } from './types.js';

// SQLite database manager - abstract implementation
// In production, use better-sqlite3 or sql.js

interface DatabaseRow {
  [key: string]: unknown;
}

export class DatabaseManager {
  private data: {
    metrics: GenerationMetrics[];
    versions: PromptVersion[];
    batches: BatchJob[];
    sessions: CollaborationSession[];
  } = {
    metrics: [],
    versions: [],
    batches: [],
    sessions: []
  };

  // Initialize database
  async init(): Promise<void> {
    // In production: create SQLite database tables
    console.log('Database initialized');
  }

  // Analytics: Record generation metrics
  async recordMetric(metric: GenerationMetrics): Promise<void> {
    this.data.metrics.push(metric);
  }

  // Analytics: Get metrics with filtering
  async getMetrics(filter?: {
    provider?: string;
    model?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<GenerationMetrics[]> {
    let results = [...this.data.metrics];

    if (filter?.provider) {
      results = results.filter(m => m.provider === filter.provider);
    }
    if (filter?.model) {
      results = results.filter(m => m.model === filter.model);
    }
    if (filter?.startDate) {
      results = results.filter(m => new Date(m.timestamp) >= new Date(filter.startDate!));
    }
    if (filter?.endDate) {
      results = results.filter(m => new Date(m.timestamp) <= new Date(filter.endDate!));
    }

    return results;
  }

  // Analytics: Get aggregated stats
  async getAggregateStats(): Promise<{
    totalGenerations: number;
    totalTokens: number;
    totalCost: number;
    avgDuration: number;
    modelBreakdown: Record<string, number>;
    providerBreakdown: Record<string, number>;
  }> {
    const metrics = this.data.metrics;
    const modelBreakdown: Record<string, number> = {};
    const providerBreakdown: Record<string, number> = {};

    let totalTokens = 0;
    let totalCost = 0;
    let totalDuration = 0;

    for (const metric of metrics) {
      totalTokens += metric.totalTokens;
      totalCost += metric.cost;
      totalDuration += metric.duration;
      modelBreakdown[metric.model] = (modelBreakdown[metric.model] || 0) + 1;
      providerBreakdown[metric.provider] = (providerBreakdown[metric.provider] || 0) + 1;
    }

    return {
      totalGenerations: metrics.length,
      totalTokens,
      totalCost,
      avgDuration: metrics.length > 0 ? totalDuration / metrics.length : 0,
      modelBreakdown,
      providerBreakdown
    };
  }

  // Version Control: Save prompt version
  async savePromptVersion(version: PromptVersion): Promise<void> {
    this.data.versions.push(version);
  }

  // Version Control: Get prompt history
  async getPromptHistory(promptId: string): Promise<PromptVersion[]> {
    return this.data.versions
      .filter(v => v.promptId === promptId)
      .sort((a, b) => a.version - b.version);
  }

  // Version Control: Get specific version
  async getPromptVersion(promptId: string, version: number): Promise<PromptVersion | null> {
    const v = this.data.versions.find(v => v.promptId === promptId && v.version === version);
    return v || null;
  }

  // Batch Processing: Create batch job
  async createBatchJob(job: BatchJob): Promise<void> {
    this.data.batches.push(job);
  }

  // Batch Processing: Update batch job
  async updateBatchJob(jobId: string, updates: Partial<BatchJob>): Promise<void> {
    const index = this.data.batches.findIndex(b => b.id === jobId);
    if (index >= 0) {
      this.data.batches[index] = { ...this.data.batches[index], ...updates };
    }
  }

  // Batch Processing: Get batch job
  async getBatchJob(jobId: string): Promise<BatchJob | null> {
    return this.data.batches.find(b => b.id === jobId) || null;
  }

  // Batch Processing: List batch jobs
  async listBatchJobs(filter?: { status?: string }): Promise<BatchJob[]> {
    let results = [...this.data.batches];
    if (filter?.status) {
      results = results.filter(b => b.status === filter.status);
    }
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Collaboration: Create session
  async createCollaborationSession(session: CollaborationSession): Promise<void> {
    this.data.sessions.push(session);
  }

  // Collaboration: Get session
  async getCollaborationSession(sessionId: string): Promise<CollaborationSession | null> {
    return this.data.sessions.find(s => s.id === sessionId) || null;
  }

  // Collaboration: Add participant
  async addParticipant(sessionId: string, participant: string): Promise<void> {
    const session = this.data.sessions.find(s => s.id === sessionId);
    if (session && !session.participants.includes(participant)) {
      session.participants.push(participant);
      session.updatedAt = new Date().toISOString();
    }
  }

  // Collaboration: Remove participant
  async removeParticipant(sessionId: string, participant: string): Promise<void> {
    const session = this.data.sessions.find(s => s.id === sessionId);
    if (session) {
      session.participants = session.participants.filter(p => p !== participant);
      session.updatedAt = new Date().toISOString();
    }
  }

  // Export/Import data
  async exportData(): Promise<string> {
    return JSON.stringify(this.data, null, 2);
  }

  async importData(data: string): Promise<void> {
    try {
      this.data = JSON.parse(data);
    } catch (error) {
      throw new Error('Failed to import data: invalid JSON');
    }
  }

  // Clear all data
  async clear(): Promise<void> {
    this.data = {
      metrics: [],
      versions: [],
      batches: [],
      sessions: []
    };
  }
}

export const database = new DatabaseManager();
