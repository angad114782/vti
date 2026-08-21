/** Escape special regex characters in user-supplied search strings to prevent ReDoS. */
export function escapeRegex(str: string): RegExp {
  const normalized = str.trim().replace(/\s+/g, ' ').slice(0, 100);
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped, "i");
}

export const normalizeSearchText = (value: unknown): string =>
  String(value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();

/** Clamp a pagination limit to [1, max] and default to defaultVal. */
export function clampLimit(
  raw: string | undefined,
  defaultVal = 20,
  max = 100
): number {
  const n = parseInt(raw ?? String(defaultVal), 10);
  if (Number.isNaN(n) || n < 1) return defaultVal;
  return Math.min(n, max);
}

/** Parse page/limit from query params and return skip + limit + page for use in .skip().limit(). */
export function parsePagination(
  query: Record<string, string | undefined>,
  defaultLimit = 20,
  maxLimit = 100
): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
  const limit = clampLimit(query.limit, defaultLimit, maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}

/** Build a standard pagination metadata object for API responses. */
export function paginationMeta(total: number, page: number, limit: number) {
  return { total, page, limit, totalPages: Math.ceil(total / limit) };
}
