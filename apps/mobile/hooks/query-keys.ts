import type { CardFilters } from '@/types/card';

export const cardKeys = {
  all: ['cards'] as const,
  lists: () => [...cardKeys.all, 'list'] as const,
  list: (filters: CardFilters) => [...cardKeys.lists(), filters] as const,
  details: () => [...cardKeys.all, 'detail'] as const,
  detail: (id: string) => [...cardKeys.details(), id] as const,
  today: () => [...cardKeys.all, 'today'] as const,
};

export const tagKeys = {
  all: ['tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  detail: (id: string) => [...tagKeys.all, 'detail', id] as const,
};

export const studyKeys = {
  all: ['study'] as const,
  today: () => [...studyKeys.all, 'today'] as const,
};

export const statsKeys = {
  all: ['stats'] as const,
  today: () => [...statsKeys.all, 'today'] as const,
  daily: (days: number) => [...statsKeys.all, 'daily', days] as const,
  summary: () => [...statsKeys.all, 'summary'] as const,
};
