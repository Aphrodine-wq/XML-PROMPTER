import fs from 'fs/promises';
import path from 'path';
import { GenerationResponse } from './types.js';

const STORAGE_DIR = process.env.GENERATED_PAGES_DIR || './generated_pages';

export interface PageMetadata {
    id: string;
    prompt: string;
    model: string;
    version: number;
    timestamp: number;
}

export class PersistenceManager {
    private async ensureDir(): Promise<void> {
        await fs.mkdir(STORAGE_DIR, { recursive: true });
        await fs.mkdir(path.join(STORAGE_DIR, 'html'), { recursive: true });
    }

    async savePage(id: string, response: GenerationResponse, prompt: string, version: number = 1): Promise<void> {
        await this.ensureDir();

        const metadata: PageMetadata = {
            id,
            prompt,
            model: response.model,
            version,
            timestamp: Date.now()
        };

        const baseName = `${id}_v${version}`;

        // Save HTML
        await fs.writeFile(
            path.join(STORAGE_DIR, 'html', `${baseName}.html`),
            response.response
        );

        // Save Metadata
        await fs.writeFile(
            path.join(STORAGE_DIR, `${baseName}.json`),
            JSON.stringify(metadata, null, 2)
        );
    }

    async loadPage(id: string, version: number): Promise<{ html: string; metadata: PageMetadata } | null> {
        try {
            const baseName = `${id}_v${version}`;
            const htmlPath = path.join(STORAGE_DIR, 'html', `${baseName}.html`);
            const metaPath = path.join(STORAGE_DIR, `${baseName}.json`);

            const [html, metaJson] = await Promise.all([
                fs.readFile(htmlPath, 'utf-8'),
                fs.readFile(metaPath, 'utf-8')
            ]);

            return {
                html,
                metadata: JSON.parse(metaJson)
            };
        } catch (error) {
            return null;
        }
    }

    async listPages(): Promise<PageMetadata[]> {
        try {
            await this.ensureDir();
            const files = await fs.readdir(STORAGE_DIR);
            const results: PageMetadata[] = [];

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const content = await fs.readFile(path.join(STORAGE_DIR, file), 'utf-8');
                    results.push(JSON.parse(content));
                }
            }
            return results.sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            return [];
        }
    }
}

export const persistence = new PersistenceManager();
