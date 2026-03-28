import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCollectionBySlug } from "@/lib/queries";
import { KirtanCard } from "@/components/kirtan-card";
import { absoluteUrl } from "@/lib/metadata";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const col = await getCollectionBySlug(slug);
  if (!col)
    return { title: "Collection not found", robots: { index: false } };

  return {
    title: col.name,
    description: col.description ?? `Kirtans in the “${col.name}” collection.`,
    alternates: { canonical: `/collections/${col.slug}` },
    openGraph: {
      title: col.name,
      url: absoluteUrl(`/collections/${col.slug}`),
    },
  };
}

export default async function CollectionDetailPage({ params }: Props) {
  const { slug } = await params;
  const col = await getCollectionBySlug(slug);
  if (!col) notFound();

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <li>
              <Link
                href="/collections"
                className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Collections
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-foreground">{col.slug}</li>
          </ol>
        </nav>
        <h1 className="text-3xl font-semibold tracking-tight">{col.name}</h1>
        {col.description ? (
          <p className="text-lg text-muted-foreground">{col.description}</p>
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
