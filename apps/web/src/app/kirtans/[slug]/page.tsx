import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button } from "@ngb/ui";
import { KirtanCard } from "@/components/kirtan-card";
import { KirtanTextSections } from "@/components/kirtan-text-sections";
import {
  getKirtanBySlug,
  getRelatedKirtans,
} from "@/lib/queries";
import { absoluteUrl } from "@/lib/metadata";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const k = await getKirtanBySlug(slug);
  if (!k)
    return { title: "Kirtan not found", robots: { index: false, follow: true } };

  return {
    title: k.title,
    description: k.summary ?? `Lyrics and details for ${k.title}.`,
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

  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <li>
              <Link
                href="/kirtans"
                className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Kirtans
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-foreground">{k.slug}</li>
          </ol>
        </nav>
        <h1
          className="font-gujarati text-3xl font-semibold leading-tight sm:text-4xl"
          lang="gu"
        >
          {k.title}
        </h1>
        {k.titleTransliterated ? (
          <p className="text-xl text-muted-foreground" lang="gu-Latn">
            {k.titleTransliterated}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2" aria-label="Source and formats">
          <Badge variant="muted">{k.sourceName}</Badge>
          {k.hasAudio ? <Badge>Audio available</Badge> : null}
          {k.hasEnglish ? <Badge variant="secondary">English text</Badge> : null}
        </div>
      </header>

      {k.audios.length > 0 ? (
        <section aria-labelledby="audio-heading" className="space-y-3">
          <h2 id="audio-heading" className="text-lg font-semibold">
            Listen
          </h2>
          {k.audios.map((a) => (
            <figure key={`${a.url}-${a.sortOrder}`} className="space-y-2">
              <figcaption className="text-sm text-muted-foreground">
                {a.title ?? "Recording"}
                {a.durationSec != null
                  ? ` · ${formatDuration(a.durationSec)}`
                  : ""}
              </figcaption>
              <audio
                className="w-full"
                controls
                preload="metadata"
                src={a.url}
              >
                Your browser does not support the audio element.
              </audio>
            </figure>
          ))}
        </section>
      ) : null}

      <section aria-labelledby="lyrics-heading" className="space-y-4">
        <h2 id="lyrics-heading" className="text-lg font-semibold">
          Text
        </h2>
        <KirtanTextSections texts={k.texts} />
      </section>

      {related.length > 0 ? (
        <section aria-labelledby="related-heading" className="space-y-4">
          <h2 id="related-heading" className="text-lg font-semibold">
            Related kirtans
          </h2>
          <ul className="grid list-none gap-4 p-0 sm:grid-cols-2">
            {related.map((r) => (
              <li key={r.id}>
                <KirtanCard kirtan={r} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex gap-3 pt-4">
        <Button variant="secondary" asChild>
          <Link href="/search">Find more</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/collections">Collections</Link>
        </Button>
      </div>
    </article>
  );
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
