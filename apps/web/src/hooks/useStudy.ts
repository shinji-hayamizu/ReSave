'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getStudySession, submitAssessment } from '@/actions/study';
import type { CardWithTags } from '@/types/card';
import type { SubmitAssessmentInput, StudyStats } from '@/types/study-log';

import { cardKeys } from './useCards';

export type StudySessionData = {
  cards: Array<{
    id: string;
    front: string;
    back: string;
    currentStep: number;
    schedule: number[];
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
      const result = await submitAssessment(input);
      if (!result.ok) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: studyKeys.all });
      await qc.cancelQueries({ queryKey: cardKeys.today() });

      const previousSession = qc.getQueryData<StudySessionData>(
        studyKeys.session()
      );
      const previousToday = qc.getQueryData<CardWithTags[]>(cardKeys.today());

      if (previousSession) {
        qc.setQueryData<StudySessionData>(studyKeys.session(), {
          ...previousSession,
          cards: previousSession.cards.filter((card) => card.id !== input.cardId),
        });
      }

      if (previousToday) {
        qc.setQueryData<CardWithTags[]>(
          cardKeys.today(),
          previousToday.filter((card) => card.id !== input.cardId)
        );
      }

      return { previousSession, previousToday };
    },
    onError: (_, __, context) => {
      if (context?.previousSession) {
        qc.setQueryData(studyKeys.session(), context.previousSession);
      }
      if (context?.previousToday) {
        qc.setQueryData(cardKeys.today(), context.previousToday);
      }
      toast.error('評価の記録に失敗しました');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: studyKeys.all });
      qc.invalidateQueries({ queryKey: cardKeys.lists() });
      qc.invalidateQueries({ queryKey: cardKeys.today() });
      qc.invalidateQueries({ queryKey: cardKeys.todayCompleted() });
    },
  });
}
