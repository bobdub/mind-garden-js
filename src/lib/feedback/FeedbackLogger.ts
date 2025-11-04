import type { ChatMessage } from '@/types/chat';

export type FeedbackKind = 'thumbs_up' | 'thumbs_down' | 'issue';

export interface FeedbackEvent {
  id: string;
  messageId: string;
  messageContent: string;
  type: FeedbackKind;
  timestamp: number;
  comment?: string;
  metadata?: Record<string, unknown>;
}

const STORAGE_KEY = 'docs/feedback/log';

const generateId = () =>
  (typeof globalThis !== 'undefined' && globalThis.crypto && 'randomUUID' in globalThis.crypto
    ? globalThis.crypto.randomUUID()
    : `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

class FeedbackStore {
  private static readLocal(): FeedbackEvent[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as FeedbackEvent[]) : [];
    } catch (error) {
      console.warn('[feedback] failed to parse stored feedback events', error);
      return [];
    }
  }

  private static writeLocal(events: FeedbackEvent[]): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (error) {
      console.warn('[feedback] failed to persist feedback locally', error);
    }
  }

  private static async persistRemote(event: FeedbackEvent): Promise<void> {
    const endpoint = import.meta.env.VITE_FEEDBACK_ENDPOINT || import.meta.env.VITE_FEEDBACK_API;
    if (!endpoint) {
      return;
    }

    try {
      if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
        const payload = JSON.stringify(event);
        navigator.sendBeacon(endpoint, payload);
        return;
      }

      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event),
        keepalive: true
      });
    } catch (error) {
      console.warn('[feedback] failed to persist feedback remotely', error);
    }
  }

  static async persist(event: FeedbackEvent): Promise<void> {
    const events = FeedbackStore.readLocal();
    events.push(event);
    FeedbackStore.writeLocal(events);
    await FeedbackStore.persistRemote(event);
  }
}

export class FeedbackLogger {
  static async log(
    message: Pick<ChatMessage, 'id' | 'content'>,
    kind: FeedbackKind,
    options: { comment?: string; metadata?: Record<string, unknown> } = {}
  ): Promise<FeedbackEvent> {
    const event: FeedbackEvent = {
      id: generateId(),
      messageId: message.id,
      messageContent: message.content,
      type: kind,
      timestamp: Date.now(),
      ...options
    };

    console.info('[feedback] captured event', event);
    await FeedbackStore.persist(event);
    return event;
  }
}
