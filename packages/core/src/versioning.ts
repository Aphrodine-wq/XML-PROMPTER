import { persistence, PageMetadata } from './persistence.js';

export class VersionManager {
    async getLatestVersionNumber(id: string): Promise<number> {
        const pages = await persistence.listPages();
        const matches = pages.filter(p => p.id === id);
        if (matches.length === 0) return 0;
        return Math.max(...matches.map(p => p.version));
    }

    async createNextVersion(id: string, prompt: string, response: any): Promise<number> {
        const currentVersion = await this.getLatestVersionNumber(id);
        const nextVersion = currentVersion + 1;
        await persistence.savePage(id, response, prompt, nextVersion);
        return nextVersion;
    }

    async getHistory(id: string): Promise<PageMetadata[]> {
        const pages = await persistence.listPages();
        return pages.filter(p => p.id === id).sort((a, b) => b.version - a.version);
    }
}

export const versionManager = new VersionManager();
