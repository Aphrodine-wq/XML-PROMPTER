import { IAgent, AgentPlan, AgentTask } from './types.js';
import { aiManager } from '../ai-manager.js';

export class PlannerAgent implements IAgent {
  id = 'planner';
  role = 'Architect';

  async process(goal: string, context?: any): Promise<AgentPlan> {
    const prompt = `You are a Senior Software Architect.
    Goal: ${goal}
    
    ${context?.availableTools ? `Available Tools:\n${context.availableTools}\n` : ''}

    Create a step-by-step implementation plan.
    Return ONLY a JSON object with this structure:
    {
      "goal": "${goal}",
      "tasks": [
        { "id": "task-1", "description": "Initialize React project structure", "dependencies": [] },
        { "id": "task-2", "description": "Create Navbar component", "dependencies": ["task-1"] }
      ]
    }
    `;

    const response = await aiManager.generate({
      model: context?.model || 'gemini-2.0-flash', // Default to fast model
      prompt,
      stream: false
    });

    try {
      // Basic JSON extraction
      const jsonMatch = response.response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in planner response");
      
      const plan = JSON.parse(jsonMatch[0]) as AgentPlan;
      return plan;
    } catch (e) {
      console.error("Planner failed to parse JSON", e);
      // Fallback plan
      return {
        goal,
        tasks: [
          { id: '1', description: 'Analyze requirements', status: 'pending' },
          { id: '2', description: 'Implement solution', status: 'pending' }
        ]
      } as AgentPlan;
    }
  }
}
