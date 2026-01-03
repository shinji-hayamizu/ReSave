'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { SubmitAssessmentInput, StudyStats } from '@/types/study-log';

import { cardKeys } from './useCards';

export type StudySessionData = {
  cards: Array<{
    id: string;
    front: string;
    back: string;
    reviewLevel: number;
  }>;
  stats: StudyStats;
};

export const studyKeys = {
  all: ['study'] as const,
  session: () => [...studyKeys.all, 'session'] as const,
};

export function useStudySession() {
  return useQuery<StudySessionData>({
    queryKey: studyKeys.session(),
    queryFn: async () => {
      const { getStudySession } = await import('@/actions/study');
      const result = await getStudySession();
      if (!result.ok) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
}

export function useSubmitAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubmitAssessmentInput) => {
      const { submitAssessment } = await import('@/actions/study');
      const result = await submitAssessment(input);
      if (!result.ok) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studyKeys.all });
      qc.invalidateQueries({ queryKey: cardKeys.lists() });
      qc.invalidateQueries({ queryKey: cardKeys.today() });
    },
  });
}
