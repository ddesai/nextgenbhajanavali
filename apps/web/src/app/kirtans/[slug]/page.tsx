import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KirtanDetailView } from "@/components/kirtan/kirtan-detail-view";
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
  const k = await getKirtanBySlug(slug);
  if (!k) notFound();

  const related = await getRelatedKirtans(k.id);

  return <KirtanDetailView k={k} related={related} />;
}
