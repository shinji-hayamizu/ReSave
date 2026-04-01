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
      qc.invalidateQueries({ queryKey: cardKeys.todayCompleted() });
    },
  });
}

type UpdateCardContext = {
  previousLists: [QueryKey, CardListResponse | undefined][];
  previousDetail: CardWithTags | undefined;
  previousNew: CardWithTags[] | undefined;
  previousToday: CardWithTags[] | undefined;
  previousTodayCompleted: CardWithTags[] | undefined;
};

export function useUpdateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCardInput }) =>
      updateCard(id, input),
    onMutate: async ({ id, input }): Promise<UpdateCardContext> => {
      await qc.cancelQueries({ queryKey: cardKeys.lists() });
      await qc.cancelQueries({ queryKey: cardKeys.detail(id) });
      await qc.cancelQueries({ queryKey: cardKeys.new() });
      await qc.cancelQueries({ queryKey: cardKeys.today() });
      await qc.cancelQueries({ queryKey: cardKeys.todayCompleted() });

      const previousLists = qc.getQueriesData<CardListResponse>({
        queryKey: cardKeys.lists(),
      });
      const previousDetail = qc.getQueryData<CardWithTags>(cardKeys.detail(id));
      const previousNew = qc.getQueryData<CardWithTags[]>(cardKeys.new());
      const previousToday = qc.getQueryData<CardWithTags[]>(cardKeys.today());
      const previousTodayCompleted = qc.getQueryData<CardWithTags[]>(cardKeys.todayCompleted());

      const updateCardInList = (card: CardWithTags): CardWithTags =>
        card.id === id
          ? { ...card, ...input, updatedAt: new Date().toISOString() }
          : card;

      qc.setQueriesData<CardListResponse>(
        { queryKey: cardKeys.lists() },
        (old) =>
          old
            ? {
                ...old,
                data: old.data.map(updateCardInList),
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

      if (previousNew) {
        qc.setQueryData<CardWithTags[]>(cardKeys.new(), previousNew.map(updateCardInList));
      }

      if (previousToday) {
        qc.setQueryData<CardWithTags[]>(cardKeys.today(), previousToday.map(updateCardInList));
      }

      if (previousTodayCompleted) {
        qc.setQueryData<CardWithTags[]>(
          cardKeys.todayCompleted(),
          previousTodayCompleted.map(updateCardInList)
        );
      }

      return { previousLists, previousDetail, previousNew, previousToday, previousTodayCompleted };
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
      if (context?.previousNew) {
        qc.setQueryData(cardKeys.new(), context.previousNew);
      }
      if (context?.previousToday) {
        qc.setQueryData(cardKeys.today(), context.previousToday);
      }
      if (context?.previousTodayCompleted) {
        qc.setQueryData(cardKeys.todayCompleted(), context.previousTodayCompleted);
      }
      toast.error('カードの更新に失敗しました');
    },
    onSettled: (_, __, variables) => {
      qc.invalidateQueries({ queryKey: cardKeys.lists() });
      qc.invalidateQueries({ queryKey: cardKeys.detail(variables.id) });
      qc.invalidateQueries({ queryKey: cardKeys.new() });
      qc.invalidateQueries({ queryKey: cardKeys.today() });
      qc.invalidateQueries({ queryKey: cardKeys.todayCompleted() });
    },
  });
}

type DeleteCardContext = {
  previousLists: [QueryKey, CardListResponse | undefined][];
  previousDetail: CardWithTags | undefined;
  previousNew: CardWithTags[] | undefined;
  previousToday: CardWithTags[] | undefined;
  previousTodayCompleted: CardWithTags[] | undefined;
};

