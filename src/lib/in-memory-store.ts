// Simple In-Memory Store als Fallback (nur für Entwicklung)
class InMemoryStore {
  private store: Map<string, { value: any; expiresAt?: number }> = new Map();

  async set(key: string, value: any, ...args: any[]): Promise<void> {
    let expiresAt: number | undefined;
    
    // Unterstütze beide Syntaxen:
    // Vercel KV: set(key, value, { EX: 3600 })
    // ioredis: set(key, value, 'EX', 3600)
    if (args.length > 0) {
      if (typeof args[0] === 'object' && args[0].EX) {
        expiresAt = Date.now() + args[0].EX * 1000;
      } else if (args[0] === 'EX' && typeof args[1] === 'number') {
        expiresAt = Date.now() + args[1] * 1000;
      }
    }
    
    this.store.set(key, { value, expiresAt });
  }

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    
    return typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
  
  async ping(): Promise<string> {
    return 'PONG';
  }
}

export default InMemoryStore;
