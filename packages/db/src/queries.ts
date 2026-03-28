import type { Prisma } from "./generated/prisma/client.js";
import {
  BROWSE_CATEGORIES,
  type BrowseCategorySlug,
} from "./browse-presets.js";
import {
  KirtanDetailSchema,
  KirtanSummarySchema,
  type KirtanDetail,
  type KirtanSearchHit,
  type KirtanSummary,
} from "@ngb/content-schema";
import { prisma } from "./client.js";
import { searchKirtansAdvanced } from "./search-engine.js";
import {
  buildKirtanWhere,
  type KirtanListFilters,
} from "./search-filters.js";

const kirtanListInclude = {
  source: { select: { slug: true, name: true } },
  audios: { select: { id: true }, take: 1 },
  texts: {
    where: { kind: "ENGLISH_TRANSLATION" as const },
    select: { id: true },
    take: 1,
  },
} satisfies Prisma.KirtanInclude;

function readMeta(m: unknown): Record<string, unknown> | null {
  if (!m || typeof m !== "object" || Array.isArray(m)) return null;
  return m as Record<string, unknown>;
}

function popularScoreFromMeta(meta: Record<string, unknown> | null): number {
  if (!meta) return 0;
  const v = meta.popularScore;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") return parseInt(v, 10) || 0;
  return 0;
}

function toSummary(
  row: Prisma.KirtanGetPayload<{ include: typeof kirtanListInclude }>,
): KirtanSummary {
  const meta = readMeta(row.metadata);
  const categoryEnglish =
    typeof meta?.categoryEnglish === "string" ? meta.categoryEnglish : null;
  return KirtanSummarySchema.parse({
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleTransliterated: row.titleTransliterated,
    summary: row.summary,
    sourceSlug: row.source.slug,
    sourceName: row.source.name,
    hasAudio: row.audios.length > 0,
    hasEnglish: row.texts.length > 0,
    categoryEnglish,
    popularScore: popularScoreFromMeta(meta) || undefined,
  });
}

export async function searchKirtans(
  q: string,
  take = 24,
): Promise<KirtanSummary[]> {
  const hits = await searchKirtansFiltered(
    { q, take },
    { orderPopular: false },
  );
  return hits.map((h) => KirtanSummarySchema.parse(h));
}

type SearchOptions = { orderPopular?: boolean };

/** Full-text search with total count (UI pagination, `/api/search`). */
export async function searchKirtansWithTotal(
  filters: KirtanListFilters,
  options: SearchOptions = {},
) {
  const hasQuery = !!(filters.q?.trim());
  const sort =
    filters.sort ??
    (options.orderPopular && !hasQuery ? "popular" : undefined);

  return searchKirtansAdvanced({
    q: filters.q,
    hasAudio: filters.hasAudio,
    hasEnglish: filters.hasEnglish,
    chip: filters.chip,
    author: filters.author,
    category: filters.category,
    raag: filters.raag,
    take: filters.take,
    skip: filters.skip,
    sort,
  });
}

export async function searchKirtansFiltered(
  filters: KirtanListFilters,
  options: SearchOptions = {},
): Promise<KirtanSearchHit[]> {
  const { hits } = await searchKirtansWithTotal(filters, options);
  return hits;
}

export async function getKirtanBySlug(slug: string): Promise<KirtanDetail | null> {
  const row = await prisma.kirtan.findUnique({
    where: { slug },
    include: {
      source: { select: { slug: true, name: true } },
      texts: { orderBy: [{ sortOrder: "asc" }, { kind: "asc" }] },
      audios: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!row) return null;

  const meta = readMeta(row.metadata);

  const info = meta
    ? {
        categoryGujarati:
          typeof meta.categoryGujarati === "string"
            ? meta.categoryGujarati
            : null,
        categoryEnglish:
          typeof meta.categoryEnglish === "string"
            ? meta.categoryEnglish
            : null,
        raagGujarati:
          typeof meta.raagGujarati === "string" ? meta.raagGujarati : null,
        raagEnglish:
          typeof meta.raagEnglish === "string" ? meta.raagEnglish : null,
        author: typeof meta.author === "string" ? meta.author : null,
        authorLatin:
          typeof meta.authorLatin === "string" ? meta.authorLatin : null,
        sourceKey:
          typeof meta.sourceKey === "string" ? meta.sourceKey : null,
        externalId: row.externalId,
      }
    : undefined;

  return KirtanDetailSchema.parse({
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleTransliterated: row.titleTransliterated,
    summary: row.summary,
    sourceSlug: row.source.slug,
    sourceName: row.source.name,
    hasAudio: row.audios.length > 0,
    hasEnglish: row.texts.some((t) => t.kind === "ENGLISH_TRANSLATION"),
    categoryEnglish:
      typeof meta?.categoryEnglish === "string"
        ? meta.categoryEnglish
        : undefined,
    popularScore: popularScoreFromMeta(meta) || undefined,
    texts: row.texts.map((t) => ({
      kind: t.kind,
      content: t.content,
      locale: t.locale,
      sortOrder: t.sortOrder,
    })),
    audios: row.audios.map((a) => ({
      url: a.url,
      title: a.title,
      durationSec: a.durationSec,
      mimeType: a.mimeType,
      sortOrder: a.sortOrder,
    })),
    info,
  });
}

export async function listCollections() {
  return prisma.collection.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      _count: { select: { kirtans: true } },
    },
  });
}

