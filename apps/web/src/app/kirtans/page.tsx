import type { Metadata } from "next";
import Link from "next/link";
import { CatalogError } from "@/components/catalog-error";
import { KirtanCard } from "@/components/kirtan-card";
import {
  DATABASE_URL_MISSING_MESSAGE,
  getDatabaseSetupHint,
  isDatabaseConfigured,
} from "@/lib/database-env";
import { searchKirtansFiltered } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All kirtans",
  alternates: { canonical: "/kirtans" },
};

export default async function KirtansIndexPage() {
  if (!isDatabaseConfigured()) {
    return (
      <div className="space-y-8">
        <header>
          <h1 className="font-display text-3xl font-medium">Every kirtan</h1>
          <p className="mt-2 text-muted-foreground">
            Alphabetical list. For filters and speed, use{" "}
            <Link href="/search" className="font-medium text-primary hover:underline">
              search
            </Link>
            .
          </p>
        </header>
        <CatalogError
          title="Kirtans unavailable"
          message={DATABASE_URL_MISSING_MESSAGE}
          hint={getDatabaseSetupHint()}
        />
      </div>
    );
  }

  const items = await searchKirtansFiltered({ take: 120 });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-medium">Every kirtan</h1>
        <p className="mt-2 text-muted-foreground">
          Alphabetical list. For filters and speed, use{" "}
          <Link href="/search" className="font-medium text-primary hover:underline">
            search
          </Link>
          .
        </p>
      </header>
      <ul className="grid list-none gap-4 p-0 sm:grid-cols-2">
        {items.map((k) => (
          <li key={k.id}>
            <KirtanCard kirtan={k} />
          </li>
        ))}
      </ul>
    </div>
  );
}
