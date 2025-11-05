import { beforeEach, describe, expect, it } from 'bun:test';
import { SelfLearningLLM } from '../SelfLearningLLM';
import type { ChatMessage } from '@/types/chat';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  key(index: number): string | null;
  readonly length: number;
}

declare global {
  // eslint-disable-next-line no-var
  var localStorage: StorageLike;
}

beforeEach(() => {
  const store = new Map<string, string>();

  const storage: StorageLike = {
    getItem(key) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
    key(index) {
      const keys = Array.from(store.keys());
      return keys[index] ?? null;
    },
    get length() {
      return store.size;
    }
  };

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage
  });
});

describe('SelfLearningLLM retrieval prompt alignment', () => {
  it('retrieves learned responses even when history starts with an assistant greeting', () => {
    const llm = new SelfLearningLLM();
    llm.clearMemory();

    const trainingPrompt = 'Tell me about constellations';
    const trainingResponse = 'Constellations are recognizable star patterns.';

    llm.learnFrom(trainingPrompt, trainingResponse);

    const history: ChatMessage[] = [
      {
        id: 'assistant-1',
        role: 'assistant',
        content: 'Hello! I am here to help.',
        timestamp: Date.now()
      }
    ];

    const reply = llm.respond(trainingPrompt, history);

    expect(reply).toContain(trainingResponse);
  });

  it('derives training tags from the latest user utterance when prompts are empty but history exists', () => {
    const llm = new SelfLearningLLM();
    llm.clearMemory();

    const history: ChatMessage[] = [
      {
        id: 'assistant-2',
        role: 'assistant',
        content: 'Welcome back!',
        timestamp: Date.now() - 10
      },
      {
        id: 'user-1',
        role: 'user',
        content: 'Please remember the phases of the moon',
        timestamp: Date.now()
      }
    ];

    llm.learnFrom('   ', 'Sure, I will remember that.', history);

    const memories = llm.getMemories();
    expect(memories).toHaveLength(1);
    expect(memories[0].prompt).toBe('Please remember the phases of the moon');
    expect(memories[0].tags).toContain('phases');
    expect(memories[0].tags).toContain('moon');
    expect(memories[0].tags.some((tag) => tag.toLowerCase().includes('assistant'))).toBe(false);
  });

  it('respects configurable tag similarity thresholds when replaying learned responses', () => {
    const trainingPrompt = 'Tell me about constellations';
    const trainingResponse = 'Constellations are recognizable star patterns.';
    const similarPrompt = 'Talk about star patterns';

    const strictLLM = new SelfLearningLLM(32, 16, 32, { tagSimilarityThreshold: 0.8 });
    strictLLM.clearMemory();
    strictLLM.learnFrom(trainingPrompt, trainingResponse);

    Object.defineProperty(strictLLM, 'predict', {
      value: () => Array(32).fill(0),
    });

    Object.defineProperty(strictLLM, 'devectorize', {
      value: () => '',
    });

    const strictReply = strictLLM.respond(similarPrompt);
    expect(strictReply).not.toContain(trainingResponse);
    expect(strictReply).toContain('I appreciate you bringing up');

    const flexibleLLM = new SelfLearningLLM(32, 16, 32, { tagSimilarityThreshold: 0.2 });
    flexibleLLM.clearMemory();
    flexibleLLM.learnFrom(trainingPrompt, trainingResponse);

    const flexibleReply = flexibleLLM.respond(similarPrompt);
    expect(flexibleReply).toContain(trainingResponse);
  });

  it('falls back to a templated response when predictions lack fluency and memory is empty', () => {
    const llm = new SelfLearningLLM();
    llm.clearMemory();

    Object.defineProperty(llm, 'predict', {
      value: () => Array(32).fill(0)
    });

    Object.defineProperty(llm, 'devectorize', {
      value: () => '...'
    });

    const prompt = 'Help me plan my day';
    const reply = llm.respond(prompt, []);

    expect(reply).toContain('I appreciate you');
    expect(reply).toContain('How would you like us to explore this together?');
    expect(llm.getMemories()).toHaveLength(0);
  });
});
