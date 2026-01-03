'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CreateTagInput, Tag, UpdateTagInput } from '@/types/tag';

export type TagWithCardCount = Tag & {
  cardCount: number;
};

export const tagKeys = {
  all: ['tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  list: () => [...tagKeys.lists()] as const,
  detail: (id: string) => [...tagKeys.all, 'detail', id] as const,
};

export function useTags() {
  return useQuery<TagWithCardCount[]>({
    queryKey: tagKeys.list(),
    queryFn: async () => {
      const { getTags } = await import('@/actions/tags');
      return getTags();
    },
  });
}

export function useTag(id: string) {
  return useQuery<Tag>({
    queryKey: tagKeys.detail(id),
    queryFn: async () => {
      const { getTag } = await import('@/actions/tags');
      return getTag(id);
    },
    enabled: Boolean(id),
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTagInput) => {
      const { createTag } = await import('@/actions/tags');
      return createTag(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tagKeys.lists() });
    },
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateTagInput }) => {
      const { updateTag } = await import('@/actions/tags');
      return updateTag(id, input);
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: tagKeys.lists() });
      qc.invalidateQueries({ queryKey: tagKeys.detail(variables.id) });
    },
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { deleteTag } = await import('@/actions/tags');
      return deleteTag(id);
    },
    onSuccess: (_, deletedId) => {
      qc.invalidateQueries({ queryKey: tagKeys.lists() });
      qc.invalidateQueries({ queryKey: tagKeys.detail(deletedId) });
    },
  });
}
