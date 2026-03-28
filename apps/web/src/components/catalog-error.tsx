import Link from "next/link";
import { Button } from "@ngb/ui";

type Props = {
  title?: string;
  message: string;
  hint?: string;
};

/** Graceful failure when catalog queries throw (DB down, missing migration, etc.). */
export function CatalogError({
  title = "Something went wrong",
  message,
  hint,
}: Props) {
  return (
    <div
      className="rounded-2xl border border-destructive/25 bg-destructive/5 px-5 py-6 text-center"
      role="alert"
    >
      <p className="font-display text-lg font-medium text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{message}</p>
      {hint ? (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button asChild variant="default" className="rounded-full">
          <Link href="/">Home</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/about">About</Link>
        </Button>
      </div>
    </div>
  );
}
