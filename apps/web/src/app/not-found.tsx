import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@ngb/ui";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md space-y-6 py-12 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        404
      </p>
      <h1 className="font-display text-2xl font-medium text-foreground">
        This page isn&apos;t here
      </h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        The link may be old, or the kirtan was moved. Try search or browse from home.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild className="rounded-full">
          <Link href="/">Home</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/search">Search</Link>
        </Button>
      </div>
    </div>
  );
}
