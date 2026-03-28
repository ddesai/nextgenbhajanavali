"use client";

type Props = {
  slug: string;
  stanzaCount: number;
  idPrefix: string;
  label?: string;
};

/** In-page outline: links to `#verse-{idPrefix}-{slug}-{n}` (matches LyricsBody). */
export function KirtanVerseJump({
  slug,
  stanzaCount,
  idPrefix,
  label = "Jump to verse",
}: Props) {
  if (stanzaCount < 3) return null;

  return (
    <nav
      aria-label={label}
      className="rounded-2xl border border-border/60 bg-muted/25 px-3 py-3 text-sm"
    >
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Verses
      </p>
      <ol className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto p-0 list-none">
        {Array.from({ length: stanzaCount }, (_, i) => {
          const n = i + 1;
          const href = `#verse-${idPrefix}-${slug}-${n}`;
          return (
            <li key={n}>
              <a
                href={href}
                className="inline-flex min-h-[2rem] min-w-[2rem] items-center justify-center rounded-full border border-border/70 bg-card px-2.5 py-1 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {n}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
