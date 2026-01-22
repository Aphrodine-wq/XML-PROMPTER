// Mock IORedis interface for local development without actual Redis server
// In production, this would be replaced by actual 'ioredis' package
class MockRedis {
  private events: Map<string, Function[]> = new Map();
  private store: Map<string, string> = new Map();
  private lists: Map<string, string[]> = new Map();

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

  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    this.store.set(key, value);
    if (mode === 'EX' && duration) {
      setTimeout(() => this.store.delete(key), duration * 1000);
    }
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const existed = this.store.delete(key);
    return existed ? 1 : 0;
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    if (!this.lists.has(key)) {
      this.lists.set(key, []);
    }
    const list = this.lists.get(key)!;
    list.push(...values);
    this.emit('message', key, values[0]); // Mock pub/sub for list
    return list.length;
  }

  async lpop(key: string): Promise<string | null> {
    const list = this.lists.get(key);
    if (!list || list.length === 0) return null;
    return list.shift() || null;
  }

  async publish(channel: string, message: string): Promise<number> {
    this.emit('message', channel, message);
    return 1;
  }

  async subscribe(channel: string): Promise<void> {
    // No-op for mock
  }
}

export class RedisManager {
  private events: Map<string, Function[]> = new Map();
  private client: MockRedis;
  private subscriber: MockRedis;
  private isConnected: boolean = true;

  constructor() {
    this.client = new MockRedis();
    this.subscriber = new MockRedis();

    // Mock connection events
    this.subscriber.on('message', (channel: string, message: string) => {
      this.emit('message', channel, message);
    });
  }

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

  // Key-Value Operations
  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const data = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.set(key, data, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, data);
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  // Queue Operations
  async pushQueue(queueName: string, item: any): Promise<void> {
    const data = JSON.stringify(item);
    await this.client.rpush(queueName, data);
  }

  async popQueue<T>(queueName: string): Promise<T | null> {
    const data = await this.client.lpop(queueName);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  // Pub/Sub
  async publish(channel: string, message: any): Promise<void> {
    const data = typeof message === 'string' ? message : JSON.stringify(message);
    await this.client.publish(channel, data);
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.on('message', (ch: string, msg: string) => {
      if (ch === channel) {
        try {
          callback(JSON.parse(msg));
        } catch {
          callback(msg);
        }
      }
    });
  }
}

export const redisManager = new RedisManager();
