export class LocalMemory<TValue = unknown> {
  private readonly namespace: string;

  constructor(namespace: string = "LLM_Memory") {
    this.namespace = namespace;
  }

  private canUseStorage(): boolean {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return false;
    }
    try {
      const probeKey = `${this.namespace}_probe`;
      window.localStorage.setItem(probeKey, '1');
      window.localStorage.removeItem(probeKey);
      return true;
    } catch (error) {
      console.warn("LocalStorage is not available:", error);
      return false;
    }
  }

  remember(key: string, value: TValue): void {
    try {
      if (!this.canUseStorage()) {
        return;
      }
      localStorage.setItem(`${this.namespace}_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  }

  recall(key: string): TValue | null {
    try {
      if (!this.canUseStorage()) {
        return null;
      }
      const item = localStorage.getItem(`${this.namespace}_${key}`);
      return item ? (JSON.parse(item) as TValue) : null;
    } catch (error) {
      console.error("Failed to recall from localStorage:", error);
      return null;
    }
  }

  forget(key: string): void {
    try {
      if (!this.canUseStorage()) {
        return;
      }
      localStorage.removeItem(`${this.namespace}_${key}`);
    } catch (error) {
      console.error("Failed to remove localStorage item:", error);
    }
  }

  listKeys(): string[] {
    const keys: string[] = [];
    try {
      if (!this.canUseStorage()) {
        return keys;
      }
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.namespace)) {
          keys.push(key.replace(`${this.namespace}_`, ""));
        }
      }
    } catch (error) {
      console.error("Failed to list localStorage keys:", error);
    }
    return keys;
  }

  clear(): void {
    const keys = this.listKeys();
    keys.forEach(key => this.forget(key));
  }
}
