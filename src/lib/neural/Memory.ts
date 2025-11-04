export class Memory {
  private store: Map<string, any>;

  constructor() {
    this.store = new Map();
  }

  remember(key: string, value: any): void {
    this.store.set(key, value);
  }

  recall(key: string): any {
    return this.store.get(key);
  }

  forget(key: string): void {
    this.store.delete(key);
  }

  list(): string[] {
    return Array.from(this.store.keys());
  }

  clear(): void {
    this.store.clear();
  }
}
