import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CatalogError } from "@/components/catalog-error";
import { EmptyState } from "@/components/empty-state";
import { KirtanCard } from "@/components/kirtan-card";
import { SearchFilterChips } from "@/components/search-filter-chips";
import { SearchRefineBar } from "@/components/search-refine-bar";
import { absoluteUrl } from "@/lib/metadata";
import { parseSearchSortParam, searchKirtansWithTotal } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Full-text search across titles and lyrics (Gujarati and transliteration), with filters for audio, translations, author, raag, and category.",
  alternates: { canonical: "/search" },
  openGraph: {
    title: "Search · Bhajanavali",
    url: absoluteUrl("/search"),
  },
};

type Props = {
  searchParams: Promise<{
    q?: string;
    audio?: string;
    english?: string;
    chip?: string;
    author?: string;
    category?: string;
    raag?: string;
    sort?: string;
  }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const hasAudio = sp.audio === "1";
  const hasEnglish = sp.english === "1";
  const chip = sp.chip?.toLowerCase();
  const author = sp.author?.trim() ?? "";
  const category = sp.category?.trim() ?? "";
  const raag = sp.raag?.trim() ?? "";
  const sort = parseSearchSortParam(sp.sort);

  let results: Awaited<ReturnType<typeof searchKirtansWithTotal>>["hits"] = [];
  let total = 0;
  let searchError: string | null = null;

  try {
    const out = await searchKirtansWithTotal(
      {
        q,
        hasAudio: hasAudio || undefined,
        hasEnglish: hasEnglish || undefined,
        chip: chip || undefined,
        author: author || undefined,
        category: category || undefined,
        raag: raag || undefined,
        sort,
        take: 48,
      },
      { orderPopular: chip === "popular" },
    );
    results = out.hits;
    total = out.total;
  } catch (e) {
    searchError =
      e instanceof Error ? e.message : "Search is temporarily unavailable.";
  }

  const hasFilters =
    hasAudio ||
    hasEnglish ||
    !!chip ||
    !!author ||
    !!category ||
    !!raag ||
    !!sort;

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-medium sm:text-3xl">Search</h1>
        <p className="text-muted-foreground">
          Refine with quick filters—everything stays readable on small screens.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="flex h-10 flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-9 w-24 animate-pulse rounded-full bg-muted/80"
              />
            ))}
          </div>
        }
      >
        <SearchFilterChips />
      </Suspense>

      <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-muted/40" />}>
        <SearchRefineBar />
      </Suspense>

      <section aria-live="polite" className="space-y-4">
        {searchError ? (
          <CatalogError
            title="Search unavailable"
            message={searchError}
            hint="If you recently deployed: run database migrations (pg_trgm + searchVector per docs/SEARCH.md) and ensure DATABASE_URL is set on the server."
          />
        ) : null}

        {!searchError ? (
        <p className="text-sm text-muted-foreground">
          {total} result{total === 1 ? "" : "s"}
          {q ? ` for “${q}”` : ""}
        </p>
        ) : null}

        {!searchError && results.length === 0 ? (
          <EmptyState
            title="Nothing matched yet"
            description={
              hasFilters || q
                ? "Try clearing a filter or use shorter words. You can also browse by category from the home page."
                : "Search above, or pick a filter chip to explore the catalog."
            }
            icon={<span aria-hidden>🪔</span>}
          />
        ) : null}

        {!searchError && results.length > 0 ? (
          <ul className="grid list-none gap-4 p-0 sm:grid-cols-2">
            {results.map((k) => (
              <li key={k.id}>
                <KirtanCard kirtan={k} />
              </li>
            ))}
          </ul>
        ) : null}

        {!searchError ? (
          <p className="text-center text-sm text-muted-foreground">
            Looking for structure?{" "}
            <Link href="/browse" className="font-medium text-primary hover:underline">
              Browse categories
            </Link>
          </p>
        ) : null}
      </section>

    </div>
  );
}
