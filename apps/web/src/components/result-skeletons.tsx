import { Skeleton } from "@ngb/ui";

export function KirtanCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
      <Skeleton className="mb-2 h-6 w-[min(100%,18rem)]" />
      <Skeleton className="h-4 w-[min(100%,14rem)]" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-10 w-full" />
    </div>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <KirtanCardSkeleton key={i} />
      ))}
    </div>
  );
}
