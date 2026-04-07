import type { ListResponse } from './api';

export type ReviewSchedule = {
  id: string;
  userId: string;
  name: string;
  intervals: number[];
  isDefault: boolean;
  createdAt: string;
};

export type ReviewScheduleListResponse = ListResponse<ReviewSchedule>;

export type CreateReviewScheduleInput = {
  name: string;
  intervals: number[];
  isDefault?: boolean;
};

export type UpdateReviewScheduleInput = {
  name?: string;
  intervals?: number[];
  isDefault?: boolean;
};

export const DEFAULT_INTERVALS = [1, 3, 7, 14, 30, 180];
