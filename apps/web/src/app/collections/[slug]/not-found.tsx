import Link from "next/link";
import { Button } from "@ngb/ui";

export default function CollectionNotFound() {
  return (
    <div className="space-y-4 py-8 text-center">
      <h1 className="text-2xl font-semibold">Collection not found</h1>
      <Button asChild>
        <Link href="/collections">Back to collections</Link>
      </Button>
    </div>
  );
}
