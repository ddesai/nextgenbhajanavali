import Link from "next/link";
import { Button } from "@ngb/ui";

const links = [
  { href: "/browse", label: "Browse" },
  { href: "/search", label: "Search" },
  { href: "/collections", label: "Collections" },
  { href: "/about", label: "About" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="mx-auto max-w-2xl px-4 pt-3 sm:px-6">
        <div className="flex items-center justify-between gap-2 pb-2">
          <Link
            href="/"
            className="group min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="block truncate font-semibold tracking-tight text-foreground transition group-hover:text-primary">
              Bhajanavali
            </span>
            <span className="block text-[0.7rem] font-normal uppercase tracking-[0.14em] text-muted-foreground">
              Next Gen
            </span>
          </Link>
          <nav
            aria-label="Primary"
            className="hidden min-w-0 items-center gap-0.5 sm:flex sm:flex-wrap sm:justify-end"
          >
            {links.map(({ href, label }) => (
              <Button
                key={href}
                variant="ghost"
                size="sm"
                className="shrink-0 text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link href={href}>{label}</Link>
              </Button>
            ))}
          </nav>
        </div>

        <form
          action="/search"
          method="get"
          role="search"
          className="flex gap-2 pb-3"
        >
          <label htmlFor="global-search" className="sr-only">
            Search kirtans
          </label>
          <input
            id="global-search"
            name="q"
            type="search"
            placeholder="Search by title, words, or transliteration…"
            autoComplete="off"
            spellCheck={false}
            className="h-11 w-full rounded-xl border border-input bg-card/60 px-4 text-base shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
          />
          <Button type="submit" className="h-11 shrink-0 rounded-xl px-5">
            Search
          </Button>
        </form>

        <nav
          aria-label="Mobile sections"
          className="-mx-1 flex gap-1 overflow-x-auto border-t border-border/40 py-2 sm:hidden"
        >
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
