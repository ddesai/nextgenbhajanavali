import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@ngb/ui";
import { listCollections } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Collections",
  description: "Curated groups of kirtans and bhajans.",
  alternates: { canonical: "/collections" },
};

export default async function CollectionsPage() {
  const collections = await listCollections();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Collections</h1>
        <p className="mt-2 text-muted-foreground">
          Theme-based groupings—expandable as you add more curated sets.
        </p>
      </header>
      <ul className="grid list-none gap-4 p-0 sm:grid-cols-2">
        {collections.map((c) => (
          <li key={c.id}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">
                  <Link
                    href={`/collections/${c.slug}`}
                    className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {c.name}
                  </Link>
                </CardTitle>
                {c.description ? (
                  <CardDescription className="line-clamp-3">
                    {c.description}
                  </CardDescription>
                ) : null}
                <p className="text-sm text-muted-foreground">
                  {c._count.kirtans} kirtan{c._count.kirtans === 1 ? "" : "s"}
                </p>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
