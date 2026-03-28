"use client";

import type { KirtanDetail, KirtanSummary } from "@ngb/content-schema";
import Link from "next/link";
import { Button } from "@ngb/ui";
import { KirtanCard } from "@/components/kirtan-card";
import { useAudio } from "@/components/audio/audio-context";
import { absoluteUrl } from "@/lib/metadata";
import { KirtanDetailAudioPanel } from "./kirtan-detail-audio-panel";
import { KirtanDetailReader } from "./kirtan-detail-reader";
import { KirtanReaderProvider } from "./kirtan-reader-context";

function joinLocale(gu?: string | null, en?: string | null) {
  const parts = [gu, en].filter(Boolean) as string[];
  if (parts.length === 0) return null;
  return parts.join(" · ");
}

function ListenReadBanner({ slug }: { slug: string }) {
  const { nowPlaying, isPlaying } = useAudio();
  if (!nowPlaying || nowPlaying.slug !== slug || !isPlaying) return null;
  return (
    <div
      className="rounded-2xl border border-primary/25 bg-primary/8 px-4 py-3 text-center text-sm leading-relaxed text-foreground"
      role="status"
      aria-live="polite"
    >
      <span className="font-medium text-primary">Listening</span>
      <span className="text-muted-foreground">
        {" "}
        — take your time with the lyrics. Audio keeps playing if{" "}
        <span className="whitespace-nowrap">you browse elsewhere.</span>
      </span>
    </div>
  );
}

export function KirtanDetailView({
  k,
  related,
}: {
  k: KirtanDetail;
  related: KirtanSummary[];
}) {
  const shareUrl = absoluteUrl(`/kirtans/${k.slug}`);
  const primaryAudio = k.audios[0];
  const author = joinLocale(k.info?.author, k.info?.authorLatin);
  const category = joinLocale(k.info?.categoryGujarati, k.info?.categoryEnglish);
  const raag = joinLocale(k.info?.raagGujarati, k.info?.raagEnglish);

  return (
    <KirtanReaderProvider>
      <article className="space-y-10 pb-8">
        <header className="space-y-5">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground">
                  Home
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link href="/search" className="hover:text-foreground">
                  Search
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="truncate text-foreground/80" lang="gu">
                {k.title}
              </li>
            </ol>
          </nav>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary/90">
              Kirtan
            </p>
            <h1
              className="font-gujarati text-3xl font-semibold leading-tight text-foreground md:text-[2.35rem] md:leading-snug"
              lang="gu"
            >
              {k.title}
            </h1>
            {k.titleTransliterated ? (
              <p
                className="text-lg text-muted-foreground md:text-xl"
                lang="gu-Latn"
              >
                {k.titleTransliterated}
              </p>
            ) : null}
          </div>

          <dl className="grid gap-3 rounded-2xl border border-border/60 bg-card/60 px-4 py-4 text-sm shadow-sm sm:grid-cols-2 lg:grid-cols-4">
            <MetaItem term="Author" value={author} />
            <MetaItem term="Category" value={category} />
            <MetaItem term="Raag" value={raag} />
            <MetaItem term="Source" value={k.sourceName} emphasize />
          </dl>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="lg" className="rounded-full" asChild>
              <Link
                href={`/search?q=${encodeURIComponent(k.title.slice(0, 24))}`}
              >
                Similar titles
              </Link>
            </Button>
          </div>
        </header>

        {primaryAudio ? (
          <KirtanDetailAudioPanel
            slug={k.slug}
            title={k.title}
            titleLatin={k.titleTransliterated}
            url={primaryAudio.url}
            recordingLabel={primaryAudio.title}
          />
        ) : (
          <section
            aria-labelledby="no-audio-heading"
            className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-5 py-6 text-center"
          >
            <h2 id="no-audio-heading" className="text-sm font-medium text-foreground">
              No recording linked yet
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              You can still read every translation we have. Check back later or browse{" "}
              <Link href="/search" className="font-medium text-primary underline-offset-4 hover:underline">
                other kirtans with audio
              </Link>
              .
            </p>
          </section>
        )}

        <ListenReadBanner slug={k.slug} />

        <KirtanDetailReader detail={k} slug={k.slug} shareUrl={shareUrl} />

        {k.audios.length > 1 ? (
          <section aria-labelledby="more-audio-heading" className="space-y-4">
            <h2
              id="more-audio-heading"
              className="text-sm font-medium uppercase tracking-wide text-muted-foreground"
            >
              More recordings
            </h2>
            <ul className="list-none space-y-3 p-0">
              {k.audios.slice(1).map((a) => (
                <li key={a.url}>
                  <RecordingRow
                    slug={k.slug}
                    title={k.title}
                    titleLatin={k.titleTransliterated}
                    url={a.url}
                    label={a.title ?? "Alternate recording"}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section
          aria-labelledby="related-heading"
          className="space-y-4 border-t border-border/40 pt-10"
        >
          <h2 id="related-heading" className="font-display text-xl font-medium">
            Related bhajans
          </h2>
          {related.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              When the catalog links similar pieces, they will show up here. Try{" "}
              <Link
                href="/browse"
                className="font-medium text-primary hover:underline"
              >
                browsing by category
              </Link>{" "}
              for now.
            </p>
          ) : (
            <ul className="grid list-none gap-4 p-0 sm:grid-cols-2">
              {related.map((r) => (
                <li key={r.id}>
                  <KirtanCard kirtan={r} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </article>
    </KirtanReaderProvider>
  );
}

function MetaItem({
  term,
  value,
  emphasize,
}: {
  term: string;
  value: string | null;
  emphasize?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
        {term}
      </dt>
      <dd
        className={`mt-1 truncate leading-snug ${emphasize ? "font-medium text-foreground" : "text-foreground/90"}`}
        title={value ?? undefined}
      >
        {value ?? (
          <span className="text-muted-foreground">Not specified</span>
        )}
      </dd>
    </div>
  );
}

function RecordingRow({
  slug,
  title,
  titleLatin,
  url,
  label,
}: {
  slug: string;
  title: string;
  titleLatin?: string | null;
  url: string;
  label: string;
}) {
  const { nowPlaying, isPlaying, play, toggle } = useAudio();
  const active = nowPlaying?.slug === slug && nowPlaying?.url === url;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/50 px-4 py-3">
      <p className="min-w-0 text-sm font-medium text-foreground">{label}</p>
      <Button
        type="button"
        size="sm"
        variant={active && isPlaying ? "secondary" : "outline"}
        className="rounded-full"
        aria-pressed={active && isPlaying}
        onClick={() => {
          if (active) toggle();
          else play({ slug, title, url, titleLatin });
        }}
      >
        {active && isPlaying ? "Pause" : "Play"}
      </Button>
    </div>
  );
}
