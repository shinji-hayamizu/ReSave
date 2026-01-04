'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { createTag, deleteTag, getTag, getTags, updateTag } from '@/actions/tags';
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
    queryFn: () => getTags(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTag(id: string) {
  return useQuery<Tag>({
    queryKey: tagKeys.detail(id),
    queryFn: () => getTag(id),
    enabled: Boolean(id),
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTagInput) => createTag(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: tagKeys.lists() });

      const previousTags = qc.getQueryData<TagWithCardCount[]>(tagKeys.list());

      const optimisticTag: TagWithCardCount = {
        id: `temp-${Date.now()}`,
        name: input.name,
        color: input.color ?? 'blue',
        userId: '',
        createdAt: new Date().toISOString(),
        cardCount: 0,
      };

      qc.setQueryData<TagWithCardCount[]>(tagKeys.list(), (old) =>
        old ? [...old, optimisticTag] : [optimisticTag]
      );

      return { previousTags };
    },
    onError: (_, __, context) => {
      if (context?.previousTags) {
        qc.setQueryData(tagKeys.list(), context.previousTags);
      }
      toast.error('タグの作成に失敗しました');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: tagKeys.lists() });
    },
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTagInput }) => updateTag(id, input),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: tagKeys.lists() });
      await qc.cancelQueries({ queryKey: tagKeys.detail(id) });

      const previousTags = qc.getQueryData<TagWithCardCount[]>(tagKeys.list());
      const previousTag = qc.getQueryData<Tag>(tagKeys.detail(id));

      qc.setQueryData<TagWithCardCount[]>(tagKeys.list(), (old) =>
        old?.map((tag) =>
          tag.id === id
            ? { ...tag, ...input }
            : tag
        )
      );

      qc.setQueryData<Tag>(tagKeys.detail(id), (old) =>
        old ? { ...old, ...input } : old
      );

      return { previousTags, previousTag };
    },
    onError: (_, variables, context) => {
      if (context?.previousTags) {
        qc.setQueryData(tagKeys.list(), context.previousTags);
      }
      if (context?.previousTag) {
        qc.setQueryData(tagKeys.detail(variables.id), context.previousTag);
      }
      toast.error('タグの更新に失敗しました');
    },
    onSettled: (_, __, variables) => {
      qc.invalidateQueries({ queryKey: tagKeys.lists() });
      qc.invalidateQueries({ queryKey: tagKeys.detail(variables.id) });
    },
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: tagKeys.lists() });
      await qc.cancelQueries({ queryKey: tagKeys.detail(id) });

      const previousTags = qc.getQueryData<TagWithCardCount[]>(tagKeys.list());
      const previousTag = qc.getQueryData<Tag>(tagKeys.detail(id));

      qc.setQueryData<TagWithCardCount[]>(tagKeys.list(), (old) =>
        old?.filter((tag) => tag.id !== id)
      );

      qc.removeQueries({ queryKey: tagKeys.detail(id) });

      return { previousTags, previousTag, deletedId: id };
    },
    onError: (_, __, context) => {
      if (context?.previousTags) {
        qc.setQueryData(tagKeys.list(), context.previousTags);
      }
      if (context?.previousTag && context?.deletedId) {
        qc.setQueryData(tagKeys.detail(context.deletedId), context.previousTag);
      }
      toast.error('タグの削除に失敗しました');
    },
    onSettled: (_, __, deletedId) => {
      qc.invalidateQueries({ queryKey: tagKeys.lists() });
      qc.invalidateQueries({ queryKey: tagKeys.detail(deletedId) });
    },
  });
}
