import { Skeleton } from "@ngb/ui";

export default function KirtanLoading() {
  return (
    <div className="space-y-10 pb-8">
      <div className="space-y-5">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-full max-w-2xl" />
        <Skeleton className="h-6 w-3/4 max-w-xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-9 w-full max-w-xl rounded-full" />
      <Skeleton className="min-h-[280px] w-full rounded-2xl" />
      <Skeleton className="h-36 w-full rounded-2xl" />
    </div>
  );
}
