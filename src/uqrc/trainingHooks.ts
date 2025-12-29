import { canUseLocalStorage, getLocalStorage } from "../lib/storage/storageAvailability";

export interface TrainingHook {
  message: string;
  reply: string;
  incurSentence: string;
  createdAt: number;
}

export class TrainingHookStore {
  private hooks: TrainingHook[] = [];

  constructor(initialHooks: TrainingHook[] = []) {
    this.hooks = [...initialHooks];
  }

  addHook(hook: TrainingHook): void {
    this.hooks.push(hook);
  }

  list(): TrainingHook[] {
    return [...this.hooks];
  }

  toJSON(): TrainingHook[] {
    return this.list();
  }
}

export const createBrowserTrainingHookStore = (
  key = "uqrc-training-hooks"
): TrainingHookStore => {
  if (typeof window === "undefined") {
    return new TrainingHookStore();
  }
  const storage = getLocalStorage();
  if (!storage) {
    return new TrainingHookStore();
  }

  const normalizeHook = (value: unknown): TrainingHook | null => {
    if (!value || typeof value !== "object") {
      return null;
    }
    const hook = value as Partial<TrainingHook>;
    if (
      typeof hook.message !== "string" ||
      typeof hook.reply !== "string" ||
      typeof hook.incurSentence !== "string" ||
      typeof hook.createdAt !== "number" ||
      !Number.isFinite(hook.createdAt)
    ) {
      return null;
    }
    return {
      message: hook.message,
      reply: hook.reply,
      incurSentence: hook.incurSentence,
      createdAt: hook.createdAt,
    };
  };

  let hooks: TrainingHook[] = [];
  let canPersist = false;
  try {
    if (!canUseLocalStorage()) {
      return new TrainingHookStore();
    }
    const raw = storage.getItem(key);
    canPersist = true;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        hooks = parsed.map(normalizeHook).filter(Boolean) as TrainingHook[];
      } else {
        console.warn("[uqrc] persisted training hooks were invalid, clearing", parsed);
        storage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn("[uqrc] failed to read persisted training hooks", error);
    canPersist = false;
  }

  const store = new TrainingHookStore(hooks);

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
      console.warn("[uqrc] failed to persist training hooks", error);
      canPersist = false;
    }
  };

  if (hooks.length > 0) {
    persist();
  }

  const originalAdd = store.addHook.bind(store);
  store.addHook = (hook: TrainingHook) => {
    originalAdd(hook);
    persist();
  };

  return store;
};
