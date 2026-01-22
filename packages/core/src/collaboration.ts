import { PromptVersion, CollaborationSession } from './types.js';
import { database } from './database.js';

export interface PromptSnapshot {
  id: string;
  content: string;
  author: string;
  timestamp: string;
}

export interface DiffResult {
  originalLines: string[];
  newLines: string[];
  changes: Array<{
    type: 'add' | 'remove' | 'modify';
    lineNumber: number;
    content: string;
  }>;
}

export class CollaborationManager {
  private sessions: Map<string, CollaborationSession> = new Map();
  private snapshots: Map<string, PromptSnapshot[]> = new Map();

  // Create collaboration session
  async createSession(
    name: string,
    participants: string[] = []
  ): Promise<CollaborationSession> {
    const session: CollaborationSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      participants,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.sessions.set(session.id, session);
    await database.createCollaborationSession(session);
    return session;
  }

  // Get session
  async getSession(sessionId: string): Promise<CollaborationSession | null> {
    return this.sessions.get(sessionId) || (await database.getCollaborationSession(sessionId));
  }

  // Add participant to session
  async addParticipant(sessionId: string, participant: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      await database.addParticipant(sessionId, participant);
      if (!session.participants.includes(participant)) {
        session.participants.push(participant);
        session.updatedAt = new Date().toISOString();
      }
    }
  }

  // Remove participant from session
  async removeParticipant(sessionId: string, participant: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      await database.removeParticipant(sessionId, participant);
      session.participants = session.participants.filter(p => p !== participant);
      session.updatedAt = new Date().toISOString();
    }
  }

  // Version Control: Create new version
  async createVersion(
    promptId: string,
    content: string,
    author: string,
    message: string
  ): Promise<PromptVersion> {
    const history = await database.getPromptHistory(promptId);
    const version: PromptVersion = {
      id: `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      promptId,
      version: history.length + 1,
      content,
      author,
      message,
      timestamp: new Date().toISOString()
    };

    await database.savePromptVersion(version);
    return version;
  }

  // Get full prompt history
  async getHistory(promptId: string): Promise<PromptVersion[]> {
    return await database.getPromptHistory(promptId);
  }

  // Get specific version
  async getVersion(promptId: string, versionNumber: number): Promise<PromptVersion | null> {
    return await database.getPromptVersion(promptId, versionNumber);
  }

  // Calculate diff between versions
  async getDiff(promptId: string, v1: number, v2: number): Promise<DiffResult | null> {
    const version1 = await database.getPromptVersion(promptId, v1);
    const version2 = await database.getPromptVersion(promptId, v2);

    if (!version1 || !version2) return null;

    const originalLines = version1.content.split('\n');
    const newLines = version2.content.split('\n');

    const changes = this.computeDiff(originalLines, newLines);

    return {
      originalLines,
      newLines,
      changes
    };
  }

  // Compute line-by-line diff
  private computeDiff(original: string[], updated: string[]): Array<{
    type: 'add' | 'remove' | 'modify';
    lineNumber: number;
    content: string;
  }> {
    const changes = [];
    const maxLength = Math.max(original.length, updated.length);

    for (let i = 0; i < maxLength; i++) {
      const origLine = original[i];
      const updatedLine = updated[i];

      if (origLine === undefined) {
        changes.push({
          type: 'add',
          lineNumber: i + 1,
          content: updatedLine || ''
        });
      } else if (updatedLine === undefined) {
        changes.push({
          type: 'remove',
          lineNumber: i + 1,
          content: origLine
        });
      } else if (origLine !== updatedLine) {
        changes.push({
          type: 'modify',
          lineNumber: i + 1,
          content: updatedLine
        });
      }
    }

    return changes;
  }

  // Merge versions (simple 3-way merge)
  async mergeVersions(
    promptId: string,
    baseVersion: number,
    branch1Version: number,
    branch2Version: number,
    author: string,
    strategy: 'ours' | 'theirs' | 'manual' = 'manual'
  ): Promise<PromptVersion | null> {
    const base = await database.getPromptVersion(promptId, baseVersion);
    const branch1 = await database.getPromptVersion(promptId, branch1Version);
    const branch2 = await database.getPromptVersion(promptId, branch2Version);

    if (!base || !branch1 || !branch2) return null;

    let mergedContent: string;

    if (strategy === 'ours') {
      mergedContent = branch1.content;
    } else if (strategy === 'theirs') {
      mergedContent = branch2.content;
    } else {
      // Simple manual merge: combine changes from both branches
      mergedContent = this.performMerge(base.content, branch1.content, branch2.content);
    }

    return await this.createVersion(
      promptId,
      mergedContent,
      author,
      `Merged version ${branch1Version} and ${branch2Version}`
    );
  }

  private performMerge(base: string, branch1: string, branch2: string): string {
    // Simple merge: if both branches changed the same content, prefer branch1
    // This is a simplified implementation - production would use proper 3-way merge
    const changes1 = base !== branch1;
    const changes2 = base !== branch2;

    if (changes1 && !changes2) return branch1;
    if (changes2 && !changes1) return branch2;
    if (changes1 && changes2) {
      // Both changed - simple heuristic: longer version wins
      return branch1.length >= branch2.length ? branch1 : branch2;
    }

    return base;
  }

  // Take snapshot for quick restore
  private async takeSnapshot(
    promptId: string,
    content: string,
    author: string
  ): Promise<PromptSnapshot> {
    const snapshot: PromptSnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      author,
      timestamp: new Date().toISOString()
    };

    if (!this.snapshots.has(promptId)) {
      this.snapshots.set(promptId, []);
    }

    this.snapshots.get(promptId)!.push(snapshot);
    // Keep only last 10 snapshots
    if (this.snapshots.get(promptId)!.length > 10) {
      this.snapshots.get(promptId)!.shift();
    }

    return snapshot;
  }

  // Restore from snapshot
  async restoreSnapshot(promptId: string, snapshotId: string): Promise<string | null> {
    const snapshots = this.snapshots.get(promptId);
    if (!snapshots) return null;

    const snapshot = snapshots.find(s => s.id === snapshotId);
    return snapshot?.content || null;
  }

  // Generate change log for a prompt
  async getChangeLog(promptId: string): Promise<string> {
    const history = await database.getPromptHistory(promptId);

    let log = `# Change Log for Prompt ${promptId}\n\n`;

    for (const version of history) {
      log += `## Version ${version.version}\n`;
      log += `**Author:** ${version.author}\n`;
      log += `**Date:** ${version.timestamp}\n`;
      log += `**Message:** ${version.message}\n\n`;
    }

    return log;
  }

  // Get statistics about collaboration
  async getCollaborationStats(promptId: string): Promise<{
    totalVersions: number;
    contributors: Set<string>;
    mostRecentChange: string;
    changeFrequency: number;
  }> {
    const history = await database.getPromptHistory(promptId);

    const contributors = new Set(history.map(v => v.author));
    const mostRecentChange = history.length > 0
      ? history[history.length - 1].timestamp
      : 'Never';

    const now = new Date().getTime();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const changesInDay = history.filter(v => new Date(v.timestamp).getTime() > dayAgo).length;

    return {
      totalVersions: history.length,
      contributors,
      mostRecentChange,
      changeFrequency: changesInDay
    };
  }
}

export const collaborationManager = new CollaborationManager();
