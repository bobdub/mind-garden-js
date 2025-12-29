import { canUseLocalStorage, getLocalStorage } from '../storage/storageAvailability';

export class LocalMemory<TValue = unknown> {
  private readonly namespace: string;

  constructor(namespace: string = "LLM_Memory") {
    this.namespace = namespace;
  }

  private canUseStorage(): boolean {
    return canUseLocalStorage();
  }

  remember(key: string, value: TValue): void {
    try {
      if (!this.canUseStorage()) {
        return;
      }
      const storage = getLocalStorage();
      if (!storage) {
        return;
      }
      storage.setItem(`${this.namespace}_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  }

  recall(key: string): TValue | null {
    try {
      if (!this.canUseStorage()) {
        return null;
      }
      const storage = getLocalStorage();
      if (!storage) {
        return null;
      }
      const item = storage.getItem(`${this.namespace}_${key}`);
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
      const storage = getLocalStorage();
      if (!storage) {
        return;
      }
      storage.removeItem(`${this.namespace}_${key}`);
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
      const storage = getLocalStorage();
      if (!storage) {
        return keys;
      }
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
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
