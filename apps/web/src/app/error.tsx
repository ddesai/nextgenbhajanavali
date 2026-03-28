"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@ngb/ui";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md space-y-6 py-12 text-center">
      <h1 className="font-display text-2xl font-medium text-foreground">
        This page couldn&apos;t load
      </h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {error.message || "An unexpected error occurred. You can try again or go back home."}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button type="button" className="rounded-full" onClick={() => reset()}>
          Try again
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
