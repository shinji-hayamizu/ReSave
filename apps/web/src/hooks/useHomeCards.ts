'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  createCard,
  deleteCard,
  getHomeCards,
  getHomeDueCards,
  getHomeDueCount,
  getHomeLearningCards,
  resetCardToUnlearned,
  updateCard,
} from '@/actions/cards';
import { submitAssessment } from '@/actions/study';
import { cardKeys } from '@/hooks/useCards';
import { homeCardKeys } from '@/lib/query-keys';
import { DEFAULT_INTERVALS } from '@/types/review-schedule';
import type {
  Card,
  CardWithTags,
  CreateCardInput,
  HomeCardsData,
  HomeCardsPage,
  UpdateCardInput,
} from '@/types/card';
import type { SubmitAssessmentInput } from '@/types/study-log';

export { homeCardKeys };

// getHomeCards (旧API) を使う互換フック - completedページ等で使用
export function useHomeCards() {
  return useQuery<HomeCardsData>({
    queryKey: homeCardKeys.all,
    queryFn: () => getHomeCards(),
    staleTime: 5 * 60 * 1000,
  });
}

const HOME_PAGE_SIZE = 10;

type TabKey = 'due' | 'learning';

export type HomeCardMutationContext = {
  previousDue: InfiniteData<HomeCardsPage> | undefined;
  previousLearning: InfiniteData<HomeCardsPage> | undefined;
};

function updateCardInInfiniteData(
  data: InfiniteData<HomeCardsPage>,
  cardId: string,
  updater: (card: CardWithTags) => CardWithTags,
): InfiniteData<HomeCardsPage> {
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      cards: page.cards.map((c) => (c.id === cardId ? updater(c) : c)),
    })),
  };
}

function removeCardFromInfiniteData(
  data: InfiniteData<HomeCardsPage>,
  cardId: string,
): InfiniteData<HomeCardsPage> {
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      cards: page.cards.filter((c) => c.id !== cardId),
      todayStudiedCardIds: page.todayStudiedCardIds.filter((id) => id !== cardId),
      pagination: {
        ...page.pagination,
        total: Math.max(0, page.pagination.total - 1),
      },
    })),
  };
}

function prependCardToInfiniteData(
  data: InfiniteData<HomeCardsPage>,
  card: CardWithTags,
): InfiniteData<HomeCardsPage> {
  if (data.pages.length === 0) return data;
  const firstPage = data.pages[0];
  return {
    ...data,
    pages: [
      {
        ...firstPage,
        cards: [card, ...firstPage.cards],
        pagination: {
          ...firstPage.pagination,
          total: firstPage.pagination.total + 1,
        },
      },
      ...data.pages.slice(1).map((page) => ({
        ...page,
        pagination: {
          ...page.pagination,
          total: page.pagination.total + 1,
        },
      })),
    ],
  };
}

function addStudiedCardId(
  data: InfiniteData<HomeCardsPage>,
  cardId: string,
): InfiniteData<HomeCardsPage> {
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      todayStudiedCardIds: page.todayStudiedCardIds.includes(cardId)
        ? page.todayStudiedCardIds
        : [...page.todayStudiedCardIds, cardId],
    })),
  };
}

function saveBothTabs(qc: ReturnType<typeof useQueryClient>): HomeCardMutationContext {
  return {
    previousDue: qc.getQueryData<InfiniteData<HomeCardsPage>>(homeCardKeys.tab('due')),
    previousLearning: qc.getQueryData<InfiniteData<HomeCardsPage>>(homeCardKeys.tab('learning')),
  };
}

function restoreBothTabs(qc: ReturnType<typeof useQueryClient>, context: HomeCardMutationContext) {
  if (context.previousDue) {
    qc.setQueryData(homeCardKeys.tab('due'), context.previousDue);
  }
  if (context.previousLearning) {
    qc.setQueryData(homeCardKeys.tab('learning'), context.previousLearning);
  }
}

function getTotalFromInfiniteData(data: InfiniteData<HomeCardsPage> | undefined): number {
  if (!data || data.pages.length === 0) return 0;
  return data.pages[0].pagination.total;
}

