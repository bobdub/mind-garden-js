import { useEffect, useMemo, useState } from 'react';
import { Target, Sparkles, BookMarked, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AdaptiveLessonLoader } from '@/lib/content/AdaptiveLessonLoader';
import { useLearnerProfile } from '@/hooks/useLearnerProfile';
import type { LessonRecommendation, LessonLevel, LessonContent } from '@/types/learning';

const loader = new AdaptiveLessonLoader();

const formatOptions: Array<{ label: string; value: LessonContent['format'] }> = [
  { label: 'Mini lesson', value: 'mini-lesson' },
  { label: 'Workshop', value: 'workshop' },
  { label: 'Challenge', value: 'challenge' },
  { label: 'Reference', value: 'reference' }
];

const levelOptions: Array<{ label: string; value: LessonLevel }> = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' }
];

export const LearningGoalsPanel = () => {
  const { profile, updateProfile, upsertGoal, removeGoal } = useLearnerProfile();
  const [interestInput, setInterestInput] = useState(profile.interests.join(', '));
  const [goalTitle, setGoalTitle] = useState('');
  const [goalFocusAreas, setGoalFocusAreas] = useState('');
  const [goalOutcome, setGoalOutcome] = useState('');
  const [recommendations, setRecommendations] = useState<LessonRecommendation[]>([]);

  useEffect(() => {
    setInterestInput(profile.interests.join(', '));
  }, [profile.interests]);

  const refreshRecommendations = useMemo(
    () => () => {
      const next = loader.recommend(profile, { limit: 3, minimumScore: 0.2 });
      setRecommendations(next);
    },
    [profile]
  );

  useEffect(() => {
    refreshRecommendations();
  }, [refreshRecommendations]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleFeedbackEvent: EventListener = () => {
      refreshRecommendations();
    };

    window.addEventListener('feedback:log-updated', handleFeedbackEvent);
    window.addEventListener('storage', handleFeedbackEvent);

    return () => {
      window.removeEventListener('feedback:log-updated', handleFeedbackEvent);
      window.removeEventListener('storage', handleFeedbackEvent);
    };
  }, [refreshRecommendations]);

  const handleSkillLevelChange = (value: LessonLevel) => {
    updateProfile({ skillLevel: value });
  };

  const handleFormatToggle = (format: LessonContent['format']) => {
    const current = new Set(profile.preferredFormats);
    if (current.has(format)) {
      current.delete(format);
    } else {
      current.add(format);
    }
    updateProfile({ preferredFormats: Array.from(current) });
  };

  const handleInterestBlur = () => {
    const parsed = interestInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    updateProfile({ interests: parsed });
  };

  const handleAddGoal = () => {
    if (!goalTitle.trim()) {
      return;
    }

    const focusAreas = goalFocusAreas
      .split(',')
      .map((area) => area.trim())
      .filter(Boolean);

    upsertGoal({
      title: goalTitle.trim(),
      focusAreas,
      desiredOutcome: goalOutcome.trim() || undefined,
      targetLevel: profile.skillLevel
    });

    setGoalTitle('');
    setGoalFocusAreas('');
    setGoalOutcome('');
  };

  return (
    <Card className="p-6 bg-card shadow-card space-y-6">
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Learning goals</h2>
      </div>

      <section className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="skill-level">Current skill level</Label>
            <Select value={profile.skillLevel} onValueChange={handleSkillLevelChange}>
              <SelectTrigger id="skill-level" className="bg-input">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {levelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interests">Focus interests</Label>
            <Input
              id="interests"
              value={interestInput}
              onChange={(event) => setInterestInput(event.target.value)}
              onBlur={handleInterestBlur}
              placeholder="prompting, analytics, ethics"
              className="bg-input"
            />
            <p className="text-xs text-muted-foreground">
              Separate each interest with a comma. Recommendations adapt instantly.
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Preferred formats</p>
          <div className="flex flex-wrap gap-2">
            {formatOptions.map((option) => {
              const isActive = profile.preferredFormats.includes(option.value);
              return (
                <Button
                  key={option.value}
                  type="button"
                  variant={isActive ? 'default' : 'outline'}
                  className={`h-9 ${isActive ? 'shadow-glow' : ''}`}
                  onClick={() => handleFormatToggle(option.value)}
                >
                  {option.label}
                </Button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-warning" />
          <h3 className="font-semibold text-base">Add a new goal</h3>
        </div>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="goal-title">Goal title</Label>
            <Input
              id="goal-title"
              value={goalTitle}
              onChange={(event) => setGoalTitle(event.target.value)}
              placeholder="Design a safer prompt review ritual"
              className="bg-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-focus">Focus areas</Label>
            <Input
              id="goal-focus"
              value={goalFocusAreas}
              onChange={(event) => setGoalFocusAreas(event.target.value)}
              placeholder="safety, analytics"
              className="bg-input"
            />
            <p className="text-xs text-muted-foreground">Comma separated list that maps to lesson tags.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-outcome">Desired outcome</Label>
            <Textarea
              id="goal-outcome"
              value={goalOutcome}
              onChange={(event) => setGoalOutcome(event.target.value)}
              placeholder="By Friday, run a retro on last week's feedback and plan two experiments."
              className="bg-input"
              rows={3}
            />
          </div>
          <Button type="button" className="w-full" onClick={handleAddGoal}>
            Save goal
          </Button>
        </div>

        {profile.goals.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Active goals</h4>
            <div className="space-y-2">
              {profile.goals.map((goal) => (
                <div key={goal.id} className="border border-border rounded-lg p-3 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{goal.title}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {goal.focusAreas.map((focus) => (
                          <Badge key={focus} variant="secondary" className="text-xs">
                            {focus}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeGoal(goal.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {goal.desiredOutcome && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{goal.desiredOutcome}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-success" />
          <h3 className="font-semibold text-base">Recommended for you</h3>
        </div>

        {recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add interests or goals to see curated lessons.</p>
        ) : (
          <div className="space-y-3">
            {recommendations.map((recommendation) => (
              <div key={recommendation.lesson.id} className="glass-card rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">{recommendation.lesson.title}</p>
                    <p className="text-xs text-muted-foreground">{recommendation.lesson.summary}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {(recommendation.score * 100).toFixed(0)}% fit
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {recommendation.lesson.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                  {recommendation.reasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </Card>
  );
};
