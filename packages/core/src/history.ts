export interface HistoryItem {
  id: string;
  prompt: string;
  response: string;
  model: string;
  timestamp: number;
}

export class HistoryManager {
  private history: HistoryItem[] = [];

  constructor() {
    // Mock initial history
    this.history = [
      {
        id: 'h1',
        prompt: 'Create a simple contact form',
        response: '<website_prompt>...</website_prompt>',
        model: 'mistral:latest',
        timestamp: Date.now() - 100000
      }
    ];
  }

  getHistory(): HistoryItem[] {
    return this.history.sort((a, b) => b.timestamp - a.timestamp);
  }

  addEntry(entry: Omit<HistoryItem, 'id' | 'timestamp'>): HistoryItem {
    const newItem = {
      ...entry,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now()
    };
    this.history.unshift(newItem);
    if (this.history.length > 50) this.history.pop(); // Limit size
    return newItem;
  }
  
  clearHistory(): void {
    this.history = [];
  }
}

export const historyManager = new HistoryManager();
