import { Tagger } from '@/lib/neural/Tagger';
import type { FeedbackEvent } from './FeedbackLogger';
import type { LessonContent } from '@/types/learning';

type FeedbackWeightMap = Record<FeedbackEvent['type'], number>;

const STORAGE_KEY = 'docs/feedback/log';
const WEIGHTS: FeedbackWeightMap = {
  thumbs_up: 1,
  thumbs_down: -1,
  issue: -0.5
};

export interface TagSentiment {
  tag: string;
  score: number;
  total: number;
  average: number;
}

export class FeedbackInsights {
  private static tagger = new Tagger();

  static readEvents(): FeedbackEvent[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed as FeedbackEvent[];
    } catch (error) {
      console.warn('[feedback-insights] failed to parse stored events', error);
      return [];
    }
  }

  static getTagSentiment(): Map<string, TagSentiment> {
    const events = FeedbackInsights.readEvents();
    const aggregates = new Map<string, { score: number; count: number }>();

    for (const event of events) {
      const weight = WEIGHTS[event.type] ?? 0;
      if (weight === 0) {
        continue;
      }
      const tags = FeedbackInsights.tagger.extractTags(event.messageContent ?? '');
      for (const tag of tags) {
        const current = aggregates.get(tag) ?? { score: 0, count: 0 };
        aggregates.set(tag, { score: current.score + weight, count: current.count + 1 });
      }
    }

    const sentiments = new Map<string, TagSentiment>();
    aggregates.forEach((value, key) => {
      sentiments.set(key, {
        tag: key,
        score: value.score,
        total: value.count,
        average: value.count === 0 ? 0 : value.score / value.count
      });
    });

    return sentiments;
  }

  static scoreLessonByFeedback(lesson: LessonContent): number {
    const sentiments = FeedbackInsights.getTagSentiment();
    if (!sentiments.size) {
      return 0;
    }

    const lessonTags = new Set(lesson.tags.map(tag => tag.toLowerCase()));
    let cumulativeScore = 0;
    let matches = 0;

    sentiments.forEach((sentiment, tag) => {
      const normalised = tag.toLowerCase();
      if (lessonTags.has(normalised)) {
        cumulativeScore += sentiment.average;
        matches += 1;
      }
    });

    if (matches === 0) {
      return 0;
    }

    return cumulativeScore / matches;
  }
}
