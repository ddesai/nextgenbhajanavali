import Link from "next/link";
import { Button } from "@ngb/ui";

const nav = [
  { href: "/kirtans", label: "Browse" },
  { href: "/search", label: "Search" },
  { href: "/collections", label: "Collections" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Next Gen Bhajanavali
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1">
          {nav.map(({ href, label }) => (
            <Button
              key={href}
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              asChild
            >
              <Link href={href}>{label}</Link>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
