export type Pagination = {
  total: number;
  limit: number;
  offset: number;
};

export type ListResponse<T> = {
  data: T[];
  pagination: Pagination;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
};

export type ApiSuccessResponse<T> = {
  data: T;
};
