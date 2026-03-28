import type { KirtanSummary } from "@ngb/content-schema";
import Link from "next/link";
import { Badge, Card, CardDescription, CardHeader, CardTitle } from "@ngb/ui";

type Props = { kirtan: KirtanSummary };

export function KirtanCard({ kirtan }: Props) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-lg leading-snug">
            <Link
              href={`/kirtans/${kirtan.slug}`}
              className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {kirtan.title}
            </Link>
          </CardTitle>
          {kirtan.titleTransliterated ? (
            <CardDescription lang="gu-Latn" className="w-full text-base">
              {kirtan.titleTransliterated}
            </CardDescription>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Availability">
          <Badge variant="muted">{kirtan.sourceName}</Badge>
          {kirtan.hasAudio ? <Badge>Audio</Badge> : null}
          {kirtan.hasEnglish ? <Badge variant="secondary">English</Badge> : null}
        </div>
        {kirtan.summary ? (
          <CardDescription className="line-clamp-3">{kirtan.summary}</CardDescription>
        ) : null}
      </CardHeader>
    </Card>
  );
}
