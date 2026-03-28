import type { Metadata } from "next";
import Link from "next/link";
import { CatalogError } from "@/components/catalog-error";
import {
  DATABASE_URL_MISSING_MESSAGE,
  getDatabaseSetupHint,
  isDatabaseConfigured,
} from "@/lib/database-env";
import { getBrowseCategoryStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse categories",
  description: "Explore kirtans by devotional theme—arti, prarthana, dhun, and more.",
  alternates: { canonical: "/browse" },
};

export default async function BrowsePage() {
  if (!isDatabaseConfigured()) {
    return (
      <div className="space-y-10">
        <header className="space-y-2">
          <h1 className="font-display text-3xl font-medium">Browse by category</h1>
          <p className="text-muted-foreground">
            Gentle groupings—tap a card to see every kirtan we have in that spirit.
          </p>
        </header>
        <CatalogError
          title="Browse unavailable"
          message={DATABASE_URL_MISSING_MESSAGE}
          hint={getDatabaseSetupHint()}
        />
      </div>
    );
  }

  const categories = await getBrowseCategoryStats();

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-medium">Browse by category</h1>
        <p className="text-muted-foreground">
          Gentle groupings—tap a card to see every kirtan we have in that spirit.
        </p>
      </header>

      <ul className="grid list-none gap-4 p-0 sm:grid-cols-2">
        {categories.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/browse/${c.slug}`}
              className="block rounded-3xl border border-border/70 bg-gradient-to-br from-card to-muted/30 p-6 transition hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="font-display text-xl font-medium text-foreground">
                {c.label}
              </span>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {c.blurb}
              </p>
              <p className="mt-4 text-sm font-medium text-primary">
                {c.count} kirtan{c.count === 1 ? "" : "s"}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/search" className="font-medium text-primary hover:underline">
          Search across all text instead →
        </Link>
      </p>
    </div>
  );
}
