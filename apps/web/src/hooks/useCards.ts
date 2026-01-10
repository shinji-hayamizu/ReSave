'use client';

import type { QueryKey } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  createCard,
  deleteCard,
  getCard,
  getCards,
  getNewCards,
  getTodayCards,
  getTodayCompletedCards,
  resetCardToUnlearned,
  updateCard,
} from '@/actions/cards';
import { DEFAULT_INTERVALS } from '@/types/review-schedule';
import type {
  CardFilters,
  CardListResponse,
  CardWithTags,
  CreateCardInput,
  UpdateCardInput,
} from '@/types/card';

export const cardKeys = {
  all: ['cards'] as const,
  lists: () => [...cardKeys.all, 'list'] as const,
  list: (filters: CardFilters) => [...cardKeys.lists(), filters] as const,
  new: () => [...cardKeys.all, 'new'] as const,
  today: () => [...cardKeys.all, 'today'] as const,
  todayCompleted: () => [...cardKeys.all, 'today-completed'] as const,
  detail: (id: string) => [...cardKeys.all, 'detail', id] as const,
};

export function useCards(filters?: CardFilters) {
  return useQuery<CardListResponse>({
    queryKey: cardKeys.list(filters ?? {}),
    queryFn: () => getCards(filters),
  });
}

export function useCard(id: string) {
  return useQuery<CardWithTags>({
    queryKey: cardKeys.detail(id),
    queryFn: () => getCard(id),
    enabled: Boolean(id),
  });
}

export function useNewCards() {
  return useQuery<CardWithTags[]>({
    queryKey: cardKeys.new(),
    queryFn: () => getNewCards(),
  });
}

export function useTodayCards() {
  return useQuery<CardWithTags[]>({
    queryKey: cardKeys.today(),
    queryFn: () => getTodayCards(),
  });
}

export function useTodayCompletedCards() {
  return useQuery<CardWithTags[]>({
    queryKey: cardKeys.todayCompleted(),
    queryFn: () => getTodayCompletedCards(),
  });
}

type CreateCardContext = {
  previousLists: [QueryKey, CardListResponse | undefined][];
  previousNew: CardWithTags[] | undefined;
  previousToday: CardWithTags[] | undefined;
};

export function useCreateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCardInput) => createCard(input),
    onMutate: async (input): Promise<CreateCardContext> => {
      await qc.cancelQueries({ queryKey: cardKeys.lists() });
      await qc.cancelQueries({ queryKey: cardKeys.new() });
      await qc.cancelQueries({ queryKey: cardKeys.today() });

      const previousLists = qc.getQueriesData<CardListResponse>({
        queryKey: cardKeys.lists(),
      });
      const previousNew = qc.getQueryData<CardWithTags[]>(cardKeys.new());
      const previousToday = qc.getQueryData<CardWithTags[]>(cardKeys.today());

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

      qc.setQueriesData<CardListResponse>(
        { queryKey: cardKeys.lists() },
        (old) =>
          old
            ? {
                ...old,
                data: [optimisticCard, ...old.data],
                pagination: { ...old.pagination, total: old.pagination.total + 1 },
              }
            : old
      );

      if (previousNew) {
        qc.setQueryData<CardWithTags[]>(cardKeys.new(), [optimisticCard, ...previousNew]);
      }

      return { previousLists, previousNew, previousToday };
    },
    onError: (_, __, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          qc.setQueryData(queryKey, data);
        });
      }
      if (context?.previousNew) {
        qc.setQueryData(cardKeys.new(), context.previousNew);
      }
      if (context?.previousToday) {
        qc.setQueryData(cardKeys.today(), context.previousToday);
      }
      toast.error('カードの作成に失敗しました');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: cardKeys.lists() });
      qc.invalidateQueries({ queryKey: cardKeys.new() });
      qc.invalidateQueries({ queryKey: cardKeys.today() });
    },
  });
}

type UpdateCardContext = {
  previousLists: [QueryKey, CardListResponse | undefined][];
  previousDetail: CardWithTags | undefined;
  previousToday: CardWithTags[] | undefined;
};

