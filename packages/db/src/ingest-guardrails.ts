import type { IngestRecord } from "@ngb/content-schema";
import { sql } from "./client.js";

/**
 * Prevent two different public slugs from sharing the same canonical checksum
 * (usually indicates a slug-strategy bug or duplicate source keys).
 */
export async function assertChecksumNotReusedForOtherSlug(
  record: IngestRecord,
): Promise<void> {
  const meta = record.kirtan.metadata as Record<string, unknown> | undefined;
  const checksum = meta?.checksumSha256;
  if (typeof checksum !== "string" || checksum.length !== 64) return;

  const hitRows = await sql<{ slug: string; source_slug: string }[]>`
    SELECT k.slug, s.slug AS source_slug
    FROM "Kirtan" k
    INNER JOIN "Source" s ON s.id = k."sourceId"
    WHERE k.slug != ${record.kirtan.slug}
      AND k.metadata->>'checksumSha256' = ${checksum}
    LIMIT 1
  `;
  const hit = hitRows[0];
  if (!hit) return;

  throw new Error(
    `[ingest] Checksum conflict: "${checksum.slice(0, 16)}…" is already stored under slug "${hit.slug}" ` +
      `(source "${hit.source_slug}"). Refusing to upsert "${record.kirtan.slug}" to avoid duplicate content aliases. ` +
      `Set NGB_INGEST_SKIP_CHECKSUM_GUARD=1 only if you intend to override.`,
  );
}
