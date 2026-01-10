import type { ListResponse } from './api';

/**
 * Review schedule template for spaced repetition
 */
export type ReviewSchedule = {
  id: string;
  userId: string;
  name: string;
  intervals: number[];
  isDefault: boolean;
  createdAt: string;
};

/**
 * Paginated list response for review schedules
 */
export type ReviewScheduleListResponse = ListResponse<ReviewSchedule>;

/**
 * Input for creating a new review schedule
 */
export type CreateReviewScheduleInput = {
  name: string;
  intervals: number[];
  isDefault?: boolean;
};

/**
 * Input for updating an existing review schedule
 */
export type UpdateReviewScheduleInput = {
  name?: string;
  intervals?: number[];
  isDefault?: boolean;
};

/**
 * Default intervals for new users
 */
export const DEFAULT_INTERVALS = [1, 3, 7, 14, 30, 90];
