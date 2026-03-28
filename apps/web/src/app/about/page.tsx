import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/metadata";

export const metadata: Metadata = {
  title: "About",
  description: "Why Next Gen Bhajanavali exists and how we handle content.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About · Bhajanavali",
    description:
      "A calm reader for Gujarati kirtans—with transliteration, English when available, and simple listening.",
    url: absoluteUrl("/about"),
  },
};

export default function AboutPage() {
  return (
    <div className="space-y-8 pb-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-medium">About Bhajanavali</h1>
        <p className="text-muted-foreground">Made for calm reading and listening.</p>
      </header>

      <div className="space-y-6 text-base leading-relaxed text-foreground/90">
        <p>
          <strong className="font-medium text-foreground">Next Gen Bhajanavali</strong>{" "}
          is a careful reader for Swaminarayan and related kirtans: Gujarati first,
          with Gujulish transliteration and English when we have it, plus simple
          audio playback when a recording is linked.
        </p>
        <p>
          The interface is deliberately quiet—large type for lyrics, generous
          line-height, and nothing that competes with the words you came to sit
          with.
        </p>
        <p>
          Data may come from curated sources or respectful ingestion pipelines.
          Always honor the original site, copyright, and community guidelines before
          sharing or redistributing text or audio.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/25 p-6">
        <h2 className="font-medium text-foreground">Try next</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            <Link href="/search" className="text-primary hover:underline">
              Search the catalog
            </Link>
          </li>
          <li>
            <Link href="/browse" className="text-primary hover:underline">
              Browse by category
            </Link>
          </li>
          <li>
            <Link href="/collections" className="text-primary hover:underline">
              Curated collections
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
