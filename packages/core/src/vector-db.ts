// Simple in-memory vector store that simulates a real Vector DB (like Qdrant/Pinecone)
// In production, this would connect to an external service.
export interface VectorDocument {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

export class VectorDBManager {
  private events: Map<string, Function[]> = new Map();
  private documents: Map<string, VectorDocument> = new Map();

  constructor() {}

  on(event: string, listener: Function) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
  }

  emit(event: string, ...args: any[]) {
    if (this.events.has(event)) {
      this.events.get(event)!.forEach(listener => listener(...args));
    }
  }

  // Simulate embedding generation (random vector of size 1536)
  // In reality, this calls OpenAI or a local BERT model
  private async generateEmbedding(text: string): Promise<number[]> {
    // Mock latency
    await new Promise(resolve => setTimeout(resolve, 10)); 
    return Array(1536).fill(0).map(() => Math.random());
  }

  // Cosine similarity
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async indexDocument(doc: Omit<VectorDocument, 'embedding'>): Promise<void> {
    const embedding = await this.generateEmbedding(doc.content);
    this.documents.set(doc.id, { ...doc, embedding });
  }

  async search(query: string, limit: number = 5): Promise<VectorDocument[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    const results: { doc: VectorDocument; score: number }[] = [];

    for (const doc of this.documents.values()) {
      if (!doc.embedding) continue;
      const score = this.cosineSimilarity(queryEmbedding, doc.embedding);
      results.push({ doc, score });
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.doc);
  }

  async deleteDocument(id: string): Promise<void> {
    this.documents.delete(id);
  }
}

export const vectorDB = new VectorDBManager();
