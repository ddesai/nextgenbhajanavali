import {
  KirtanSearchHitSchema,
  type KirtanSearchHit,
} from "@ngb/content-schema";
import { Prisma } from "./generated/prisma/client.js";
import { prisma } from "./client.js";

/** Pagination + ranking modes. */
export type SearchSort = "relevance" | "title_asc" | "title_desc" | "popular";

export type KirtanSearchParams = {
  q?: string;
  hasAudio?: boolean;
  hasEnglish?: boolean;
  chip?: string /** browse chip: arti | prarthana | dhun | popular */;
  author?: string;
  category?: string;
  raag?: string;
  take?: number;
  skip?: number;
  sort?: SearchSort;
};

const HL_OPEN = "\uE000";
const HL_CLOSE = "\uE001";

function clampTake(t: number | undefined) {
  if (!t || t < 1) return 24;
  return Math.min(t, 100);
}

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

/** Escape `%` / `_` for `ILIKE ... ESCAPE '\\'`. */
function ilikeContainsPattern(s: string): string {
  const esc = s
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
  return `%${esc}%`;
}

/** De-accent Latin so “Hāre” and “Hare” share a retrieval branch. */
function foldLatinQuery(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function wantsFoldedTsqueryBranch(q: string): boolean {
  if (!/[a-zA-Z]/.test(q)) return false;
  const folded = foldLatinQuery(q);
  const plain = q.trim().toLowerCase().replace(/\s+/g, " ");
  return folded.length > 0 && folded !== plain;
}

function buildTsCombinedSql(q: string): Prisma.Sql {
  const a = Prisma.sql`websearch_to_tsquery('simple', ${q})`;
  if (!wantsFoldedTsqueryBranch(q)) return a;
  const folded = foldLatinQuery(q);
  const b = Prisma.sql`websearch_to_tsquery('simple', ${folded})`;
  return Prisma.sql`(${a} || ${b})`;
}

function chipWhereSql(chip: string | undefined): Prisma.Sql {
  const c = chip?.toLowerCase();
  if (!c || c === "popular") return Prisma.empty;
  if (c === "arti") {
    return Prisma.sql`AND (
      k.metadata->>'categoryEnglish' = 'Arti'
      OR k.title LIKE ${"%આરતી%"}
      OR lower(coalesce(k.summary, '')) LIKE ${"%arti%"}
    )`;
  }
  if (c === "prarthana") {
    return Prisma.sql`AND (
      k.metadata->>'categoryEnglish' = 'Prarthana'
      OR lower(coalesce(k.summary, '')) LIKE ${"%prarthana%"}
    )`;
  }
  if (c === "dhun") {
    return Prisma.sql`AND (
      k.metadata->>'categoryEnglish' = 'Dhun'
      OR lower(coalesce(k.summary, '')) LIKE ${"%dhun%"}
    )`;
  }
  return Prisma.empty;
}

function defaultSort(
  params: KirtanSearchParams,
  hasQuery: boolean,
): SearchSort {
  if (hasQuery) return "relevance";
  const chip = params.chip?.toLowerCase();
  if (chip === "popular") return "popular";
  return "title_asc";
}

function orderBySql(
  sort: SearchSort,
  hasQuery: boolean,
  tsCombined: Prisma.Sql | null,
  trgmNeedle: string,
): Prisma.Sql {
  if (sort === "popular") {
    return Prisma.sql`ORDER BY COALESCE(NULLIF(TRIM(k.metadata->>'popularScore'), ''), '0')::int DESC NULLS LAST, k.title ASC`;
  }
  if (sort === "title_desc") {
    return Prisma.sql`ORDER BY k.title DESC`;
  }
  if (sort === "title_asc" || !hasQuery || !tsCombined) {
    return Prisma.sql`ORDER BY k.title ASC`;
  }
  return Prisma.sql`ORDER BY (
    COALESCE(ts_rank_cd(k."searchVector", ${tsCombined}, 32), 0)::float8 * 12.0
    + CASE WHEN char_length(${trgmNeedle}) >= 3 THEN
        GREATEST(
          similarity(left(k."searchDocument", 8000), ${trgmNeedle}),
          similarity(coalesce(k.title, '') || ' ' || coalesce(k."titleTransliterated", ''), ${trgmNeedle})
        )::float8
      ELSE 0::float8 END
  ) DESC NULLS LAST, k.title ASC`;
}

export type KirtanSearchResponse = {
  hits: KirtanSearchHit[];
  total: number;
};

export async function searchKirtansAdvanced(
  params: KirtanSearchParams,
): Promise<KirtanSearchResponse> {
  const take = clampTake(params.take);
  const skip = Math.max(0, params.skip ?? 0);
  const rawQ = params.q?.trim() ?? "";
  const qLimited = rawQ.slice(0, 280);
  const hasQuery = qLimited.length > 0;
  const sort = params.sort ?? defaultSort(params, hasQuery);

  const hasAudio = !!params.hasAudio;
  const hasEnglish = !!params.hasEnglish;
  const chip = params.chip?.toLowerCase();

  const author = params.author?.trim().slice(0, 120) ?? "";
  const category = params.category?.trim().slice(0, 120) ?? "";
  const raag = params.raag?.trim().slice(0, 120) ?? "";

  const trgmNeedle = qLimited.slice(0, 200).trim();
  const tsCombined = hasQuery ? buildTsCombinedSql(qLimited) : null;

  const audioSql = hasAudio
    ? Prisma.sql`AND EXISTS (SELECT 1 FROM "KirtanAudio" a WHERE a."kirtanId" = k.id)`
    : Prisma.empty;
  const englishSql = hasEnglish
    ? Prisma.sql`AND EXISTS (SELECT 1 FROM "KirtanText" t0 WHERE t0."kirtanId" = k.id AND t0.kind = 'ENGLISH_TRANSLATION')`
    : Prisma.empty;

  const authorSql =
    author.length > 0
      ? Prisma.sql`AND (
          k.metadata->>'author' ILIKE ${ilikeContainsPattern(author)} ESCAPE '\\'
          OR k.metadata->>'authorLatin' ILIKE ${ilikeContainsPattern(author)} ESCAPE '\\'
        )`
      : Prisma.empty;

  const categorySql =
    category.length > 0
      ? Prisma.sql`AND (
          k.metadata->>'categoryEnglish' ILIKE ${ilikeContainsPattern(category)} ESCAPE '\\'
          OR k.metadata->>'categoryGujarati' ILIKE ${ilikeContainsPattern(category)} ESCAPE '\\'
        )`
      : Prisma.empty;

  const raagSql =
    raag.length > 0
      ? Prisma.sql`AND (
          k.metadata->>'raagEnglish' ILIKE ${ilikeContainsPattern(raag)} ESCAPE '\\'
          OR k.metadata->>'raagGujarati' ILIKE ${ilikeContainsPattern(raag)} ESCAPE '\\'
        )`
      : Prisma.empty;

  const chipSql = chipWhereSql(chip);

  const matchSql =
    !hasQuery || !tsCombined
      ? Prisma.sql`TRUE`
      : Prisma.sql`(
          k."searchVector" @@ ${tsCombined}
          OR (
            char_length(${trgmNeedle}) >= 3 AND (
              left(k."searchDocument", 8000) % ${trgmNeedle}
              OR (coalesce(k.title, '') || ' ' || coalesce(k."titleTransliterated", '')) % ${trgmNeedle}
            )
          )
        )`;

  const headlineOpts = `StartSel=${HL_OPEN},StopSel=${HL_CLOSE},MaxWords=34,MinWords=12,ShortWord=2,MaxFragments=2,HighlightAll=false`;

  const snippetSql =
    hasQuery && tsCombined
      ? Prisma.sql`ts_headline(
          'simple',
          left(coalesce(k.summary, '') || E'\n' || k."searchDocument", 12000),
          ${tsCombined},
          ${headlineOpts}
        )`
      : Prisma.sql`left(trim(coalesce(k.summary, '') || ' ' || left(k."searchDocument", 320)), 420)`;

  const orderSql = orderBySql(sort, hasQuery, tsCombined, trgmNeedle);

  const rows = await prisma.$queryRaw<
    {
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
      snippet: string | null;
      fullCount: bigint;
    }[]
  >(Prisma.sql`
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
        SELECT 1 FROM "KirtanText" t1
        WHERE t1."kirtanId" = k.id AND t1.kind = 'ENGLISH_TRANSLATION'
      ) AS "hasEnglish",
      ${snippetSql} AS snippet,
      COUNT(*) OVER() AS "fullCount"
    FROM "Kirtan" k
    INNER JOIN "Source" s ON s.id = k."sourceId"
    WHERE ${matchSql}
    ${audioSql}
    ${englishSql}
    ${authorSql}
    ${categorySql}
    ${raagSql}
    ${chipSql}
    ${orderSql}
    OFFSET ${skip}
    LIMIT ${take}
  `);

  const total = rows[0] ? Number(rows[0].fullCount) : 0;

  const hits = rows.map((r) => {
    const meta = readMeta(r.metadata);
    const categoryEnglish =
      typeof meta?.categoryEnglish === "string" ? meta.categoryEnglish : null;
    return KirtanSearchHitSchema.parse({
      id: r.id,
      slug: r.slug,
      title: r.title,
      titleTransliterated: r.titleTransliterated,
      summary: r.summary,
      sourceSlug: r.sourceSlug,
      sourceName: r.sourceName,
      hasAudio: r.hasAudio,
      hasEnglish: r.hasEnglish,
      categoryEnglish,
      popularScore: popularScoreFromMeta(meta) || undefined,
      snippet: r.snippet?.trim() || undefined,
    });
  });

  return { hits, total };
}
