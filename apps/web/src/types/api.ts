/**
 * Pagination metadata for list responses
 */
export type Pagination = {
  total: number;
  limit: number;
  offset: number;
};

/**
 * Generic paginated list response wrapper
 */
export type ListResponse<T> = {
  data: T[];
  pagination: Pagination;
};

/**
 * Standard API error response structure
 */
export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
};

/**
 * Generic success response wrapper for single item responses
 */
export type ApiSuccessResponse<T> = {
  data: T;
};
