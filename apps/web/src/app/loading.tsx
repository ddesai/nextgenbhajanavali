import { Skeleton } from "@ngb/ui";

export default function RootLoading() {
  return (
    <div className="space-y-8 pb-8" aria-busy="true" aria-label="Loading page">
      <Skeleton className="h-8 w-3/4 max-w-md" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </div>
  );
}
