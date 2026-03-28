import { NextResponse } from "next/server";
import {
  getDatabaseSetupHint,
  isDatabaseConfigured,
} from "@/lib/database-env";
import {
  parseSearchSortParam,
  searchKirtansWithTotal,
  type KirtanListFilters,
} from "@ngb/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseBool(v: string | null): boolean {
  return v === "1" || v === "true" || v === "yes";
}

/**
 * GET /api/search?q=&sort=&audio=&english=&chip=&author=&category=&raag=&take=&skip=
 * JSON for programmatic clients; same ranking and filters as `/search`.
 */
export async function GET(req: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        error: "DATABASE_URL is not configured for this deployment.",
        hint: getDatabaseSetupHint(),
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const take = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("take") ?? "24", 10) || 24),
  );
  const skip = Math.max(0, parseInt(searchParams.get("skip") ?? "0", 10) || 0);

  const filters: KirtanListFilters = {
    q,
    hasAudio: parseBool(searchParams.get("audio")) || undefined,
    hasEnglish: parseBool(searchParams.get("english")) || undefined,
    chip: searchParams.get("chip")?.toLowerCase() || undefined,
    author: searchParams.get("author")?.trim() || undefined,
    category: searchParams.get("category")?.trim() || undefined,
    raag: searchParams.get("raag")?.trim() || undefined,
    sort: parseSearchSortParam(searchParams.get("sort")),
    take,
    skip,
  };

  try {
    const { hits, total } = await searchKirtansWithTotal(filters, {});
    return NextResponse.json(
      {
        hits,
        total,
        take,
        skip,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      },
    );
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Search failed (database error).";
    const pgrst =
      message.includes("searchVector") || message.includes("pg_trgm");
    return NextResponse.json(
      {
        error: message,
        hint: pgrst
          ? "Apply the Prisma migration that enables pg_trgm and generated searchVector (see docs/SEARCH.md)."
          : undefined,
      },
      { status: pgrst ? 503 : 500 },
    );
  }
}
