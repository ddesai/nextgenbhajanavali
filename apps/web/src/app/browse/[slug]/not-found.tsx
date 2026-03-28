import Link from "next/link";
import { Button } from "@ngb/ui";

export default function BrowseNotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="font-display text-2xl font-medium">Category not found</h1>
      <p className="mt-2 text-muted-foreground">
        That theme is not in the catalog navigator yet.
      </p>
      <Button asChild className="mt-6 rounded-full">
        <Link href="/browse">Back to browse</Link>
      </Button>
    </div>
  );
}
