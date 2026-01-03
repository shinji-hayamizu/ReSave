'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  Card,
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
  today: () => [...cardKeys.all, 'today'] as const,
  detail: (id: string) => [...cardKeys.all, 'detail', id] as const,
};

export function useCards(filters?: CardFilters) {
  return useQuery<CardListResponse>({
    queryKey: cardKeys.list(filters ?? {}),
    queryFn: async () => {
      const { getCards } = await import('@/actions/cards');
      return getCards(filters);
    },
  });
}

export function useCard(id: string) {
  return useQuery<CardWithTags>({
    queryKey: cardKeys.detail(id),
    queryFn: async () => {
      const { getCard } = await import('@/actions/cards');
      return getCard(id);
    },
    enabled: Boolean(id),
  });
}

export function useTodayCards() {
  return useQuery<CardWithTags[]>({
    queryKey: cardKeys.today(),
    queryFn: async () => {
      const { getTodayCards } = await import('@/actions/cards');
      return getTodayCards();
    },
  });
}

export function useCreateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCardInput) => {
      const { createCard } = await import('@/actions/cards');
      return createCard(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cardKeys.lists() });
      qc.invalidateQueries({ queryKey: cardKeys.today() });
    },
  });
}

export function useUpdateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateCardInput }) => {
      const { updateCard } = await import('@/actions/cards');
      return updateCard(id, input);
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: cardKeys.lists() });
      qc.invalidateQueries({ queryKey: cardKeys.detail(variables.id) });
      qc.invalidateQueries({ queryKey: cardKeys.today() });
    },
  });
}

export function useDeleteCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { deleteCard } = await import('@/actions/cards');
      return deleteCard(id);
    },
    onSuccess: (_, deletedId) => {
      qc.invalidateQueries({ queryKey: cardKeys.lists() });
      qc.invalidateQueries({ queryKey: cardKeys.detail(deletedId) });
      qc.invalidateQueries({ queryKey: cardKeys.today() });
    },
  });
}
