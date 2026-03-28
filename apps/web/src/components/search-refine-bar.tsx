"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@ngb/ui";
import type { SearchSort } from "@ngb/db";

type SortKey = SearchSort;

function buildSearchUrl(
  sp: URLSearchParams,
  patch: Record<string, string | undefined>,
) {
  const n = new URLSearchParams(sp.toString());
  for (const [key, val] of Object.entries(patch)) {
    if (val === undefined || val === "") n.delete(key);
    else n.set(key, val);
  }
  const qs = n.toString();
  return qs ? `/search?${qs}` : "/search";
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Best match" },
  { value: "title_asc", label: "Title A–Z" },
  { value: "title_desc", label: "Title Z–A" },
  { value: "popular", label: "Popular" },
];

export function SearchRefineBar() {
  const router = useRouter();
  const params = useSearchParams();
  const sp = new URLSearchParams(params?.toString() ?? "");

  const q = sp.get("q") ?? "";
  const author = sp.get("author") ?? "";
  const category = sp.get("category") ?? "";
  const raag = sp.get("raag") ?? "";
  const sort = (sp.get("sort") ?? "") as SortKey | "";
  const effectiveSort: SortKey =
    sort === "title_asc" ||
    sort === "title_desc" ||
    sort === "popular" ||
    sort === "relevance"
      ? sort
      : q.trim()
        ? "relevance"
        : sp.get("chip") === "popular"
          ? "popular"
          : "title_asc";

  function apply(patch: Record<string, string | undefined>) {
    router.push(buildSearchUrl(sp, patch));
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border/70 bg-card/40 p-4 shadow-sm">
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(ev) => {
          ev.preventDefault();
          const fd = new FormData(ev.currentTarget);
          apply({
            q: String(fd.get("q") ?? "").trim() || undefined,
          });
        }}
      >
        <div className="min-w-0 flex-1 space-y-1">
          <label
            htmlFor="search-q"
            className="text-xs font-medium text-muted-foreground"
          >
            Search lyrics & titles
          </label>
          <input
            id="search-q"
            name="q"
            type="search"
            enterKeyHint="search"
            defaultValue={q}
            autoComplete="off"
            placeholder="Words in Gujarati, transliteration, or English…"
            className="h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
          />
        </div>
        <Button type="submit" className="h-12 shrink-0 rounded-full px-6">
          Search
        </Button>
      </form>

      <div className="flex flex-col gap-1">
        <label htmlFor="search-sort" className="text-xs font-medium text-muted-foreground">
          Sort
        </label>
        <select
          id="search-sort"
          value={effectiveSort}
          onChange={(e) => apply({ sort: e.target.value })}
          className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(ev) => {
          ev.preventDefault();
          const fd = new FormData(ev.currentTarget);
          apply({
            author: String(fd.get("author") ?? "").trim() || undefined,
            category: String(fd.get("category") ?? "").trim() || undefined,
            raag: String(fd.get("raag") ?? "").trim() || undefined,
          });
        }}
      >
        <Field
          id="filter-author"
          name="author"
          label="Author"
          placeholder="e.g. Premanand"
          defaultValue={author}
        />
        <Field
          id="filter-category"
          name="category"
          label="Category"
          placeholder="e.g. Arti, ધૂન"
          defaultValue={category}
        />
        <Field
          id="filter-raag"
          name="raag"
          label="Raag"
          placeholder="e.g. Bhairavi"
          defaultValue={raag}
          className="sm:col-span-2"
        />
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" className="rounded-full">
            Apply filters
          </Button>
          {(author || category || raag) && (
            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              onClick={() => apply({ author: "", category: "", raag: "" })}
            >
              Clear metadata filters
            </Button>
          )}
        </div>
      </form>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Phrase search: wrap words in quotes (e.g.{" "}
        <span className="font-mono text-foreground/90">&quot;jay jay&quot;</span>
        ). Gujarati and Latin transliteration are both indexed.
      </p>
    </div>
  );
}

function Field({
  id,
  name,
  label,
  placeholder,
  defaultValue,
  className,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  defaultValue: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="search"
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete="off"
        className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
