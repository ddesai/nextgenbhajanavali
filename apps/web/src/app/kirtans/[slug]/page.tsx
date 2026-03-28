import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogError } from "@/components/catalog-error";
import { KirtanDetailView } from "@/components/kirtan/kirtan-detail-view";
import {
  DATABASE_URL_MISSING_MESSAGE,
  getDatabaseSetupHint,
  isDatabaseConfigured,
} from "@/lib/database-env";
import { getKirtanBySlug, getRelatedKirtans } from "@/lib/queries";
import { absoluteUrl } from "@/lib/metadata";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const k = await getKirtanBySlug(slug);
  if (!k)
    return { title: "Not found", robots: { index: false, follow: true } };

  return {
    title: k.title,
    description:
      k.summary ?? `Read “${k.title}” with lyrics, translations, and audio when available.`,
    alternates: { canonical: `/kirtans/${k.slug}` },
    openGraph: {
      title: k.title,
      description: k.summary ?? undefined,
      url: absoluteUrl(`/kirtans/${k.slug}`),
      type: "article",
    },
  };
}

export default async function KirtanDetailPage({ params }: Props) {
  const { slug } = await params;
  if (!isDatabaseConfigured()) {
    return (
      <div className="space-y-6">
        <CatalogError
          title="Kirtan unavailable"
          message={DATABASE_URL_MISSING_MESSAGE}
          hint={getDatabaseSetupHint()}
        />
      </div>
    );
  }
  const k = await getKirtanBySlug(slug);
  if (!k) notFound();

  const related = await getRelatedKirtans(k.id);

  return <KirtanDetailView k={k} related={related} />;
}
