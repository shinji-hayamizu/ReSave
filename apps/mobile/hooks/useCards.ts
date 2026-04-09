import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useSession } from './useSession';
import { cardKeys } from './query-keys';
import type { CardWithTags, CardListResponse, CardFilters, CreateCardInput, UpdateCardInput } from '@/types/card';

export function useCards(filters?: CardFilters) {
  const { token } = useSession();

  return useQuery({
    queryKey: cardKeys.list(filters ?? {}),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.tagId) params.set('tagId', filters.tagId);
      if (filters?.limit) params.set('limit', String(filters.limit));
      if (filters?.offset) params.set('offset', String(filters.offset));
      const query = params.toString();
      const endpoint = query ? `/api/cards?${query}` : '/api/cards';
      return apiClient<CardListResponse>(endpoint, { token: token! });
    },
    enabled: !!token,
  });
}

export function useCard(id: string) {
  const { token } = useSession();

  return useQuery({
    queryKey: cardKeys.detail(id),
    queryFn: () => apiClient<CardWithTags>(`/api/cards/${id}`, { token: token! }),
    enabled: !!token && !!id,
  });
}

export function useTodayCards() {
  const { token } = useSession();

  return useQuery({
    queryKey: cardKeys.today(),
    queryFn: () => apiClient<CardListResponse>('/api/cards/today', { token: token! }),
    enabled: !!token,
  });
}

export function useCreateCard() {
  const { token } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCardInput) =>
      apiClient<CardWithTags>('/api/cards', {
        method: 'POST',
        body: input,
        token: token!,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
      queryClient.invalidateQueries({ queryKey: cardKeys.today() });
    },
  });
}

export function useUpdateCard() {
  const { token } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCardInput }) =>
      apiClient<CardWithTags>(`/api/cards/${id}`, {
        method: 'PATCH',
        body: input,
        token: token!,
      }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: cardKeys.today() });
    },
  });
}

export function useDeleteCard() {
  const { token } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient<undefined>(`/api/cards/${id}`, {
        method: 'DELETE',
        token: token!,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
      queryClient.invalidateQueries({ queryKey: cardKeys.today() });
    },
  });
}
