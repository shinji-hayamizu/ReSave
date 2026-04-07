'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  createCard,
  deleteCard,
  getHomeCards,
  resetCardToUnlearned,
  updateCard,
} from '@/actions/cards';
import { submitAssessment } from '@/actions/study';
import { homeCardKeys } from '@/lib/query-keys';
import { DEFAULT_INTERVALS } from '@/types/review-schedule';
import type {
  Card,
  CardWithTags,
  CreateCardInput,
  HomeCardsData,
  UpdateCardInput,
} from '@/types/card';
import type { SubmitAssessmentInput } from '@/types/study-log';

export { homeCardKeys };

export type HomeCardMutationContext = {
  previousData: HomeCardsData | undefined;
};

export function useHomeCards() {
  return useQuery<HomeCardsData>({
    queryKey: homeCardKeys.all,
    queryFn: () => getHomeCards(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useHomeCreateCard() {
  const qc = useQueryClient();
  return useMutation<Card, Error, CreateCardInput, HomeCardMutationContext>({
    mutationFn: (input: CreateCardInput) => createCard(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: homeCardKeys.all });
      const previousData = qc.getQueryData<HomeCardsData>(homeCardKeys.all);

      const optimisticCard: CardWithTags = {
        id: `temp-${Date.now()}`,
        front: input.front,
        back: input.back ?? '',
        schedule: DEFAULT_INTERVALS,
        currentStep: 0,
        nextReviewAt: null,
        status: 'new',
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: '',
        tags: [],
      };

      qc.setQueryData<HomeCardsData>(homeCardKeys.all, (old) =>
        old
          ? { ...old, cards: [optimisticCard, ...old.cards] }
          : { cards: [optimisticCard], todayStudiedCardIds: [], fetchedAt: new Date().toISOString() }
      );

      return { previousData };
    },
    onError: (_, __, context) => {
      if (context?.previousData) {
        qc.setQueryData(homeCardKeys.all, context.previousData);
      }
      toast.error('カードの作成に失敗しました');
    },
    onSuccess: (newCard) => {
      qc.setQueryData<HomeCardsData>(homeCardKeys.all, (old) => {
        if (!old) return old;
        const cards = old.cards.map((c) =>
          c.id.startsWith('temp-') ? { ...c, ...newCard, tags: c.tags } : c
        );
        return { ...old, cards };
      });
    },
  });
}

export function useHomeUpdateCard() {
  const qc = useQueryClient();
  return useMutation<Card, Error, { id: string; input: UpdateCardInput }, HomeCardMutationContext>({
    mutationFn: ({ id, input }) => updateCard(id, input),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: homeCardKeys.all });
      const previousData = qc.getQueryData<HomeCardsData>(homeCardKeys.all);

      qc.setQueryData<HomeCardsData>(homeCardKeys.all, (old) => {
        if (!old) return old;
        const cards = old.cards.map((c) =>
          c.id === id ? { ...c, ...input, updatedAt: new Date().toISOString() } : c
        );
        return { ...old, cards };
      });

      return { previousData };
    },
    onError: (_, __, context) => {
      if (context?.previousData) {
        qc.setQueryData(homeCardKeys.all, context.previousData);
      }
      toast.error('カードの更新に失敗しました');
    },
    onSuccess: (updatedCard) => {
      qc.setQueryData<HomeCardsData>(homeCardKeys.all, (old) => {
        if (!old) return old;
        const cards = old.cards.map((c) =>
          c.id === updatedCard.id ? { ...c, ...updatedCard } : c
        );
        return { ...old, cards };
      });
    },
  });
}

export function useHomeDeleteCard() {
  const qc = useQueryClient();
  return useMutation<void, Error, string, HomeCardMutationContext>({
    mutationFn: (id: string) => deleteCard(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: homeCardKeys.all });
      const previousData = qc.getQueryData<HomeCardsData>(homeCardKeys.all);

      qc.setQueryData<HomeCardsData>(homeCardKeys.all, (old) => {
        if (!old) return old;
        return {
          ...old,
          cards: old.cards.filter((c) => c.id !== id),
          todayStudiedCardIds: old.todayStudiedCardIds.filter((cid) => cid !== id),
        };
      });

      return { previousData };
    },
    onError: (_, __, context) => {
      if (context?.previousData) {
        qc.setQueryData(homeCardKeys.all, context.previousData);
      }
      toast.error('カードの削除に失敗しました');
    },
  });
}

