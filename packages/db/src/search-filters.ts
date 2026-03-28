import type { SearchSort } from "./search-engine.js";
import { sql } from "./client.js";

export type KirtanListFilters = {
  q?: string;
  hasAudio?: boolean;
  hasEnglish?: boolean;
  /** `arti` | `prarthana` | `dhun` | `popular` */
  chip?: string;
  /** Substring match on `metadata.author` / `metadata.authorLatin`. */
  author?: string;
  /** Substring on `metadata.categoryEnglish` / `metadata.categoryGujarati`. */
  category?: string;
  /** Substring on `metadata.raagEnglish` / `metadata.raagGujarati`. */
  raag?: string;
  sort?: SearchSort;
  take?: number;
  skip?: number;
};

/** Safe `%term%` for `ILIKE ... ESCAPE '\\'`. */
export function ilikeContainsPattern(s: string): string {
  const esc = s
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
  return `%${esc}%`;
}

function sqlAnd(fragments: unknown[]): unknown {
  const parts = fragments.filter(Boolean);
  if (parts.length === 0) return sql`TRUE`;
  let acc: unknown = parts[0];
  for (let i = 1; i < parts.length; i++)
    acc = sql`${acc as never} AND ${parts[i] as never}`;
  return acc;
}

/** SQL boolean expression for `k` (Kirtan row alias). Empty filters → `TRUE`. */
export function buildKirtanFilterSql(filters: KirtanListFilters): unknown {
  const parts: unknown[] = [];

  const q = filters.q?.trim();
  if (q) {
    const p = ilikeContainsPattern(q);
    parts.push(sql`(
      k.title ILIKE ${p} ESCAPE '\\'
      OR k."titleTransliterated" ILIKE ${p} ESCAPE '\\'
      OR k.summary ILIKE ${p} ESCAPE '\\'
    )`);
  }

  if (filters.hasAudio) {
    parts.push(
      sql`EXISTS (SELECT 1 FROM "KirtanAudio" a0 WHERE a0."kirtanId" = k.id)`,
    );
  }

  if (filters.hasEnglish) {
    parts.push(sql`EXISTS (
      SELECT 1 FROM "KirtanText" te
      WHERE te."kirtanId" = k.id AND te.kind = 'ENGLISH_TRANSLATION'
    )`);
  }

  const chip = filters.chip?.toLowerCase();
  if (chip === "arti") {
    parts.push(sql`(
      k.metadata->>'categoryEnglish' = 'Arti'
      OR k.title LIKE ${"%આરતી%"}
      OR lower(coalesce(k.summary, '')) LIKE ${"%arti%"}
    )`);
  } else if (chip === "prarthana") {
    parts.push(sql`(
      k.metadata->>'categoryEnglish' = 'Prarthana'
      OR lower(coalesce(k.summary, '')) LIKE ${"%prarthana%"}
    )`);
  } else if (chip === "dhun") {
    parts.push(sql`(
      k.metadata->>'categoryEnglish' = 'Dhun'
      OR lower(coalesce(k.summary, '')) LIKE ${"%dhun%"}
    )`);
  }

  return sqlAnd(parts);
}
