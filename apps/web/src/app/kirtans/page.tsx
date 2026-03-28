import type { Metadata } from "next";
import { searchKirtans } from "@/lib/queries";
import { KirtanCard } from "@/components/kirtan-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse kirtans",
  description: "Alphabetical list of kirtans and bhajans in the catalog.",
  alternates: { canonical: "/kirtans" },
};

export default async function KirtansIndexPage() {
  const items = await searchKirtans("", 100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">All kirtans</h1>
        <p className="mt-2 text-muted-foreground">
          {items.length} entr{items.length === 1 ? "y" : "ies"} in the current
          catalog. Use search to filter by title or transliteration.
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
