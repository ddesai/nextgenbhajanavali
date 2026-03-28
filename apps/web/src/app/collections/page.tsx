import type { Metadata } from "next";
import Link from "next/link";
import { CatalogError } from "@/components/catalog-error";
import { EmptyState } from "@/components/empty-state";
import {
  DATABASE_URL_MISSING_MESSAGE,
  getDatabaseSetupHint,
  isDatabaseConfigured,
} from "@/lib/database-env";
import { listCollections } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Collections",
  description: "Curated sets of kirtans for seasons and themes.",
  alternates: { canonical: "/collections" },
};

export default async function CollectionsPage() {
  if (!isDatabaseConfigured()) {
    return (
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="font-display text-3xl font-medium">Collections</h1>
          <p className="text-muted-foreground">
            Hand-picked groupings—open one and read straight through.
          </p>
        </header>
        <CatalogError
          title="Collections unavailable"
          message={DATABASE_URL_MISSING_MESSAGE}
          hint={getDatabaseSetupHint()}
        />
      </div>
    );
  }

  const collections = await listCollections();

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-medium">Collections</h1>
        <p className="text-muted-foreground">
          Hand-picked groupings—open one and read straight through.
        </p>
      </header>

      {collections.length === 0 ? (
        <EmptyState
          title="No collections yet"
          description="Collections will appear as editors curate sets. Search has everything in one list."
          icon={<span aria-hidden>🌼</span>}
        />
      ) : (
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2">
          {collections.map((c) => (
            <li key={c.id}>
              <Link
                href={`/collections/${c.slug}`}
                className="block rounded-3xl border border-border/70 bg-card/70 p-6 transition hover:border-primary/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <h2 className="font-display text-lg font-medium text-foreground">
                  {c.name}
                </h2>
                {c.description ? (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {c.description}
                  </p>
                ) : null}
                <p className="mt-4 text-sm font-medium text-primary">
                  {c._count.kirtans} kirtan{c._count.kirtans === 1 ? "" : "s"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
