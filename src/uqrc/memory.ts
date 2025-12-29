import { Vector } from "./operators";

export interface MemoryEntry {
  input: string;
  output: string;
  u: Vector;
  feedback?: number;
  timestamp: number;
}

export class MemoryStore {
  private entries: MemoryEntry[] = [];

  constructor(initialEntries: MemoryEntry[] = []) {
    this.entries = [...initialEntries];
  }

  addEntry(entry: MemoryEntry): void {
    this.entries.push(entry);
  }

  updateFeedback(timestamp: number, feedback: number): void {
    const entry = this.entries.find((item) => item.timestamp === timestamp);
    if (entry) {
      entry.feedback = feedback;
    }
  }

  list(): MemoryEntry[] {
    return [...this.entries];
  }

  latestState(): Vector | null {
    if (this.entries.length === 0) {
      return null;
    }

    return this.entries[this.entries.length - 1]?.u ?? null;
  }

  latestSeed(): number {
    const latest = this.entries[this.entries.length - 1];
    if (!latest) {
      return 0;
    }

    return latest.u.reduce((sum, value) => sum + value, 0);
  }

  toJSON(): MemoryEntry[] {
    return this.list();
  }
}

export const createBrowserMemoryStore = (key = "uqrc-memory"): MemoryStore => {
  if (typeof window === "undefined") {
    return new MemoryStore();
  }

  const raw = window.localStorage.getItem(key);
  const entries: MemoryEntry[] = raw ? JSON.parse(raw) : [];
  const store = new MemoryStore(entries);

  const persist = () => {
    window.localStorage.setItem(key, JSON.stringify(store.toJSON()));
  };

  const originalAdd = store.addEntry.bind(store);
  store.addEntry = (entry: MemoryEntry) => {
    originalAdd(entry);
    persist();
  };

  return store;
};
