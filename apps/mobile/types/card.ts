import type { Tag } from './tag';
import type { ListResponse } from './api';

export type Card = {
  id: string;
  userId: string;
  front: string;
  back: string;
  reviewLevel: number;
  nextReviewAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CardWithTags = Card & {
  tags: Tag[];
};

export type CardListResponse = ListResponse<CardWithTags>;

export type CreateCardInput = {
  front: string;
  back: string;
  tagIds?: string[];
};

export type UpdateCardInput = {
  front?: string;
  back?: string;
  tagIds?: string[];
};

export type CardStatus = 'all' | 'due' | 'completed';

export type CardFilters = {
  tagId?: string;
  status?: CardStatus;
  limit?: number;
  offset?: number;
};
