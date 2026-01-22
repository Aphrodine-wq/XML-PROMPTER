import { PlannerAgent } from './planner.js';
import { CoderAgent } from './coder.js';
import { AgentPlan } from './types.js';
import { pluginManager } from '../plugin-system.js';

export class AgentOrchestrator {
  private planner = new PlannerAgent();
  private coder = new CoderAgent();

  async executeGoal(goal: string, context?: any, onProgress?: (status: string) => void): Promise<any[]> {
    if (onProgress) onProgress('Planning...');
    
    // Inject available tools into context
    const toolsDesc = pluginManager.getToolsDescription();
    const enhancedContext = { 
        ...context, 
        availableTools: toolsDesc 
    };

    // 1. Plan
    const plan = await this.planner.process(goal, enhancedContext);
    if (onProgress) onProgress(`Plan created: ${plan.tasks.length} tasks`);

    const results = [];

    // 2. Execute Tasks (Sequential for now)
    for (const task of plan.tasks) {
        if (onProgress) onProgress(`Executing: ${task.description}`);
        
        try {
            const result = await this.coder.process(task, context);
            task.status = 'completed';
            task.result = result;
            results.push({ task, result });
        } catch (e) {
            task.status = 'failed';
            console.error(`Task failed: ${task.id}`, e);
        }
    }

    if (onProgress) onProgress('All tasks completed');
    return results;
  }
}

export const agentOrchestrator = new AgentOrchestrator();
