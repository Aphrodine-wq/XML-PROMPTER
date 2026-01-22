import { BatchJob, BatchItem, GenerationOptions } from './types.js';
import { database } from './database.js';
import { redisManager } from './redis.js';
// import { Worker } from 'worker_threads'; // Not available in renderer
import path from 'path';
// import { fileURLToPath } from 'url';

export class BatchProcessor {
  private activeJobs: Set<string> = new Set();
  private workerPath: string;

  constructor() {
    // Resolve path to worker script
    // In production/Electron, we can't rely on fileURLToPath/import.meta.url the same way
    // For now, we'll hardcode a relative path or use a fallback
    this.workerPath = './workers/batch.worker.js'; 
    
    // Start listening for job results from Redis/Workers
    this.initWorkerListeners();
  }

  private initWorkerListeners() {
    // In a full implementation, this would subscribe to Redis events
    // For now, we rely on the executeBatch method to spawn workers
  }

  // Create a new batch job (Uses Redis)
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

    // Persist to DB and Redis Queue
    await database.createBatchJob(job);
    await redisManager.set(`job:${jobId}`, job, 3600 * 24); // Cache for 24h
    
    return jobId;
  }

  // Get job status (From Redis or DB)
  async getJobStatus(jobId: string): Promise<BatchJob | null> {
    const cached = await redisManager.get<BatchJob>(`job:${jobId}`);
    return cached || (await database.getBatchJob(jobId));
  }

  // List all jobs
  async listJobs(filter?: { status?: string }): Promise<BatchJob[]> {
    return await database.listBatchJobs(filter);
  }

  // Execute batch job (Offloaded to Worker Threads)
  async executeBatch(
    jobId: string,
    options?: Partial<GenerationOptions>,
    onProgress?: (progress: { completed: number; total: number; current: string }) => void,
    parallelCount: number = 3
  ): Promise<BatchJob | null> {
    const job = await this.getJobStatus(jobId);
    if (!job) return null;

    if (this.activeJobs.has(jobId)) {
      throw new Error(`Job ${jobId} is already running`);
    }

    this.activeJobs.add(jobId);
    job.status = 'running';
    job.updatedAt = new Date().toISOString();
    await this.updateJobState(job);

    try {
        // In renderer process, we can't use Worker Threads directly if not enabled in bundler
        // Fallback to promise-based parallelism or dynamic import if environment supports it
        // For now, we'll implement a simple Promise-based batching to avoid build errors
        
        for (let i = 0; i < job.items.length; i += parallelCount) {
            const batch = job.items.slice(i, i + parallelCount);
            
            // Placeholder for actual AI generation call until Worker strategy is fixed for Renderer
            const batchPromises = batch.map(async (item) => {
                try {
                    // Simulate work or call main process via IPC if needed
                    // For now, mark as failed since we disabled workers
                    throw new Error("Batch processing not fully supported in renderer mode yet");
                } catch (e: any) {
                    item.status = 'failed';
                    item.error = e.message;
                    job.failedItems++;
                }
            });

            await Promise.all(batchPromises);
            
            job.updatedAt = new Date().toISOString();
            await this.updateJobState(job);
            
            if (onProgress) {
                onProgress({
                    completed: job.completedItems + job.failedItems,
                    total: job.items.length,
                    current: 'Batch processed'
                });
            }
        }
/*
      // Process items in parallel batches using Worker Threads
      for (let i = 0; i < job.items.length; i += parallelCount) {
        const batch = job.items.slice(i, i + parallelCount);

        const batchPromises = batch.map((item) => {
            return new Promise<void>((resolve) => {
                // Spawn worker for this task
                // const worker = new Worker(this.workerPath);
                
                // worker.postMessage({
                //     id: item.id,
                //     prompt: item.prompt,
                //     options: { model: options?.model || 'llama3', ...options }
                // });

                // worker.on('message', (msg) => {
                //     if (msg.success) {
                //         item.status = 'completed';
                //         item.result = msg.result.response;
                //         job.completedItems++;
                //     } else {
                //         item.status = 'failed';
                //         item.error = msg.error;
                //         job.failedItems++;
                //     }
                //     worker.terminate();
                //     resolve();
                // });

                // worker.on('error', (err) => {
                //     item.status = 'failed';
                //     item.error = err.message;
                //     job.failedItems++;
                //     worker.terminate();
                //     resolve();
                // });
            });
        });

        await Promise.all(batchPromises);
        
        job.updatedAt = new Date().toISOString();
        await this.updateJobState(job);
        
        if (onProgress) {
            onProgress({
                completed: job.completedItems + job.failedItems,
                total: job.items.length,
                current: 'Batch processed'
            });
        }
      }
*/
      job.status = 'completed';
    } catch (error) {
      job.status = 'failed';
      console.error(`Batch job ${jobId} failed:`, error);
    } finally {
      this.activeJobs.delete(jobId);
      job.updatedAt = new Date().toISOString();
      await this.updateJobState(job);
    }

    return job;
  }

  private async updateJobState(job: BatchJob) {
      await database.updateBatchJob(job.id, job);
      await redisManager.set(`job:${job.id}`, job, 3600 * 24);
  }

  // Cancel batch job
  async cancelJob(jobId: string): Promise<void> {
    const job = await this.getJobStatus(jobId);
    if (job) {
      job.status = 'failed';
      job.updatedAt = new Date().toISOString();
      this.activeJobs.delete(jobId);
      await this.updateJobState(job);
    }
  }

  // Retry failed items
  async retryFailed(
    jobId: string,
    options?: Partial<GenerationOptions>,
    onProgress?: (progress: { completed: number; total: number; current: string }) => void
  ): Promise<BatchJob | null> {
    const job = await this.getJobStatus(jobId);
    if (!job) return null;
    
    // Logic similar to executeBatch but filtering for failed items
    // For brevity, calling executeBatch with failed items logic would go here
    // But since executeBatch is refactored, we'd need to adapt retry logic too.
    // For now, returning job.
    return job;
  }

  // Export batch results
  async exportResults(jobId: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    const job = await this.getJobStatus(jobId);
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
    const job = await this.getJobStatus(jobId);
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
