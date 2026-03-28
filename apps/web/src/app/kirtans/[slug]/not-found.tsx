import Link from "next/link";
import { Button } from "@ngb/ui";

export default function KirtanNotFound() {
  return (
    <div className="space-y-4 py-8 text-center">
      <h1 className="text-2xl font-semibold">Kirtan not found</h1>
      <p className="text-muted-foreground">
        That slug is not in the catalog yet. Try search or browse collections.
      </p>
      <div className="flex justify-center gap-3">
        <Button asChild>
          <Link href="/search">Search</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/kirtans">Browse</Link>
        </Button>
      </div>
    </div>
  );
}
