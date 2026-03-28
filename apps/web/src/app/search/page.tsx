import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Button, Input } from "@ngb/ui";
import { searchKirtans } from "@/lib/queries";
import { KirtanCard } from "@/components/kirtan-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
  description: "Search kirtans by title, transliteration, or summary.",
  alternates: { canonical: "/search" },
};

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const results = await searchKirtans(q, 48);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Search</h1>
        <p className="text-muted-foreground">
          Matches title, Gujlish/transliteration, and short descriptions.
        </p>
      </header>

      <form
        action="/search"
        method="get"
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
        role="search"
      >
        <label htmlFor="search-q" className="sr-only">
          Search query
        </label>
        <Input
          id="search-q"
          name="q"
          type="search"
          enterKeyHint="search"
          placeholder="Type a title or phrase…"
          defaultValue={q}
          className="sm:max-w-md"
          autoComplete="off"
          spellCheck={false}
        />
        <Button type="submit">Search</Button>
      </form>

      <section aria-live="polite" className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">Results</h2>
          <Badge variant="muted">{results.length} found</Badge>
        </div>
        {results.length === 0 ? (
          <p className="text-muted-foreground" role="status">
            No matches. Try a shorter phrase or browse{" "}
            <Link href="/kirtans" className="text-primary underline">
              all kirtans
            </Link>
            .
          </p>
        ) : (
          <ul className="grid list-none gap-4 p-0 sm:grid-cols-2">
            {results.map((k) => (
              <li key={k.id}>
                <KirtanCard kirtan={k} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
