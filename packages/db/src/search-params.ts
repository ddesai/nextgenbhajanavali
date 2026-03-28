import type { SearchSort } from "./search-engine.js";

/** Allowed `sort=` query values — single source of truth for API + Web. */
export const SEARCH_SORT_QUERY_VALUES: readonly SearchSort[] = [
  "relevance",
  "title_asc",
  "title_desc",
  "popular",
] as const;

/** Parse `sort` from URL/search params; invalid values yield `undefined` (callers fall back). */
export function parseSearchSortParam(
  v: string | null | undefined,
): SearchSort | undefined {
  if (!v) return undefined;
  return (SEARCH_SORT_QUERY_VALUES as readonly string[]).includes(v)
    ? (v as SearchSort)
    : undefined;
}