export { getTotalFromInfiniteData };

export function useHomeDueCount() {
  return useQuery<number>({
    queryKey: homeCardKeys.dueCount(),
    queryFn: getHomeDueCount,
    staleTime: 5 * 60 * 1000,
  });
}

export function useHomeDueCards(options?: { enabled?: boolean }) {
  return useInfiniteQuery<HomeCardsPage>({
    queryKey: homeCardKeys.tab('due'),
    queryFn: ({ pageParam }) =>
      getHomeDueCards({ limit: HOME_PAGE_SIZE, offset: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore
        ? lastPage.pagination.offset + lastPage.pagination.limit
        : undefined,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}

export function useHomeLearningCards() {
  return useInfiniteQuery<HomeCardsPage>({
    queryKey: homeCardKeys.tab('learning'),
    queryFn: ({ pageParam }) =>
      getHomeLearningCards({ limit: HOME_PAGE_SIZE, offset: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore
        ? lastPage.pagination.offset + lastPage.pagination.limit
        : undefined,
    staleTime: 5 * 60 * 1000,
  });
}

export function useHomeCreateCard() {
  const qc = useQueryClient();
  return useMutation<Card, Error, CreateCardInput, HomeCardMutationContext>({
    mutationFn: (input: CreateCardInput) => createCard(input),
    onMutate: async (input) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: homeCardKeys.tab('due') }),
        qc.cancelQueries({ queryKey: homeCardKeys.tab('learning') }),
      ]);
      const context = saveBothTabs(qc);

      const optimisticCard: CardWithTags = {
        id: `temp-${Date.now()}`,
        front: input.front,
        back: input.back ?? '',
        sourceUrl: input.sourceUrl ?? null,
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

      qc.setQueryData<InfiniteData<HomeCardsPage>>(homeCardKeys.tab('due'), (old) => {
        if (!old) return old;
        return prependCardToInfiniteData(old, optimisticCard);
      });

      return context;
    },
    onError: (_, __, context) => {
      if (context) {
        restoreBothTabs(qc, context);
      }
      toast.error('カードの作成に失敗しました');
    },
    onSuccess: (newCard) => {
      qc.setQueryData<InfiniteData<HomeCardsPage>>(homeCardKeys.tab('due'), (old) => {
        if (!old) return old;
        return updateCardInInfiniteData(old, old.pages[0]?.cards.find((c) => c.id.startsWith('temp-'))?.id ?? '', () => ({
          ...newCard,
          tags: [],
          status: newCard.status as CardWithTags['status'],
        }));
      });
    },
  });
}

export function useHomeUpdateCard() {
  const qc = useQueryClient();
  return useMutation<Card, Error, { id: string; input: UpdateCardInput }, HomeCardMutationContext>({
    mutationFn: ({ id, input }) => updateCard(id, input),
    onMutate: async ({ id, input }) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: homeCardKeys.tab('due') }),
        qc.cancelQueries({ queryKey: homeCardKeys.tab('learning') }),
      ]);
      const context = saveBothTabs(qc);

      const tabs: TabKey[] = ['due', 'learning'];
      for (const tab of tabs) {
        qc.setQueryData<InfiniteData<HomeCardsPage>>(homeCardKeys.tab(tab), (old) => {
          if (!old) return old;
          return updateCardInInfiniteData(old, id, (c) => ({
            ...c,
            ...input,
            updatedAt: new Date().toISOString(),
          }));
        });
      }

      return context;
    },
    onError: (_, __, context) => {
      if (context) {
        restoreBothTabs(qc, context);
      }
      toast.error('カードの更新に失敗しました');
    },
    onSuccess: (updatedCard) => {
      const tabs: TabKey[] = ['due', 'learning'];
      for (const tab of tabs) {
        qc.setQueryData<InfiniteData<HomeCardsPage>>(homeCardKeys.tab(tab), (old) => {
          if (!old) return old;
          return updateCardInInfiniteData(old, updatedCard.id, (c) => ({
            ...c,
            ...updatedCard,
          }));
        });
      }
    },
  });
}

