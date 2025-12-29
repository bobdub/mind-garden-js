import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LearnerProfile, LearningGoal } from '@/types/learning';

const STORAGE_KEY = 'learning/profile';

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const DEFAULT_PROFILE: LearnerProfile = {
  id: 'local-default',
  name: 'Explorer',
  skillLevel: 'beginner',
  interests: ['prompting'],
  preferredFormats: ['mini-lesson', 'workshop'],
  goals: []
};

export const useLearnerProfile = () => {
  const [profile, setProfile] = useState<LearnerProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as LearnerProfile;
      if (parsed && typeof parsed === 'object') {
        setProfile({ ...DEFAULT_PROFILE, ...parsed });
      }
    } catch (error) {
      console.warn('[learner-profile] failed to read stored profile', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.warn('[learner-profile] failed to persist profile', error);
    }
  }, [profile]);

  const updateProfile = useCallback((updates: Partial<LearnerProfile>) => {
    setProfile((current) => ({
      ...current,
      ...updates,
      interests: updates.interests ?? current.interests,
      preferredFormats: updates.preferredFormats ?? current.preferredFormats
    }));
  }, []);

  const upsertGoal = useCallback((goal: Partial<LearningGoal>) => {
    setProfile((current) => {
      const id = goal.id ?? generateId();
      const existingIndex = current.goals.findIndex((item) => item.id === id);
      const nextGoal: LearningGoal = {
        id,
        title: goal.title ?? 'Untitled goal',
        focusAreas: goal.focusAreas ?? [],
        desiredOutcome: goal.desiredOutcome,
        targetLevel: goal.targetLevel ?? current.skillLevel,
        createdAt: goal.createdAt ?? Date.now()
      };

      if (existingIndex >= 0) {
        const nextGoals = [...current.goals];
        nextGoals[existingIndex] = { ...nextGoals[existingIndex], ...nextGoal };
        return { ...current, goals: nextGoals };
      }

      return { ...current, goals: [...current.goals, nextGoal] };
    });
  }, []);

  const removeGoal = useCallback((id: string) => {
    setProfile((current) => ({
      ...current,
      goals: current.goals.filter((goal) => goal.id !== id)
    }));
  }, []);

  const value = useMemo(
    () => ({ profile, setProfile, updateProfile, upsertGoal, removeGoal }),
    [profile, updateProfile, upsertGoal, removeGoal]
  );

  return value;
};
