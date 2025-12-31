import { canUseLocalStorage, getLocalStorage } from "../lib/storage/storageAvailability";

export interface MetricsEntry {
  step: number;
  timestamp: number;
  semanticDivergence: number;
  closureLatencyMs: number;
  closureHoldSteps: number;
  closureStatus: "allow" | "hold";
  closureScore: number;
  closureForced: boolean;
  attractorDistance: number;
  curvatureMagnitude: number;
  entropyGate: number;
  entropyActive: boolean;
  memoryAlignment: number;
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";

const validateEntry = (entry: MetricsEntry): boolean =>
  isFiniteNumber(entry.step) &&
  isFiniteNumber(entry.timestamp) &&
  isFiniteNumber(entry.semanticDivergence) &&
  isFiniteNumber(entry.closureLatencyMs) &&
  isFiniteNumber(entry.closureHoldSteps) &&
  (entry.closureStatus === "allow" || entry.closureStatus === "hold") &&
  isFiniteNumber(entry.closureScore) &&
  isBoolean(entry.closureForced) &&
  isFiniteNumber(entry.attractorDistance) &&
  isFiniteNumber(entry.curvatureMagnitude) &&
  isFiniteNumber(entry.entropyGate) &&
  isBoolean(entry.entropyActive) &&
  isFiniteNumber(entry.memoryAlignment);

export class MetricsStore {
  private entries: MetricsEntry[] = [];

  constructor(initialEntries: MetricsEntry[] = []) {
    this.entries = [...initialEntries];
  }

  addEntry(entry: MetricsEntry, maxEntries = 200): void {
    if (!validateEntry(entry)) {
      console.warn("[uqrc] rejected metrics entry", entry);
      return;
    }
    this.entries.push(entry);
    if (this.entries.length > maxEntries) {
      this.entries = this.entries.slice(-maxEntries);
    }
  }

  list(): MetricsEntry[] {
    return [...this.entries];
  }

  latest(): MetricsEntry | null {
    return this.entries[this.entries.length - 1] ?? null;
  }

  toJSON(): MetricsEntry[] {
    return this.list();
  }
}

export const createBrowserMetricsStore = (
  key = "uqrc-metrics",
  maxEntries = 200
): MetricsStore => {
  if (typeof window === "undefined") {
    return new MetricsStore();
  }
  const storage = getLocalStorage();
  if (!storage) {
    return new MetricsStore();
  }

  const normalizeEntry = (value: unknown): MetricsEntry | null => {
    if (!value || typeof value !== "object") {
      return null;
    }
    const entry = value as MetricsEntry;
    return validateEntry(entry) ? entry : null;
  };

  let entries: MetricsEntry[] = [];
  let canPersist = false;
  try {
    if (!canUseLocalStorage()) {
      return new MetricsStore();
    }
    const raw = storage.getItem(key);
    canPersist = true;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        entries = parsed.map(normalizeEntry).filter(Boolean) as MetricsEntry[];
      } else {
        console.warn("[uqrc] persisted metrics were invalid, clearing", parsed);
        storage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn("[uqrc] failed to read persisted metrics", error);
    canPersist = false;
  }

  const store = new MetricsStore(entries);

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
      console.warn("[uqrc] failed to persist metrics", error);
      canPersist = false;
    }
  };

  if (entries.length > 0) {
    persist();
  }

  const originalAdd = store.addEntry.bind(store);
  store.addEntry = (entry: MetricsEntry) => {
    originalAdd(entry, maxEntries);
    persist();
  };

  return store;
};
