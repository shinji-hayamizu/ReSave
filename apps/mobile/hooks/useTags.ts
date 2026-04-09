import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useSession } from './useSession';
import { tagKeys } from './query-keys';
import type { Tag, TagListResponse, CreateTagInput, UpdateTagInput } from '@/types/tag';

export function useTags() {
  const { token } = useSession();

  return useQuery({
    queryKey: tagKeys.lists(),
    queryFn: () => apiClient<TagListResponse>('/api/tags', { token: token! }),
    enabled: !!token,
  });
}

export function useCreateTag() {
  const { token } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTagInput) =>
      apiClient<Tag>('/api/tags', {
        method: 'POST',
        body: input,
        token: token!,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
    },
  });
}

export function useUpdateTag() {
  const { token } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTagInput }) =>
      apiClient<Tag>(`/api/tags/${id}`, {
        method: 'PATCH',
        body: input,
        token: token!,
      }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tagKeys.detail(id) });
    },
  });
}

export function useDeleteTag() {
  const { token } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient<undefined>(`/api/tags/${id}`, {
        method: 'DELETE',
        token: token!,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
    },
  });
}
