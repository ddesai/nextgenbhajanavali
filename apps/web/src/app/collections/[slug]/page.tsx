import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogError } from "@/components/catalog-error";
import { KirtanCard } from "@/components/kirtan-card";
import {
  DATABASE_URL_MISSING_MESSAGE,
  getDatabaseSetupHint,
  isDatabaseConfigured,
} from "@/lib/database-env";
import { getCollectionBySlug } from "@/lib/queries";
import { absoluteUrl } from "@/lib/metadata";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isDatabaseConfigured()) {
    return { title: "Collection", robots: { index: false } };
  }
  const col = await getCollectionBySlug(slug);
  if (!col)
    return { title: "Not found", robots: { index: false } };

  return {
    title: col.name,
    description: col.description ?? `Kirtans in “${col.name}”.`,
    alternates: { canonical: `/collections/${col.slug}` },
    openGraph: {
      title: col.name,
      url: absoluteUrl(`/collections/${col.slug}`),
    },
  };
}

export default async function CollectionDetailPage({ params }: Props) {
  const { slug } = await params;
  if (!isDatabaseConfigured()) {
    return (
      <div className="space-y-8">
        <CatalogError
          title="Collections unavailable"
          message={DATABASE_URL_MISSING_MESSAGE}
          hint={getDatabaseSetupHint()}
        />
      </div>
    );
  }
  const col = await getCollectionBySlug(slug);
  if (!col) notFound();

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <nav className="text-sm text-muted-foreground">
          <Link href="/collections" className="hover:text-foreground">
            Collections
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{col.name}</span>
        </nav>
        <h1 className="font-display text-3xl font-medium">{col.name}</h1>
        {col.description ? (
          <p className="max-w-lg text-muted-foreground">{col.description}</p>
        ) : null}
      </header>

      <ul className="grid list-none gap-4 p-0 sm:grid-cols-2">
        {col.kirtans.map(({ kirtan }) => (
          <li key={kirtan.id}>
            <KirtanCard kirtan={kirtan} />
          </li>
        ))}
      </ul>
    </div>
  );
}
