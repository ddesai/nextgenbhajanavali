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
import { sql } from "./client.js";
import { searchKirtansAdvanced } from "./search-engine.js";
import {
  buildKirtanFilterSql,
  type KirtanListFilters,
} from "./search-filters.js";

type KirtanListRow = {
  id: string;
  slug: string;
  title: string;
  titleTransliterated: string | null;
  summary: string | null;
  metadata: unknown;
  sourceSlug: string;
  sourceName: string;
  hasAudio: boolean;
  hasEnglish: boolean;
};

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

function toSummary(row: KirtanListRow): KirtanSummary {
  const meta = readMeta(row.metadata);
  const categoryEnglish =
    typeof meta?.categoryEnglish === "string" ? meta.categoryEnglish : null;
  return KirtanSummarySchema.parse({
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleTransliterated: row.titleTransliterated,
    summary: row.summary,
    sourceSlug: row.sourceSlug,
    sourceName: row.sourceName,
    hasAudio: row.hasAudio,
    hasEnglish: row.hasEnglish,
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
  const kRows = await sql<
    {
      id: string;
      sourceSlug: string;
      sourceName: string;
      externalId: string | null;
      metadata: unknown;
      slug: string;
      title: string;
      titleTransliterated: string | null;
      summary: string | null;
    }[]
  >`
    SELECT
      k.id,
      k.slug,
      k.title,
      k."titleTransliterated",
      k.summary,
      k."externalId",
      k.metadata,
      s.slug AS "sourceSlug",
      s.name AS "sourceName"
    FROM "Kirtan" k
    INNER JOIN "Source" s ON s.id = k."sourceId"
    WHERE k.slug = ${slug}
  `;
  const row = kRows[0];
  if (!row) return null;

  const [texts, audios] = await Promise.all([
    sql<
      {
        kind: string;
        content: string;
        locale: string | null;
        sortOrder: number;
      }[]
    >`
      SELECT kind, content, locale, "sortOrder"
      FROM "KirtanText"
      WHERE "kirtanId" = ${row.id}
      ORDER BY "sortOrder" ASC, kind ASC
    `,
    sql<
      {
        url: string;
        title: string | null;
        durationSec: number | null;
        mimeType: string | null;
        sortOrder: number;
      }[]
    >`
      SELECT url, title, "durationSec", "mimeType", "sortOrder"
      FROM "KirtanAudio"
      WHERE "kirtanId" = ${row.id}
      ORDER BY "sortOrder" ASC
    `,
  ]);

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
        sourceKey: typeof meta.sourceKey === "string" ? meta.sourceKey : null,
        externalId: row.externalId,
      }
    : undefined;

  return KirtanDetailSchema.parse({
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleTransliterated: row.titleTransliterated,
    summary: row.summary,
    sourceSlug: row.sourceSlug,
    sourceName: row.sourceName,
    hasAudio: audios.length > 0,
    hasEnglish: texts.some((t) => t.kind === "ENGLISH_TRANSLATION"),
    categoryEnglish:
      typeof meta?.categoryEnglish === "string"
        ? meta.categoryEnglish
        : undefined,
    popularScore: popularScoreFromMeta(meta) || undefined,
    texts: texts.map((t) => ({
      kind: t.kind,
      content: t.content,
      locale: t.locale,
      sortOrder: t.sortOrder,
    })),
    audios: audios.map((a) => ({
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
  return sql<
    {
      id: string;
      slug: string;
      name: string;
      description: string | null;
      kirtan_count: number;
    }[]
  >`
    SELECT
      c.id,
      c.slug,
      c.name,
      c.description,
      (SELECT count(*)::int FROM "KirtanCollection" kc WHERE kc."collectionId" = c.id) AS kirtan_count
    FROM "Collection" c
    ORDER BY c."sortOrder" ASC, c.name ASC
  `.then((rows) =>
    rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description,
      _count: { kirtans: r.kirtan_count },
    })),
  );
}

export async function getCollectionBySlug(slug: string) {
  const colRows = await sql<
    {
      id: string;
      slug: string;
      name: string;
      description: string | null;
    }[]
  >`
    SELECT id, slug, name, description
    FROM "Collection"
    WHERE slug = ${slug}
  `;
  const col = colRows[0];
  if (!col) return null;

  const rows = await sql<(KirtanListRow & { linkSortOrder: number })[]>`
    SELECT
      k.id,
      k.slug,
      k.title,
      k."titleTransliterated",
      k.summary,
      k.metadata,
      s.slug AS "sourceSlug",
      s.name AS "sourceName",
      EXISTS (SELECT 1 FROM "KirtanAudio" a WHERE a."kirtanId" = k.id) AS "hasAudio",
      EXISTS (
        SELECT 1 FROM "KirtanText" t
        WHERE t."kirtanId" = k.id AND t.kind = 'ENGLISH_TRANSLATION'
      ) AS "hasEnglish",
      kc."sortOrder" AS "linkSortOrder"
    FROM "KirtanCollection" kc
    INNER JOIN "Kirtan" k ON k.id = kc."kirtanId"
    INNER JOIN "Source" s ON s.id = k."sourceId"
    WHERE kc."collectionId" = ${col.id}
    ORDER BY kc."sortOrder" ASC
  `;

  return {
    id: col.id,
    slug: col.slug,
    name: col.name,
    description: col.description,
    kirtans: rows.map((r) => ({
      sortOrder: r.linkSortOrder,
      kirtan: toSummary(r),
    })),
  };
}

export async function getRelatedKirtans(kirtanId: string, take = 8) {
  const rels = await sql<
    {
      fromKirtanId: string;
      toKirtanId: string;
    }[]
  >`
    SELECT "fromKirtanId", "toKirtanId"
    FROM "KirtanRelation"
    WHERE "fromKirtanId" = ${kirtanId} OR "toKirtanId" = ${kirtanId}
    LIMIT ${take * 2}
  `;

  const otherIds: string[] = [];
  for (const r of rels) {
    const oid = r.fromKirtanId === kirtanId ? r.toKirtanId : r.fromKirtanId;
    if (oid !== kirtanId && !otherIds.includes(oid)) otherIds.push(oid);
    if (otherIds.length >= take) break;
  }

  if (otherIds.length > 0) {
    const rows = await sql<KirtanListRow[]>`
      SELECT
        k.id,
        k.slug,
        k.title,
        k."titleTransliterated",
        k.summary,
        k.metadata,
        s.slug AS "sourceSlug",
        s.name AS "sourceName",
        EXISTS (SELECT 1 FROM "KirtanAudio" a WHERE a."kirtanId" = k.id) AS "hasAudio",
        EXISTS (
          SELECT 1 FROM "KirtanText" t
          WHERE t."kirtanId" = k.id AND t.kind = 'ENGLISH_TRANSLATION'
        ) AS "hasEnglish"
      FROM "Kirtan" k
      INNER JOIN "Source" s ON s.id = k."sourceId"
      WHERE k.id in ${sql(otherIds)}
    `;
    const byId = new Map(rows.map((row) => [row.id, row]));
    return otherIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((row) => toSummary(row!));
  }

  const sameCat = await sql<{ metadata: unknown }[]>`
    SELECT metadata FROM "Kirtan" WHERE id = ${kirtanId} LIMIT 1
  `;
  const cat = readMeta(sameCat[0]?.metadata)?.categoryEnglish;
  if (typeof cat !== "string") return [];

  const fallbacks = await sql<KirtanListRow[]>`
    SELECT
      k.id,
      k.slug,
      k.title,
      k."titleTransliterated",
      k.summary,
      k.metadata,
      s.slug AS "sourceSlug",
      s.name AS "sourceName",
      EXISTS (SELECT 1 FROM "KirtanAudio" a WHERE a."kirtanId" = k.id) AS "hasAudio",
      EXISTS (
        SELECT 1 FROM "KirtanText" t
        WHERE t."kirtanId" = k.id AND t.kind = 'ENGLISH_TRANSLATION'
      ) AS "hasEnglish"
    FROM "Kirtan" k
    INNER JOIN "Source" s ON s.id = k."sourceId"
    WHERE k.id != ${kirtanId}
      AND k.metadata->>'categoryEnglish' = ${cat}
    LIMIT ${take}
  `;
  return fallbacks.map(toSummary);
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
    const filterSql = buildKirtanFilterSql({ chip: slug });
    const cntRows = await sql<{ count: bigint }[]>`
      SELECT count(*)::bigint AS count FROM "Kirtan" k WHERE ${filterSql as never}
    `;
    out.push({
      slug,
      label: def.label,
      blurb: def.blurb,
      count: Number(cntRows[0]?.count ?? 0),
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
  const filterSql = buildKirtanFilterSql({ chip: s });
  const rows = await sql<KirtanListRow[]>`
    SELECT
      k.id,
      k.slug,
      k.title,
      k."titleTransliterated",
      k.summary,
      k.metadata,
      s.slug AS "sourceSlug",
      s.name AS "sourceName",
      EXISTS (SELECT 1 FROM "KirtanAudio" a WHERE a."kirtanId" = k.id) AS "hasAudio",
      EXISTS (
        SELECT 1 FROM "KirtanText" t
        WHERE t."kirtanId" = k.id AND t.kind = 'ENGLISH_TRANSLATION'
      ) AS "hasEnglish"
    FROM "Kirtan" k
    INNER JOIN "Source" s ON s.id = k."sourceId"
    WHERE ${filterSql as never}
    ORDER BY k.title ASC
    LIMIT ${take}
  `;
  return rows.map(toSummary);
}

/** For `sitemap.xml`: slugs + lastmod. */
export async function getSitemapKirtansAndCollections() {
  const [kirtans, collections] = await Promise.all([
    sql<{ slug: string; updatedAt: Date }[]>`
      SELECT slug, "updatedAt" FROM "Kirtan"
    `,
    sql<{ slug: string; updatedAt: Date }[]>`
      SELECT slug, "updatedAt" FROM "Collection"
    `,
  ]);
  return { kirtans, collections };
}

export {
  buildKirtanFilterSql,
  type KirtanListFilters,
} from "./search-filters.js";
export {
  BROWSE_CATEGORIES,
  BROWSE_CATEGORY_SLUGS,
  type BrowseCategorySlug,
} from "./browse-presets.js";