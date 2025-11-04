export type LessonLevel = 'beginner' | 'intermediate' | 'advanced';

export interface LessonActivity {
  type: 'reflection' | 'practice' | 'build' | 'explore';
  prompt: string;
  expectedOutcome?: string;
}

export interface LessonResource {
  title: string;
  type: 'article' | 'video' | 'reference' | 'sandbox' | 'tool';
  description?: string;
  url?: string;
}

export interface LessonContent {
  id: string;
  title: string;
  summary: string;
  level: LessonLevel;
  estimatedDuration: string;
  format: 'mini-lesson' | 'workshop' | 'challenge' | 'reference';
  tags: string[];
  objectives: string[];
  content: string;
  activities: LessonActivity[];
  recommendedResources: LessonResource[];
  prerequisites?: string[];
}

export interface LearningGoal {
  id: string;
  title: string;
  focusAreas: string[];
  desiredOutcome?: string;
  targetLevel: LessonLevel;
  createdAt: number;
}

export interface LearnerProfile {
  id: string;
  name?: string;
  skillLevel: LessonLevel;
  interests: string[];
  preferredFormats: Array<LessonContent['format']>;
  goals: LearningGoal[];
}

export interface LessonRecommendation {
  lesson: LessonContent;
  score: number;
  reasons: string[];
  matchedGoals: string[];
}