export function useUpdateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCardInput }) =>
      updateCard(id, input),
    onMutate: async ({ id, input }): Promise<UpdateCardContext> => {
      await qc.cancelQueries({ queryKey: cardKeys.lists() });
      await qc.cancelQueries({ queryKey: cardKeys.detail(id) });
      await qc.cancelQueries({ queryKey: cardKeys.today() });

      const previousLists = qc.getQueriesData<CardListResponse>({
        queryKey: cardKeys.lists(),
      });
      const previousDetail = qc.getQueryData<CardWithTags>(cardKeys.detail(id));
      const previousToday = qc.getQueryData<CardWithTags[]>(cardKeys.today());

      qc.setQueriesData<CardListResponse>(
        { queryKey: cardKeys.lists() },
        (old) =>
          old
            ? {
                ...old,
                data: old.data.map((card) =>
                  card.id === id
                    ? { ...card, ...input, updatedAt: new Date().toISOString() }
                    : card
                ),
              }
            : old
      );

      if (previousDetail) {
        qc.setQueryData<CardWithTags>(cardKeys.detail(id), {
          ...previousDetail,
          ...input,
          updatedAt: new Date().toISOString(),
        });
      }

      if (previousToday) {
        qc.setQueryData<CardWithTags[]>(
          cardKeys.today(),
          previousToday.map((card) =>
            card.id === id
              ? { ...card, ...input, updatedAt: new Date().toISOString() }
              : card
          )
        );
      }

      return { previousLists, previousDetail, previousToday };
    },
    onError: (_, variables, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          qc.setQueryData(queryKey, data);
        });
      }
      if (context?.previousDetail) {
        qc.setQueryData(cardKeys.detail(variables.id), context.previousDetail);
      }
      if (context?.previousToday) {
        qc.setQueryData(cardKeys.today(), context.previousToday);
      }
      toast.error('カードの更新に失敗しました');
    },
    onSettled: (_, __, variables) => {
      qc.invalidateQueries({ queryKey: cardKeys.lists() });
      qc.invalidateQueries({ queryKey: cardKeys.detail(variables.id) });
      qc.invalidateQueries({ queryKey: cardKeys.today() });
    },
  });
}

type DeleteCardContext = {
  previousLists: [QueryKey, CardListResponse | undefined][];
  previousDetail: CardWithTags | undefined;
  previousToday: CardWithTags[] | undefined;
};

export function useDeleteCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCard(id),
    onMutate: async (id): Promise<DeleteCardContext> => {
      await qc.cancelQueries({ queryKey: cardKeys.lists() });
      await qc.cancelQueries({ queryKey: cardKeys.detail(id) });
      await qc.cancelQueries({ queryKey: cardKeys.today() });

      const previousLists = qc.getQueriesData<CardListResponse>({
        queryKey: cardKeys.lists(),
      });
      const previousDetail = qc.getQueryData<CardWithTags>(cardKeys.detail(id));
      const previousToday = qc.getQueryData<CardWithTags[]>(cardKeys.today());

      qc.setQueriesData<CardListResponse>(
        { queryKey: cardKeys.lists() },
        (old) =>
          old
            ? {
                ...old,
                data: old.data.filter((card) => card.id !== id),
                pagination: { ...old.pagination, total: old.pagination.total - 1 },
              }
            : old
      );

      qc.removeQueries({ queryKey: cardKeys.detail(id) });

      if (previousToday) {
        qc.setQueryData<CardWithTags[]>(
          cardKeys.today(),
          previousToday.filter((card) => card.id !== id)
        );
      }

      return { previousLists, previousDetail, previousToday };
    },
    onError: (_, deletedId, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          qc.setQueryData(queryKey, data);
        });
      }
      if (context?.previousDetail) {
        qc.setQueryData(cardKeys.detail(deletedId), context.previousDetail);
      }
      if (context?.previousToday) {
        qc.setQueryData(cardKeys.today(), context.previousToday);
      }
      toast.error('カードの削除に失敗しました');
    },
    onSettled: (_, __, deletedId) => {
      qc.invalidateQueries({ queryKey: cardKeys.lists() });
      qc.invalidateQueries({ queryKey: cardKeys.detail(deletedId) });
      qc.invalidateQueries({ queryKey: cardKeys.today() });
    },
  });
}

type ResetCardContext = {
  previousLists: [QueryKey, CardListResponse | undefined][];
  previousToday: CardWithTags[] | undefined;
};

export function useResetCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resetCardToUnlearned(id),
    onMutate: async (id): Promise<ResetCardContext> => {
      await qc.cancelQueries({ queryKey: cardKeys.lists() });
      await qc.cancelQueries({ queryKey: cardKeys.today() });

      const previousLists = qc.getQueriesData<CardListResponse>({
        queryKey: cardKeys.lists(),
      });
      const previousToday = qc.getQueryData<CardWithTags[]>(cardKeys.today());

      return { previousLists, previousToday };
    },
    onError: (_, __, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          qc.setQueryData(queryKey, data);
        });
      }
      if (context?.previousToday) {
        qc.setQueryData(cardKeys.today(), context.previousToday);
      }
      toast.error('カードのリセットに失敗しました');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: cardKeys.lists() });
      qc.invalidateQueries({ queryKey: cardKeys.today() });
    },
  });
}
