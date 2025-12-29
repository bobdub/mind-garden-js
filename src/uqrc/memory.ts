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

  let entries: MemoryEntry[] = [];
  let canPersist = false;
  try {
    const raw = window.localStorage?.getItem(key);
    entries = raw ? JSON.parse(raw) : [];
    canPersist = true;
  } catch (error) {
    console.warn("[uqrc] failed to read persisted memory", error);
  }
  const store = new MemoryStore(entries);

  if (!canPersist) {
    return store;
  }

  const persist = () => {
    try {
      window.localStorage?.setItem(key, JSON.stringify(store.toJSON()));
    } catch (error) {
      console.warn("[uqrc] failed to persist memory", error);
    }
  };

  const originalAdd = store.addEntry.bind(store);
  store.addEntry = (entry: MemoryEntry) => {
    originalAdd(entry);
    persist();
  };

  return store;
};
