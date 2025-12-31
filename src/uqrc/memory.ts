import { Vector } from "./operators";
import { evaluateSemanticClosure } from "./closure";
import { canUseLocalStorage, getLocalStorage } from "../lib/storage/storageAvailability";

export interface MemoryEntry {
  input: string;
  output: string;
  u: Vector;
  feedback?: number;
  timestamp: number;
}

export interface MemoryIntegrityReport {
  ok: boolean;
  reasons: string[];
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isVector = (value: unknown): value is Vector =>
  Array.isArray(value) && value.every(isFiniteNumber);

const validateMemoryEntry = (entry: MemoryEntry): MemoryIntegrityReport => {
  const reasons: string[] = [];

  if (!entry.input.trim()) {
    reasons.push("missing_input");
  }

  if (!entry.output.trim()) {
    reasons.push("missing_output");
  }

  if (!isVector(entry.u)) {
    reasons.push("invalid_state_vector");
  }

  if (!isFiniteNumber(entry.timestamp)) {
    reasons.push("invalid_timestamp");
  }

  const closure = evaluateSemanticClosure(entry.output, { minTokens: 1 });
  if (closure.status === "hold") {
    reasons.push("closure_hold");
  }

  return {
    ok: reasons.length === 0,
    reasons,
  };
};

export class MemoryStore {
  private committedEntries: MemoryEntry[] = [];
  private workingEntries: MemoryEntry[] = [];

  constructor(initialEntries: MemoryEntry[] = []) {
    this.committedEntries = [...initialEntries];
  }

  addEntry(entry: MemoryEntry): void {
    this.commitEntry(entry);
  }

  addWorkingEntry(entry: MemoryEntry): void {
    if (!entry || !entry.input || !entry.output || !isVector(entry.u)) {
      console.warn("[uqrc] rejected working memory write", entry);
      return;
    }
    this.workingEntries.push(entry);
  }

  commitEntry(entry: MemoryEntry): boolean {
    const report = validateMemoryEntry(entry);
    if (!report.ok) {
      console.warn("[uqrc] rejected memory commit", report.reasons, entry);
      return false;
    }
    this.committedEntries.push(entry);
    return true;
  }

  updateFeedback(timestamp: number, feedback: number): void {
    const entry = this.committedEntries.find(
      (item) => item.timestamp === timestamp
    );
    if (entry) {
      entry.feedback = feedback;
    }
  }

  list(): MemoryEntry[] {
    return [...this.committedEntries];
  }

  listWorking(): MemoryEntry[] {
    return [...this.workingEntries];
  }

  clearWorking(): void {
    this.workingEntries = [];
  }

  latestState(): Vector | null {
    if (this.committedEntries.length === 0) {
      return null;
    }

    return this.committedEntries[this.committedEntries.length - 1]?.u ?? null;
  }

  latestSeed(): number {
    const latest = this.committedEntries[this.committedEntries.length - 1];
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

  const originalCommit = store.commitEntry.bind(store);
  store.commitEntry = (entry: MemoryEntry) => {
    const committed = originalCommit(entry);
    if (committed) {
      persist();
    }
    return committed;
  };
  const originalAdd = store.addEntry.bind(store);
  store.addEntry = (entry: MemoryEntry) => {
    originalAdd(entry);
  };

  return store;
};