export function useHomeResetCard() {
  const qc = useQueryClient();
  return useMutation<Card, Error, { id: string; card: CardWithTags }, HomeCardMutationContext>({
    mutationFn: ({ id }) => resetCardToUnlearned(id),
    onMutate: async ({ id, card }) => {
      await qc.cancelQueries({ queryKey: homeCardKeys.all });
      const previousData = qc.getQueryData<HomeCardsData>(homeCardKeys.all);

      const resetCard: CardWithTags = {
        ...card,
        currentStep: 0,
        status: 'new' as const,
        nextReviewAt: null,
        completedAt: null,
        updatedAt: new Date().toISOString(),
      };

      qc.setQueryData<HomeCardsData>(homeCardKeys.all, (old) => {
        if (!old) return old;
        const exists = old.cards.some((c) => c.id === id);
        if (exists) {
          return { ...old, cards: old.cards.map((c) => c.id === id ? resetCard : c) };
        }
        return { ...old, cards: [resetCard, ...old.cards] };
      });

      return { previousData };
    },
    onError: (_, __, context) => {
      if (context?.previousData) {
        qc.setQueryData(homeCardKeys.all, context.previousData);
      }
      toast.error('カードのリセットに失敗しました');
    },
    onSuccess: (updatedCard) => {
      qc.setQueryData<HomeCardsData>(homeCardKeys.all, (old) => {
        if (!old) return old;
        const exists = old.cards.some((c) => c.id === updatedCard.id);
        if (exists) {
          const cards = old.cards.map((c) =>
            c.id === updatedCard.id ? { ...c, ...updatedCard } : c
          );
          return { ...old, cards };
        }
        return { ...old, cards: [{ ...old.cards[0], ...updatedCard } as CardWithTags, ...old.cards] };
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: homeCardKeys.all });
    },
  });
}

export function useHomeSubmitAssessment() {
  const qc = useQueryClient();
  return useMutation<{ card: Card }, Error, SubmitAssessmentInput, HomeCardMutationContext>({
    mutationFn: async (input: SubmitAssessmentInput) => {
      const result = await submitAssessment(input);
      if (!result.ok) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: homeCardKeys.all });
      const previousData = qc.getQueryData<HomeCardsData>(homeCardKeys.all);

      qc.setQueryData<HomeCardsData>(homeCardKeys.all, (old) => {
        if (!old) return old;

        const cards = old.cards.map((c) => {
          if (c.id !== input.cardId) return c;

          if (input.assessment === 'ok') {
            const newStep = c.currentStep + 1;
            if (newStep >= c.schedule.length) {
              return { ...c, currentStep: newStep, status: 'completed' as const, completedAt: new Date().toISOString(), nextReviewAt: null };
            }
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + c.schedule[newStep]);
            return { ...c, currentStep: newStep, status: 'active' as const, nextReviewAt: nextDate.toISOString() };
          }

          if (input.assessment === 'again') {
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + c.schedule[0]);
            return { ...c, currentStep: 0, status: 'active' as const, nextReviewAt: nextDate.toISOString(), completedAt: null };
          }

          if (input.assessment === 'remembered') {
            return { ...c, status: 'completed' as const, completedAt: new Date().toISOString(), nextReviewAt: null };
          }

          /* c8 ignore next */
          return c;
        });

        const todayStudiedCardIds = old.todayStudiedCardIds.includes(input.cardId)
          ? old.todayStudiedCardIds
          : [...old.todayStudiedCardIds, input.cardId];

        return { ...old, cards, todayStudiedCardIds };
      });

      return { previousData };
    },
    onError: (_, __, context) => {
      if (context?.previousData) {
        qc.setQueryData(homeCardKeys.all, context.previousData);
      }
      toast.error('評価の記録に失敗しました');
    },
    onSuccess: ({ card: updatedCard }) => {
      qc.setQueryData<HomeCardsData>(homeCardKeys.all, (old) => {
        if (!old) return old;
        const cards = old.cards.map((c) =>
          c.id === updatedCard.id ? { ...c, ...updatedCard } : c
        );
        return { ...old, cards };
      });
    },
  });
}
