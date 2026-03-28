import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@ngb/ui";
import { CatalogError } from "@/components/catalog-error";
import { KirtanCard } from "@/components/kirtan-card";
import {
  getBrowseCategoryStats,
  listCollections,
  searchKirtansFiltered,
} from "@/lib/queries";
import {
  DATABASE_URL_MISSING_MESSAGE,
  getDatabaseSetupHint,
  isDatabaseConfigured,
} from "@/lib/database-env";
import { absoluteUrl } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Read Swaminarayan kirtans in Gujarati with transliteration, English when available, and simple audio playback.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Next Gen Bhajanavali",
    description:
      "A quiet place for Gujarati kirtan lyrics, Gujulish, English, and listening.",
    url: absoluteUrl("/"),
  },
};

export default async function HomePage() {
  let featured: Awaited<ReturnType<typeof searchKirtansFiltered>> = [];
  let categories: Awaited<ReturnType<typeof getBrowseCategoryStats>> = [];
  let collections: Awaited<ReturnType<typeof listCollections>> = [];
  let loadError: string | null = null;

  if (!isDatabaseConfigured()) {
    loadError = DATABASE_URL_MISSING_MESSAGE;
  } else {
    try {
      [featured, categories, collections] = await Promise.all([
        searchKirtansFiltered({ chip: "popular", take: 6 }, { orderPopular: true }),
        getBrowseCategoryStats(),
        listCollections(),
      ]);
    } catch (e) {
      loadError =
        e instanceof Error ? e.message : "Could not load catalog. Check the database connection.";
    }
  }

  if (loadError) {
    return (
      <div className="space-y-10 pb-8">
        <section className="space-y-6 text-center sm:text-left">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary/90">
            Swaminarayan · Kirtan · Bhajan
          </p>
          <h1 className="font-display text-3xl font-medium leading-tight text-foreground sm:text-4xl">
            A quiet place for lyrics &amp; listening
          </h1>
          <p className="mx-auto max-w-lg text-lg leading-relaxed text-muted-foreground sm:mx-0">
            Read Gujarati kirtans in clarity—transliteration and English when we have
            them—then play audio in a simple player made for phones.
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
            <Button asChild size="lg" className="rounded-full px-8">
              <Link href="/search">Explore all</Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="rounded-full">
              <Link href="/browse">Browse by mood</Link>
            </Button>
          </div>
        </section>
        <CatalogError
          title="Catalog unavailable"
          message={loadError}
          hint={getDatabaseSetupHint()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-14 pb-8">
      <section className="space-y-6 text-center sm:text-left">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary/90">
          Swaminarayan · Kirtan · Bhajan
        </p>
        <h1 className="font-display text-3xl font-medium leading-tight text-foreground sm:text-4xl">
          A quiet place for lyrics &amp; listening
        </h1>
        <p className="mx-auto max-w-lg text-lg leading-relaxed text-muted-foreground sm:mx-0">
          Read Gujarati kirtans in clarity—transliteration and English when we
          have them—then play audio in a simple player made for phones.
        </p>
        <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
          <Button asChild size="lg" className="rounded-full px-8">
            <Link href="/search">Explore all</Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="rounded-full">
            <Link href="/browse">Browse by mood</Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="popular-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="popular-heading" className="font-display text-xl font-medium">
            Popular this week
          </h2>
          <Link
            href="/search?chip=popular"
            className="text-sm font-medium text-primary hover:underline"
          >
            See all
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No kirtans yet. Run the database seed to see samples.
          </p>
        ) : (
          <ul className="grid list-none gap-4 p-0 sm:grid-cols-2">
            {featured.map((k) => (
              <li key={k.id}>
                <KirtanCard kirtan={k} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="browse-heading">
        <h2 id="browse-heading" className="mb-4 font-display text-xl font-medium">
          Browse by category
        </h2>
        <ul className="grid list-none gap-3 p-0 sm:grid-cols-3">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/browse/${c.slug}`}
                className="flex min-h-[44px] flex-col rounded-2xl border border-border/70 bg-card/60 p-4 transition hover:border-primary/25 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span className="font-medium text-foreground">{c.label}</span>
                <span className="mt-1 text-sm text-muted-foreground">{c.blurb}</span>
                <span className="mt-3 text-xs text-primary/90">
                  {c.count} kirtan{c.count === 1 ? "" : "s"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="col-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="col-heading" className="font-display text-xl font-medium">
            Collections
          </h2>
          <Link
            href="/collections"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        <ul className="flex flex-col gap-3">
          {collections.slice(0, 3).map((c) => (
            <li key={c.id}>
              <Link
                href={`/collections/${c.slug}`}
                className="block min-h-[44px] rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 transition hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span className="font-medium">{c.name}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {c._count.kirtans} pieces
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
