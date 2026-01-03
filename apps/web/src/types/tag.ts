import type { ListResponse } from './api';

/**
 * Base tag entity for categorizing cards
 */
export type Tag = {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
};

/**
 * Paginated list response for tags
 */
export type TagListResponse = ListResponse<Tag>;

/**
 * Input for creating a new tag
 * Color defaults to a system-assigned value if not provided
 */
export type CreateTagInput = {
  name: string;
  color?: string;
};

/**
 * Input for updating an existing tag
 * All fields are optional for partial updates
 */
export type UpdateTagInput = {
  name?: string;
  color?: string;
};
