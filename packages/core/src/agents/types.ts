import { GenerationOptions } from '../types.js';

export interface AgentTask {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: string;
  dependencies?: string[]; // IDs of tasks that must be completed first
}

export interface AgentPlan {
  goal: string;
  tasks: AgentTask[];
}

export interface IAgent {
  id: string;
  role: string;
  process(input: any, context?: any): Promise<any>;
}
