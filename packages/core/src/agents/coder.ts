import { IAgent, AgentTask } from './types.js';
import { aiManager } from '../ai-manager.js';

export class CoderAgent implements IAgent {
  id = 'coder';
  role = 'Senior Developer';

  async process(task: AgentTask, context?: any): Promise<string> {
    const prompt = `You are an expert React Developer.
    Task: ${task.description}
    
    Context:
    ${context?.projectContext || 'No existing context.'}
    
    Write the code to complete this task. 
    If creating a file, return the full file content.
    If multiple files are needed, separate them clearly.
    `;

    const response = await aiManager.generate({
      model: context?.model || 'gemini-2.0-flash',
      prompt,
      stream: false
    });

    return response.response;
  }
}
