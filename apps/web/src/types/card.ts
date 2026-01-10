import type { Tag } from './tag';
import type { ListResponse } from './api';

/**
 * Base card entity for spaced repetition learning
 */
export type Card = {
  id: string;
  userId: string;
  front: string;
  back: string;
  schedule: number[];
  currentStep: number;
  nextReviewAt: string | null;
  status: 'new' | 'active' | 'completed';
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Card with embedded tags array
 */
export type CardWithTags = Card & {
  tags: Tag[];
};

/**
 * Paginated list response for cards
 */
export type CardListResponse = ListResponse<CardWithTags>;

/**
 * Input for creating a new card
 */
export type CreateCardInput = {
  front: string;
  back?: string;
  tagIds?: string[];
};

/**
 * Input for updating an existing card
 */
export type UpdateCardInput = {
  front?: string;
  back?: string;
  tagIds?: string[];
};

/**
 * Card status filter options
 */
export type CardStatus = 'all' | 'new' | 'due' | 'completed';

/**
 * Query filters for fetching cards
 */
export type CardFilters = {
  tagId?: string;
  status?: CardStatus;
  limit?: number;
  offset?: number;
};
