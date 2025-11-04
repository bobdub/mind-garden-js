export class Memory<TValue = unknown> {
  private readonly store: Map<string, TValue>;

  constructor() {
    this.store = new Map();
  }

  remember(key: string, value: TValue): void {
    this.store.set(key, value);
  }

  recall(key: string): TValue | undefined {
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
