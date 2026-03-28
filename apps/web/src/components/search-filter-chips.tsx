"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@ngb/ui";

function cloneSp(sp: URLSearchParams) {
  return new URLSearchParams(sp.toString());
}

function toggleAudio(sp: URLSearchParams) {
  const n = cloneSp(sp);
  if (n.get("audio") === "1") n.delete("audio");
  else n.set("audio", "1");
  return `/search?${n.toString()}`;
}

function toggleEnglish(sp: URLSearchParams) {
  const n = cloneSp(sp);
  if (n.get("english") === "1") n.delete("english");
  else n.set("english", "1");
  return `/search?${n.toString()}`;
}

function toggleChip(sp: URLSearchParams, chip: string) {
  const n = cloneSp(sp);
  if (n.get("chip") === chip) n.delete("chip");
  else n.set("chip", chip);
  return `/search?${n.toString()}`;
}

export function SearchFilterChips() {
  const params = useSearchParams();
  const sp = new URLSearchParams(params?.toString() ?? "");

  const isAudio = sp.get("audio") === "1";
  const isEnglish = sp.get("english") === "1";
  const chip = sp.get("chip");

  return (
    <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Quick filters">
      <ChipLink href={toggleAudio(sp)} active={isAudio} label="With audio" />
      <ChipLink href={toggleEnglish(sp)} active={isEnglish} label="With English" />
      <ChipLink href={toggleChip(sp, "arti")} active={chip === "arti"} label="Arti" />
      <ChipLink
        href={toggleChip(sp, "prarthana")}
        active={chip === "prarthana"}
        label="Prarthana"
      />
      <ChipLink href={toggleChip(sp, "dhun")} active={chip === "dhun"} label="Dhun" />
      <ChipLink
        href={toggleChip(sp, "popular")}
        active={chip === "popular"}
        label="Popular"
      />
    </div>
  );
}

function ChipLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-full border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border/80 bg-card text-muted-foreground hover:border-primary/25 hover:bg-accent/60 hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