export function useHomeDeleteCard() {
  const qc = useQueryClient();
  return useMutation<void, Error, string, HomeCardMutationContext>({
    mutationFn: (id: string) => deleteCard(id),
    onMutate: async (id) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: homeCardKeys.tab('due') }),
        qc.cancelQueries({ queryKey: homeCardKeys.tab('learning') }),
      ]);
      const context = saveBothTabs(qc);

      const tabs: TabKey[] = ['due', 'learning'];
      for (const tab of tabs) {
        qc.setQueryData<InfiniteData<HomeCardsPage>>(homeCardKeys.tab(tab), (old) => {
          if (!old) return old;
          return removeCardFromInfiniteData(old, id);
        });
      }

      return context;
    },
    onError: (_, __, context) => {
      if (context) {
        restoreBothTabs(qc, context);
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
      await Promise.all([
        qc.cancelQueries({ queryKey: homeCardKeys.tab('due') }),
        qc.cancelQueries({ queryKey: homeCardKeys.tab('learning') }),
        qc.cancelQueries({ queryKey: cardKeys.todayCompleted() }),
      ]);
      const context = saveBothTabs(qc);

      const nowStr = new Date().toISOString();
      const resetCard: CardWithTags = {
        ...card,
        currentStep: 0,
        status: 'new' as const,
        nextReviewAt: null,
        completedAt: null,
        createdAt: nowStr,
        updatedAt: nowStr,
      };

      qc.setQueryData<InfiniteData<HomeCardsPage>>(homeCardKeys.tab('due'), (old) => {
        if (!old) return old;
        return prependCardToInfiniteData(old, resetCard);
      });

      qc.setQueryData<CardWithTags[]>(cardKeys.todayCompleted(), (old) => {
        if (!old) return old;
        return old.filter((c) => c.id !== id);
      });

      return context;
    },
    onError: (_, __, context) => {
      if (context) {
        restoreBothTabs(qc, context);
      }
      toast.error('カードのリセットに失敗しました');
    },
    onSuccess: (updatedCard) => {
      qc.setQueryData<InfiniteData<HomeCardsPage>>(homeCardKeys.tab('due'), (old) => {
        if (!old) return old;
        return updateCardInInfiniteData(old, updatedCard.id, (c) => ({
          ...c,
          ...updatedCard,
          status: updatedCard.status as CardWithTags['status'],
        }));
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: homeCardKeys.tab('due') });
      qc.invalidateQueries({ queryKey: homeCardKeys.tab('learning') });
      qc.invalidateQueries({ queryKey: cardKeys.todayCompleted() });
      qc.invalidateQueries({ queryKey: homeCardKeys.tab('completed') });
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
      await Promise.all([
        qc.cancelQueries({ queryKey: homeCardKeys.tab('due') }),
        qc.cancelQueries({ queryKey: homeCardKeys.tab('learning') }),
      ]);
      const context = saveBothTabs(qc);

      const tabs: TabKey[] = ['due', 'learning'];
      for (const tab of tabs) {
        qc.setQueryData<InfiniteData<HomeCardsPage>>(homeCardKeys.tab(tab), (old) => {
          if (!old) return old;

          let updated = updateCardInInfiniteData(old, input.cardId, (c) => {
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

          updated = addStudiedCardId(updated, input.cardId);
          return updated;
        });
      }

      return context;
    },
    onError: (_, __, context) => {
      if (context) {
        restoreBothTabs(qc, context);
      }
      toast.error('評価の記録に失敗しました');
    },
    onSuccess: ({ card: updatedCard }) => {
      const tabs: TabKey[] = ['due', 'learning'];
      for (const tab of tabs) {
        qc.setQueryData<InfiniteData<HomeCardsPage>>(homeCardKeys.tab(tab), (old) => {
          if (!old) return old;
          return updateCardInInfiniteData(old, updatedCard.id, (c) => ({
            ...c,
            ...updatedCard,
          }));
        });
      }
      qc.invalidateQueries({ queryKey: cardKeys.todayCompleted() });
      qc.invalidateQueries({ queryKey: homeCardKeys.tab('completed') });
    },
  });
}
