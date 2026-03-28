import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BROWSE_CATEGORIES, type BrowseCategorySlug } from "@ngb/db";
import { EmptyState } from "@/components/empty-state";
import { KirtanCard } from "@/components/kirtan-card";
import { listKirtansByBrowseSlug } from "@/lib/queries";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const key = slug.toLowerCase() as BrowseCategorySlug;
  const def = BROWSE_CATEGORIES[key];
  if (!def) return { title: "Category", robots: { index: false } };

  return {
    title: def.label,
    description: `${def.blurb} — kirtans and bhajans in Gujarati.`,
    alternates: { canonical: `/browse/${slug}` },
  };
}

export default async function BrowseCategoryPage({ params }: Props) {
  const { slug } = await params;
  const key = slug.toLowerCase() as BrowseCategorySlug;
  if (!BROWSE_CATEGORIES[key]) notFound();

  const def = BROWSE_CATEGORIES[key];
  const kirtans = await listKirtansByBrowseSlug(slug, 60);

  return (
    <div className="space-y-8">
      <header>
        <nav className="mb-4 text-sm text-muted-foreground">
          <Link href="/browse" className="hover:text-foreground">
            Browse
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{def.label}</span>
        </nav>
        <h1 className="font-display text-3xl font-medium">{def.label}</h1>
        <p className="mt-2 max-w-lg text-muted-foreground">{def.blurb}</p>
      </header>

      {kirtans.length === 0 ? (
        <EmptyState
          title="No entries yet"
          description="We will fill this category as more kirtans are ingested. Try search or another category."
          icon={<span aria-hidden>📿</span>}
        />
      ) : (
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2">
          {kirtans.map((k) => (
            <li key={k.id}>
              <KirtanCard kirtan={k} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
