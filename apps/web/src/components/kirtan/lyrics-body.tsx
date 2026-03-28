"use client";

import { cn } from "@ngb/ui";
import { LYRICS_SCALE_CLASSES, type LyricsScale } from "./kirtan-reader-context";

/** Prefer paragraph breaks; fall back to single lines as light stanzas. */
export function splitLyricsIntoStanzas(content: string): string[] {
  const t = content.trim();
  if (!t) return [];
  const byPara = t.split(/\n\s*\n+/).map((s) => s.trim()).filter(Boolean);
  if (byPara.length > 1) return byPara;
  const lines = t.split("\n").map((s) => s.trim()).filter(Boolean);
  return lines.length > 0 ? lines : [t];
}

type Props = {
  content: string | undefined;
  lyricsScale: LyricsScale;
  /** URL slug — builds stable `#verse-{prefix}-{slug}-{n}` anchors */
  slug: string;
  /** e.g. `gu` / `latin` when two columns share one page */
  idPrefix?: string;
  className?: string;
  lang?: string;
  fontClassName?: string;
  emptyLabel?: string;
};

export function LyricsBody({
  content,
  lyricsScale,
  slug,
  idPrefix = "lyrics",
  className,
  lang,
  fontClassName,
  emptyLabel = "Not available for this kirtan.",
}: Props) {
  const stanzas = content ? splitLyricsIntoStanzas(content) : [];

  if (!content || stanzas.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border/80 bg-muted/30 px-4 py-8 text-center text-sm leading-relaxed text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  const scaleClass = LYRICS_SCALE_CLASSES[lyricsScale];

  return (
    <div className={cn("lyrics-stanza-stack space-y-8 md:space-y-10", className)}>
      {stanzas.map((stanza, i) => {
        const vid = `verse-${idPrefix}-${slug}-${i + 1}`;
        return (
          <section
            key={i}
            id={vid}
            className="verse-anchor scroll-mt-32 md:scroll-mt-36"
            aria-label={`Verse ${i + 1}`}
          >
            <p
              className={cn(
                "lyrics-block whitespace-pre-line text-foreground",
                scaleClass,
                fontClassName,
              )}
              lang={lang}
            >
              {stanza}
            </p>
          </section>
        );
      })}
    </div>
  );
}
