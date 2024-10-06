export interface PaginationResponse<T> {
  page: number;
  limit: number;
  total: number;
  data: T[];
}
