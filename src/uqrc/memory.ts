import { Vector } from "./operators";
import { canUseLocalStorage, getLocalStorage } from "../lib/storage/storageAvailability";

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
  const storage = getLocalStorage();
  if (!storage) {
    return new MemoryStore();
  }

  const isFiniteNumber = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value);
  const isVector = (value: unknown): value is Vector =>
    Array.isArray(value) && value.every(isFiniteNumber);
  const normalizeEntry = (value: unknown): MemoryEntry | null => {
    if (!value || typeof value !== "object") {
      return null;
    }
    const entry = value as Partial<MemoryEntry>;
    if (
      typeof entry.input !== "string" ||
      typeof entry.output !== "string" ||
      !isVector(entry.u) ||
      !isFiniteNumber(entry.timestamp)
    ) {
      return null;
    }
    return {
      input: entry.input,
      output: entry.output,
      u: entry.u,
      feedback: isFiniteNumber(entry.feedback) ? entry.feedback : undefined,
      timestamp: entry.timestamp,
    };
  };

  let entries: MemoryEntry[] = [];
  let canPersist = false;
  try {
    if (!canUseLocalStorage()) {
      return new MemoryStore();
    }
    const raw = storage.getItem(key);
    canPersist = true;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        entries = parsed.map(normalizeEntry).filter(Boolean) as MemoryEntry[];
      } else {
        console.warn("[uqrc] persisted memory was invalid, clearing", parsed);
        storage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn("[uqrc] failed to read persisted memory", error);
    canPersist = false;
  }
  const store = new MemoryStore(entries);

  if (!canPersist) {
    return store;
  }

  const persist = () => {
    try {
      if (!canPersist) {
        return;
      }
      storage.setItem(key, JSON.stringify(store.toJSON()));
    } catch (error) {
      console.warn("[uqrc] failed to persist memory", error);
      canPersist = false;
    }
  };

  if (entries.length > 0) {
    persist();
  }

  const originalAdd = store.addEntry.bind(store);
  store.addEntry = (entry: MemoryEntry) => {
    originalAdd(entry);
    persist();
  };

  return store;
};
