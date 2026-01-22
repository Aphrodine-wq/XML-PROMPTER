export interface StorageProvider {
  save<T>(key: string, data: T): void;
  load<T>(key: string, defaultValue: T): T;
  clear(key: string): void;
}

export class MemoryStorageProvider implements StorageProvider {
  private store: Record<string, any> = {};

  save<T>(key: string, data: T): void {
    this.store[key] = data;
  }

  load<T>(key: string, defaultValue: T): T {
    return this.store[key] || defaultValue;
  }

  clear(key: string): void {
    delete this.store[key];
  }
}

export class LocalStorageProvider implements StorageProvider {
  save<T>(key: string, data: T): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  load<T>(key: string, defaultValue: T): T {
    if (typeof localStorage !== 'undefined') {
      const item = localStorage.getItem(key);
      if (item) {
        try {
          return JSON.parse(item) as T;
        } catch {
          return defaultValue;
        }
      }
    }
    return defaultValue;
  }

  clear(key: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
}

export class StorageService {
  private provider: StorageProvider;

  constructor() {
    // Default to LocalStorage if available (Browser), otherwise Memory (safe default)
    // The CLI will explicitly override this with a Node provider.
    if (typeof window !== 'undefined' && window.localStorage) {
      this.provider = new LocalStorageProvider();
    } else {
      this.provider = new MemoryStorageProvider();
    }
  }

  setProvider(provider: StorageProvider) {
    this.provider = provider;
  }

  save<T>(key: string, data: T): void {
    this.provider.save(key, data);
  }

  load<T>(key: string, defaultValue: T): T {
    return this.provider.load(key, defaultValue);
  }

  clear(key: string): void {
    this.provider.clear(key);
  }
}

export const storage = new StorageService();