export function useDeleteCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCard(id),
    onMutate: async (id): Promise<DeleteCardContext> => {
      await qc.cancelQueries({ queryKey: cardKeys.lists() });
      await qc.cancelQueries({ queryKey: cardKeys.detail(id) });
      await qc.cancelQueries({ queryKey: cardKeys.new() });
      await qc.cancelQueries({ queryKey: cardKeys.today() });
      await qc.cancelQueries({ queryKey: cardKeys.todayCompleted() });

      const previousLists = qc.getQueriesData<CardListResponse>({
        queryKey: cardKeys.lists(),
      });
      const previousDetail = qc.getQueryData<CardWithTags>(cardKeys.detail(id));
      const previousNew = qc.getQueryData<CardWithTags[]>(cardKeys.new());
      const previousToday = qc.getQueryData<CardWithTags[]>(cardKeys.today());
      const previousTodayCompleted = qc.getQueryData<CardWithTags[]>(cardKeys.todayCompleted());

      const filterById = (card: CardWithTags) => card.id !== id;

      qc.setQueriesData<CardListResponse>(
        { queryKey: cardKeys.lists() },
        (old) =>
          old
            ? {
                ...old,
                data: old.data.filter(filterById),
                pagination: { ...old.pagination, total: old.pagination.total - 1 },
              }
            : old
      );

      qc.removeQueries({ queryKey: cardKeys.detail(id) });

      if (previousNew) {
        qc.setQueryData<CardWithTags[]>(cardKeys.new(), previousNew.filter(filterById));
      }

      if (previousToday) {
        qc.setQueryData<CardWithTags[]>(cardKeys.today(), previousToday.filter(filterById));
      }

      if (previousTodayCompleted) {
        qc.setQueryData<CardWithTags[]>(
          cardKeys.todayCompleted(),
          previousTodayCompleted.filter(filterById)
        );
      }

      return { previousLists, previousDetail, previousNew, previousToday, previousTodayCompleted };
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
      if (context?.previousNew) {
        qc.setQueryData(cardKeys.new(), context.previousNew);
      }
      if (context?.previousToday) {
        qc.setQueryData(cardKeys.today(), context.previousToday);
      }
      if (context?.previousTodayCompleted) {
        qc.setQueryData(cardKeys.todayCompleted(), context.previousTodayCompleted);
      }
      toast.error('カードの削除に失敗しました');
    },
    onSettled: (_, __, deletedId) => {
      qc.invalidateQueries({ queryKey: cardKeys.lists() });
      qc.invalidateQueries({ queryKey: cardKeys.detail(deletedId) });
      qc.invalidateQueries({ queryKey: cardKeys.new() });
      qc.invalidateQueries({ queryKey: cardKeys.today() });
      qc.invalidateQueries({ queryKey: cardKeys.todayCompleted() });
    },
  });
}

type ResetCardContext = {
  previousLists: [QueryKey, CardListResponse | undefined][];
  previousNew: CardWithTags[] | undefined;
  previousToday: CardWithTags[] | undefined;
  previousTodayCompleted: CardWithTags[] | undefined;
};

export function useResetCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resetCardToUnlearned(id),
    onMutate: async (_id): Promise<ResetCardContext> => {
      await qc.cancelQueries({ queryKey: cardKeys.lists() });
      await qc.cancelQueries({ queryKey: cardKeys.new() });
      await qc.cancelQueries({ queryKey: cardKeys.today() });
      await qc.cancelQueries({ queryKey: cardKeys.todayCompleted() });

      const previousLists = qc.getQueriesData<CardListResponse>({
        queryKey: cardKeys.lists(),
      });
      const previousNew = qc.getQueryData<CardWithTags[]>(cardKeys.new());
      const previousToday = qc.getQueryData<CardWithTags[]>(cardKeys.today());
      const previousTodayCompleted = qc.getQueryData<CardWithTags[]>(cardKeys.todayCompleted());

      return { previousLists, previousNew, previousToday, previousTodayCompleted };
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
      if (context?.previousTodayCompleted) {
        qc.setQueryData(cardKeys.todayCompleted(), context.previousTodayCompleted);
      }
      toast.error('カードのリセットに失敗しました');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: cardKeys.lists() });
      qc.invalidateQueries({ queryKey: cardKeys.new() });
      qc.invalidateQueries({ queryKey: cardKeys.today() });
      qc.invalidateQueries({ queryKey: cardKeys.todayCompleted() });
    },
  });
}
