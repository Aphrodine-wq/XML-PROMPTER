import { BatchJob, BatchItem, GenerationOptions } from './types.js';
import { aiManager } from './ai-manager.js';
import { database } from './database.js';

export class BatchProcessor {
  private jobs: Map<string, BatchJob> = new Map();
  private activeJobs: Set<string> = new Set();

  // Create a new batch job
  async createJob(
    name: string,
    items: Array<{ prompt: string; [key: string]: unknown }>,
    options?: Partial<GenerationOptions>
  ): Promise<string> {
    const jobId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const batchItems: BatchItem[] = items.map((item, index) => ({
      id: `${jobId}-item-${index}`,
      prompt: item.prompt,
      status: 'pending'
    }));

    const job: BatchJob = {
      id: jobId,
      name,
      status: 'pending',
      totalItems: items.length,
      completedItems: 0,
      failedItems: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: batchItems
    };

    this.jobs.set(jobId, job);
    await database.createBatchJob(job);

    return jobId;
  }

  // Get job status
  async getJobStatus(jobId: string): Promise<BatchJob | null> {
    return this.jobs.get(jobId) || (await database.getBatchJob(jobId));
  }

  // List all jobs
  async listJobs(filter?: { status?: string }): Promise<BatchJob[]> {
    const jobs = Array.from(this.jobs.values());
    if (filter?.status) {
      return jobs.filter(j => j.status === filter.status);
    }
    return jobs;
  }

  // Execute batch job
  async executeBatch(
    jobId: string,
    options?: Partial<GenerationOptions>,
    onProgress?: (progress: { completed: number; total: number; current: string }) => void
  ): Promise<BatchJob | null> {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    if (this.activeJobs.has(jobId)) {
      throw new Error(`Job ${jobId} is already running`);
    }

    this.activeJobs.add(jobId);
    job.status = 'running';
    job.updatedAt = new Date().toISOString();

    try {
      for (let i = 0; i < job.items.length; i++) {
        const item = job.items[i];

        if (onProgress) {
          onProgress({
            completed: i,
            total: job.items.length,
            current: item.prompt.substring(0, 50)
          });
        }

        try {
          const result = await aiManager.generate(item.prompt, options);
          item.status = 'completed';
          item.result = result.response;
          job.completedItems++;
        } catch (error) {
          item.status = 'failed';
          item.error = error instanceof Error ? error.message : 'Unknown error';
          job.failedItems++;
        }

        item.status === 'completed' ? job.completedItems++ : job.failedItems++;
        job.updatedAt = new Date().toISOString();
        await database.updateBatchJob(jobId, job);
      }

      job.status = 'completed';
    } catch (error) {
      job.status = 'failed';
      console.error(`Batch job ${jobId} failed:`, error);
    } finally {
      this.activeJobs.delete(jobId);
      job.updatedAt = new Date().toISOString();
      await database.updateBatchJob(jobId, job);
    }

    return job;
  }

  // Cancel batch job
  async cancelJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.updatedAt = new Date().toISOString();
      this.activeJobs.delete(jobId);
      await database.updateBatchJob(jobId, job);
    }
  }

  // Retry failed items
  async retryFailed(
    jobId: string,
    options?: Partial<GenerationOptions>,
    onProgress?: (progress: { completed: number; total: number; current: string }) => void
  ): Promise<BatchJob | null> {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    const failedItems = job.items.filter(item => item.status === 'failed');
    if (failedItems.length === 0) return job;

    for (const item of failedItems) {
      try {
        const result = await aiManager.generate(item.prompt, options);
        item.status = 'completed';
        item.result = result.response;
        item.error = undefined;
        job.completedItems++;
        job.failedItems--;

        if (onProgress) {
          onProgress({
            completed: job.completedItems,
            total: job.totalItems,
            current: item.prompt.substring(0, 50)
          });
        }
      } catch (error) {
        item.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    job.updatedAt = new Date().toISOString();
    await database.updateBatchJob(jobId, job);
    return job;
  }

  // Export batch results
  async exportResults(jobId: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    if (format === 'json') {
      return JSON.stringify(job.items, null, 2);
    } else {
      // CSV format
      let csv = 'id,prompt,status,result,error\n';
      for (const item of job.items) {
        const prompt = (item.prompt || '').replace(/"/g, '""');
        const result = (item.result || '').replace(/"/g, '""');
        const error = (item.error || '').replace(/"/g, '""');
        csv += `"${item.id}","${prompt}","${item.status}","${result}","${error}"\n`;
      }
      return csv;
    }
  }

  // Get summary statistics
  async getSummary(jobId: string): Promise<{
    totalItems: number;
    completed: number;
    failed: number;
    pending: number;
    successRate: number;
  }> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    const pending = job.items.filter(i => i.status === 'pending').length;

    return {
      totalItems: job.totalItems,
      completed: job.completedItems,
      failed: job.failedItems,
      pending,
      successRate: job.totalItems > 0 ? (job.completedItems / job.totalItems) * 100 : 0
    };
  }
}

export const batchProcessor = new BatchProcessor();
