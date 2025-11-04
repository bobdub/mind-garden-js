import type { FeedbackKind } from '@/types/feedback';

type AnalyticsEventType = 'session_start' | 'lesson_completed' | 'feedback_submitted';

type SessionStartPayload = {
  source: 'app' | 'page';
  timezone?: string | null;
  locale?: string | null;
  consent: 'implied' | 'explicit';
};

type LessonCompletedPayload = {
  promptLength: number;
  responseLength: number;
  promptWordCount: number;
  responseWordCount: number;
  tagCount: number;
};

type FeedbackSubmittedPayload = {
  rating: FeedbackKind;
  messageIdSuffix: string;
  commentProvided: boolean;
  source?: string;
};

type AnalyticsPayloads = {
  session_start: SessionStartPayload;
  lesson_completed: LessonCompletedPayload;
  feedback_submitted: FeedbackSubmittedPayload;
};

type AnalyticsRecord<T extends AnalyticsEventType> = {
  id: string;
  type: T;
  timestamp: number;
  sessionId: string;
  payload: AnalyticsPayloads[T];
};

const STORAGE_KEY = 'analytics/events';
const SESSION_KEY = 'analytics/session-id';
const OPT_OUT_KEY = 'analytics:opt-out';

const isBrowser = typeof window !== 'undefined';

const createId = () =>
  (typeof globalThis !== 'undefined' && globalThis.crypto && 'randomUUID' in globalThis.crypto
    ? globalThis.crypto.randomUUID()
    : `analytics-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

const safeRead = (key: string): string | null => {
  if (!isBrowser) return null;
  try {
    return window.localStorage?.getItem(key) ?? null;
  } catch (error) {
    console.warn('[analytics] failed to read localStorage', error);
    return null;
  }
};

const safeWrite = (key: string, value: string): void => {
  if (!isBrowser) return;
  try {
    window.localStorage?.setItem(key, value);
  } catch (error) {
    console.warn('[analytics] failed to persist localStorage', error);
  }
};

const safeReadSession = (key: string): string | null => {
  if (!isBrowser) return null;
  try {
    return window.sessionStorage?.getItem(key) ?? null;
  } catch (error) {
    console.warn('[analytics] failed to read sessionStorage', error);
    return null;
  }
};

const safeWriteSession = (key: string, value: string): void => {
  if (!isBrowser) return;
  try {
    window.sessionStorage?.setItem(key, value);
  } catch (error) {
    console.warn('[analytics] failed to persist sessionStorage', error);
  }
};

const hasDoNotTrackEnabled = (): boolean => {
  if (!isBrowser || typeof navigator === 'undefined') {
    return false;
  }

  const dnt = navigator.doNotTrack || (window as unknown as { doNotTrack?: string }).doNotTrack;
  const msDnt = (navigator as unknown as { msDoNotTrack?: string }).msDoNotTrack;
  return dnt === '1' || dnt === 'yes' || msDnt === '1';
};

const hasOptedOut = (): boolean => {
  const flag = safeRead(OPT_OUT_KEY);
  return flag === '1' || flag === 'true';
};

const isDisabledByEnv = (): boolean => {
  try {
    return import.meta.env.VITE_ANALYTICS_DISABLED === 'true';
  } catch {
    return false;
  }
};

const shouldCollect = (): boolean => {
  if (!isBrowser) return false;
  if (isDisabledByEnv()) return false;
  if (hasDoNotTrackEnabled()) return false;
  if (hasOptedOut()) return false;
  return true;
};

const resolveTimezone = (): string | null => {
  if (!isBrowser || typeof Intl === 'undefined') {
    return null;
  }

  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
};

const resolveLocale = (): string | null => {
  if (!isBrowser || typeof navigator === 'undefined') {
    return null;
  }

  return navigator.language ?? null;
};

const recordToBeacon = (record: AnalyticsRecord<AnalyticsEventType>): void => {
  if (!isBrowser) return;

  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  if (!endpoint) {
    return;
  }

  try {
    const payload = JSON.stringify(record);
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      navigator.sendBeacon(endpoint, payload);
      return;
    }

    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: payload,
      keepalive: true
    }).catch((error) => {
      console.warn('[analytics] failed to send beacon', error);
    });
  } catch (error) {
    console.warn('[analytics] failed to serialise beacon payload', error);
  }
};

const persistRecord = (record: AnalyticsRecord<AnalyticsEventType>): void => {
  if (!isBrowser || !window.localStorage) {
    return;
  }

  try {
    const existing = safeRead(STORAGE_KEY);
    const events: AnalyticsRecord<AnalyticsEventType>[] = existing ? JSON.parse(existing) : [];
    events.push(record);
    const trimmed = events.slice(-100);
    safeWrite(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.warn('[analytics] failed to persist analytics record', error);
  }
};

export class AnalyticsTracker {
  private static sessionId: string | null = null;

  private static getSessionId(): string {
    if (this.sessionId) {
      return this.sessionId;
    }

    if (!isBrowser) {
      this.sessionId = 'server';
      return this.sessionId;
    }

    const stored = safeReadSession(SESSION_KEY);
    if (stored) {
      this.sessionId = stored;
      return stored;
    }

    const fresh = createId();
    this.sessionId = fresh;
    safeWriteSession(SESSION_KEY, fresh);
    return fresh;
  }

  private static buildRecord<T extends AnalyticsEventType>(
    type: T,
    payload: AnalyticsPayloads[T]
  ): AnalyticsRecord<T> {
    return {
      id: createId(),
      type,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      payload
    };
  }

  private static dispatch<T extends AnalyticsEventType>(record: AnalyticsRecord<T>): void {
    if (!shouldCollect()) {
      return;
    }

    persistRecord(record as AnalyticsRecord<AnalyticsEventType>);
    recordToBeacon(record as AnalyticsRecord<AnalyticsEventType>);
    if (typeof console !== 'undefined' && typeof console.debug === 'function') {
      console.debug('[analytics] event', record);
    }
  }

  static track<T extends AnalyticsEventType>(type: T, payload: AnalyticsPayloads[T]): void {
    const record = this.buildRecord(type, payload);
    this.dispatch(record);
  }

  static trackSessionStart(): void {
    this.track('session_start', {
      source: 'app',
      timezone: resolveTimezone(),
      locale: resolveLocale(),
      consent: hasOptedOut() ? 'explicit' : 'implied'
    });
  }

  static trackLessonCompleted(payload: LessonCompletedPayload): void {
    this.track('lesson_completed', payload);
  }

  static trackFeedbackSubmitted(payload: FeedbackSubmittedPayload): void {
    this.track('feedback_submitted', payload);
  }
}