export async function getCollectionBySlug(slug: string) {
  const col = await prisma.collection.findUnique({
    where: { slug },
    include: {
      kirtans: {
        orderBy: { sortOrder: "asc" },
        include: {
          kirtan: { include: kirtanListInclude },
        },
      },
    },
  });
  if (!col) return null;
  return {
    id: col.id,
    slug: col.slug,
    name: col.name,
    description: col.description,
    kirtans: col.kirtans.map((r) => ({
      sortOrder: r.sortOrder,
      kirtan: toSummary(r.kirtan),
    })),
  };
}

export async function getRelatedKirtans(kirtanId: string, take = 8) {
  const rels = await prisma.kirtanRelation.findMany({
    where: { OR: [{ fromKirtanId: kirtanId }, { toKirtanId: kirtanId }] },
    take: take * 2,
    include: {
      fromKirtan: { include: kirtanListInclude },
      toKirtan: { include: kirtanListInclude },
    },
  });

  const summaries = new Map<string, KirtanSummary>();
  for (const r of rels) {
    const a = r.fromKirtanId === kirtanId ? r.toKirtan : r.fromKirtan;
    if (a.id !== kirtanId) summaries.set(a.id, toSummary(a));
    if (summaries.size >= take) break;
  }

  const list = [...summaries.values()];
  if (list.length > 0) return list;

  const sameCat = await prisma.kirtan.findFirst({
    where: { id: kirtanId },
    select: { metadata: true },
  });
  const cat = readMeta(sameCat?.metadata)?.categoryEnglish;
  if (typeof cat === "string") {
    const fallbacks = await prisma.kirtan.findMany({
      where: {
        id: { not: kirtanId },
        metadata: { path: ["categoryEnglish"], equals: cat },
      },
      take,
      include: kirtanListInclude,
    });
    return fallbacks.map(toSummary);
  }

  return [];
}

export async function getBrowseCategoryStats(): Promise<
  { slug: BrowseCategorySlug; label: string; blurb: string; count: number }[]
> {
  const out: {
    slug: BrowseCategorySlug;
    label: string;
    blurb: string;
    count: number;
  }[] = [];

  for (const slug of Object.keys(BROWSE_CATEGORIES) as BrowseCategorySlug[]) {
    const def = BROWSE_CATEGORIES[slug];
    const w = buildKirtanWhere({ chip: slug });
    const count = await prisma.kirtan.count({
      where: w,
    });
    out.push({
      slug,
      label: def.label,
      blurb: def.blurb,
      count,
    });
  }

  return out;
}

export async function listKirtansByBrowseSlug(
  slug: string,
  take = 48,
): Promise<KirtanSummary[]> {
  const s = slug.toLowerCase();
  if (!(s in BROWSE_CATEGORIES)) return [];
  const where = buildKirtanWhere({ chip: s });
  const rows = await prisma.kirtan.findMany({
    where,
    take,
    orderBy: { title: "asc" },
    include: kirtanListInclude,
  });
  return rows.map(toSummary);
}

export {
  buildKirtanWhere,
  type KirtanListFilters,
} from "./search-filters.js";
export {
  BROWSE_CATEGORIES,
  BROWSE_CATEGORY_SLUGS,
  type BrowseCategorySlug,
} from "./browse-presets.js";