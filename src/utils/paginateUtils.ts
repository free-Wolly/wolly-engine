import { ParsedQs } from "qs";
import { PaginationResponse } from "../types/pagination";

const tryParseInt = (
  value: string | ParsedQs | string[] | ParsedQs[] | undefined,
  defaultValue: number
): number => {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  if (Array.isArray(value)) {
    const parsed = parseInt(value[0] as string, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  return defaultValue;
};

export const getPaginationParams = (
  query: ParsedQs
): { page: number; limit: number } => {
  const page = tryParseInt(query.page, 0);
  const limit = tryParseInt(query.limit, 10);
  return { page, limit };
};

export const generatePaginationResponse = <T>(
  result: { rows: T[]; count: number },
  page: number,
  limit: number
): PaginationResponse<T> => ({
  page: page,
  limit: limit,
  total: result.count,
  data: result.rows,
});
