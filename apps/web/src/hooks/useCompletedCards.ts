'use client';

import { useInfiniteQuery } from '@tanstack/react-query';

import { getCompletedCards } from '@/actions/cards';
import { homeCardKeys } from '@/lib/query-keys';
import type { CompletedCardsPage } from '@/types/card';

const COMPLETED_PAGE_SIZE = 10;

export function useCompletedCards() {
  return useInfiniteQuery<CompletedCardsPage>({
    queryKey: homeCardKeys.tab('completed'),
    queryFn: ({ pageParam }) =>
      getCompletedCards({ limit: COMPLETED_PAGE_SIZE, offset: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore
        ? lastPage.pagination.offset + lastPage.pagination.limit
        : undefined,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
  });
}
