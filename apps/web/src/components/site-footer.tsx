import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50 bg-muted/20 py-10 text-center">
      <p className="mx-auto max-w-md px-4 text-sm leading-relaxed text-muted-foreground">
        Texts are offered for devotion and study. Confirm rights for audio and
        bulk reuse with the original source.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <Link href="/about" className="hover:text-foreground">
          About
        </Link>
        <Link href="/browse" className="hover:text-foreground">
          Categories
        </Link>
        <Link href="/collections" className="hover:text-foreground">
          Collections
        </Link>
      </div>
    </footer>
  );
}
