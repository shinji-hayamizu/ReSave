import type { ListResponse } from './api';

export type Tag = {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
};

export type TagListResponse = ListResponse<Tag>;

export type CreateTagInput = {
  name: string;
  color?: string;
};

export type UpdateTagInput = {
  name?: string;
  color?: string;
};
