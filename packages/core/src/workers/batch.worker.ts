import { parentPort, workerData } from 'worker_threads';
import { aiManager } from '../ai-manager.js';

// Worker thread for processing batch items
// This runs in a separate thread from the main application
if (parentPort) {
  parentPort.on('message', async (task) => {
    try {
      const { prompt, options, id } = task;
      
      // Execute the heavy AI generation task
      const result = await aiManager.generate({
        prompt,
        ...options
      });

      // Send result back to main thread
      parentPort?.postMessage({
        success: true,
        id,
        result
      });

    } catch (error: any) {
      parentPort?.postMessage({
        success: false,
        id: task.id,
        error: error.message
      });
    }
  });
}
