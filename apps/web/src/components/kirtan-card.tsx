import type { KirtanSearchHit, KirtanSummary } from "@ngb/content-schema";
import Link from "next/link";
import { Badge } from "@ngb/ui";
import { SearchSnippet } from "@/components/search-snippet";

type Props = { kirtan: KirtanSummary | KirtanSearchHit };

export function KirtanCard({ kirtan }: Props) {
  const snippet = "snippet" in kirtan ? kirtan.snippet : undefined;
  return (
    <article className="group rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm transition hover:border-primary/20 hover:shadow-md">
      <Link
        href={`/kirtans/${kirtan.slug}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl -m-1 p-1"
      >
        <h2 className="font-gujarati text-lg font-semibold leading-snug text-foreground transition group-hover:text-primary md:text-xl">
          {kirtan.title}
        </h2>
        {kirtan.titleTransliterated ? (
          <p lang="gu-Latn" className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {kirtan.titleTransliterated}
          </p>
        ) : null}
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {kirtan.categoryEnglish ? (
          <span className="text-xs font-medium uppercase tracking-wide text-primary/90">
            {kirtan.categoryEnglish}
          </span>
        ) : null}
        <Badge variant="muted" className="font-normal">
          {kirtan.sourceName}
        </Badge>
        {kirtan.hasAudio ? (
          <Badge className="font-normal">Audio</Badge>
        ) : null}
        {kirtan.hasEnglish ? (
          <Badge variant="secondary" className="font-normal">
            English
          </Badge>
        ) : null}
      </div>

      {snippet ? (
        <SearchSnippet
          text={snippet}
          className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted-foreground font-gujarati"
        />
      ) : kirtan.summary ? (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {kirtan.summary}
        </p>
      ) : null}
    </article>
  );
}
