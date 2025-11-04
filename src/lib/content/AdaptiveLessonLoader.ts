import { LESSONS } from '@/content/lessons';
import { FeedbackInsights } from '@/lib/feedback/FeedbackInsights';
import type {
  LearnerProfile,
  LessonContent,
  LessonRecommendation,
  LearningGoal
} from '@/types/learning';

interface RecommendationOptions {
  limit?: number;
  minimumScore?: number;
}

const LEVEL_WEIGHTS: Record<LearnerProfile['skillLevel'], Record<LessonContent['level'], number>> = {
  beginner: { beginner: 1, intermediate: 0.6, advanced: 0.2 },
  intermediate: { beginner: 0.4, intermediate: 1, advanced: 0.7 },
  advanced: { beginner: 0.2, intermediate: 0.7, advanced: 1 }
};

const NORMALISE = (value: number) => Math.max(0, Math.min(1, value));

const toSet = (values: string[]): Set<string> => new Set(values.map((value) => value.toLowerCase().trim()).filter(Boolean));

export class AdaptiveLessonLoader {
  constructor(private lessons: LessonContent[] = LESSONS) {}

  recommend(profile: LearnerProfile, options: RecommendationOptions = {}): LessonRecommendation[] {
    const { limit = 3, minimumScore = 0.2 } = options;
    const interestSet = toSet(profile.interests);
    const preferredFormats = new Set(profile.preferredFormats);
    const goalFocus = this.collectGoalFocus(profile.goals);
    const feedbackBoosts = new Map<string, number>();

    for (const lesson of this.lessons) {
      feedbackBoosts.set(lesson.id, FeedbackInsights.scoreLessonByFeedback(lesson));
    }

    const recommendations = this.lessons
      .map((lesson) => {
        const reasons: string[] = [];
        const matchedGoals = this.matchGoalsToLesson(profile.goals, lesson);

        const interestMatches = lesson.tags.filter((tag) => interestSet.has(tag.toLowerCase()));
        const interestScore = NORMALISE(interestMatches.length / Math.max(lesson.tags.length, 1));
        if (interestMatches.length) {
          reasons.push(`Matches your interests in ${interestMatches.join(', ')}`);
        }

        const goalMatches = lesson.tags.filter((tag) => goalFocus.has(tag.toLowerCase()));
        const goalScore = goalMatches.length > 0 ? 0.4 + goalMatches.length * 0.1 : 0;
        if (goalMatches.length) {
          reasons.push(`Supports active goal focus areas: ${goalMatches.join(', ')}`);
        }

        const formatScore = preferredFormats.has(lesson.format) ? 0.3 : 0;
        if (formatScore) {
          reasons.push(`Delivers content in your preferred format (${lesson.format})`);
        }

        const levelScore = LEVEL_WEIGHTS[profile.skillLevel][lesson.level];
        if (levelScore >= 1) {
          reasons.push('Calibrated exactly to your current skill level');
        } else if (levelScore >= 0.7) {
          reasons.push('Offers a stretch that stays within reach of your skill level');
        }

        const feedbackScore = feedbackBoosts.get(lesson.id) ?? 0;
        if (feedbackScore > 0.1) {
          reasons.push('Learners recently rated related content positively');
        } else if (feedbackScore < -0.1) {
          reasons.push('Flagged for review based on recent feedback sentiment');
        }

        const totalScore = NORMALISE(
          levelScore * 0.35 +
            interestScore * 0.25 +
            goalScore * 0.25 +
            formatScore * 0.1 +
            feedbackScore * 0.15
        );

        return {
          lesson,
          score: totalScore,
          reasons,
          matchedGoals
        } satisfies LessonRecommendation;
      })
      .filter((recommendation) => recommendation.score >= minimumScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return recommendations;
  }

  private collectGoalFocus(goals: LearningGoal[]): Set<string> {
    const focus = new Set<string>();
    goals.forEach((goal) => {
      goal.focusAreas.forEach((area) => {
        const normalised = area.toLowerCase().trim();
        if (normalised) {
          focus.add(normalised);
        }
      });
    });
    return focus;
  }

  private matchGoalsToLesson(goals: LearningGoal[], lesson: LessonContent): string[] {
    const lessonTags = toSet(lesson.tags);
    return goals
      .filter((goal) => goal.focusAreas.some((area) => lessonTags.has(area.toLowerCase().trim())))
      .map((goal) => goal.title);
  }
}
