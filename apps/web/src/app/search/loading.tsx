import { SearchResultsSkeleton } from "@/components/result-skeletons";

export default function SearchLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-muted/80" />
        <div className="h-4 w-full max-w-md animate-pulse rounded bg-muted/60" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-9 w-24 animate-pulse rounded-full bg-muted/80"
          />
        ))}
      </div>
      <SearchResultsSkeleton />
    </div>
  );
}
