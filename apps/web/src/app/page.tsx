import Link from "next/link";
import { Button } from "@ngb/ui";
import { searchKirtans } from "@/lib/queries";
import { KirtanCard } from "@/components/kirtan-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await searchKirtans("", 6);

  return (
    <div className="space-y-10">
      <section className="space-y-4 text-center sm:text-left">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">
          Bhajans · Kirtans · Satsang
        </p>
        <h1 className="font-gujarati text-3xl font-semibold leading-tight sm:text-4xl">
          Next Gen Bhajanavali
        </h1>
        <p className="max-w-prose text-lg text-muted-foreground">
          Search and read devotional lyrics in Gujarati, with Gujlish
          transliteration and English where available. Listen when audio is
          provided—all in a fast, accessible, mobile-first experience.
        </p>
        <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
          <Button asChild size="lg">
            <Link href="/search">Search kirtans</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/collections">Browse collections</Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="featured-heading" className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 id="featured-heading" className="text-xl font-semibold">
            Featured
          </h2>
          <Link
            href="/kirtans"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            View all
          </Link>
        </div>
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2">
          {featured.map((k) => (
            <li key={k.id}>
              <KirtanCard kirtan={k} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
