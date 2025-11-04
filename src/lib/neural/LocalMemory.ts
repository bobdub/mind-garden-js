export class LocalMemory<TValue = unknown> {
  private readonly namespace: string;

  constructor(namespace: string = "LLM_Memory") {
    this.namespace = namespace;
  }

  remember(key: string, value: TValue): void {
    try {
      localStorage.setItem(`${this.namespace}_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  }

  recall(key: string): TValue | null {
    try {
      const item = localStorage.getItem(`${this.namespace}_${key}`);
      return item ? (JSON.parse(item) as TValue) : null;
    } catch (error) {
      console.error("Failed to recall from localStorage:", error);
      return null;
    }
  }

  forget(key: string): void {
    localStorage.removeItem(`${this.namespace}_${key}`);
  }

  listKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.namespace)) {
        keys.push(key.replace(`${this.namespace}_`, ""));
      }
    }
    return keys;
  }

  clear(): void {
    const keys = this.listKeys();
    keys.forEach(key => this.forget(key));
  }
}
