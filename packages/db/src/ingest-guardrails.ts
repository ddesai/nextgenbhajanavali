import type { IngestRecord } from "@ngb/content-schema";
import { prisma } from "./client.js";

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

  const hit = await prisma.kirtan.findFirst({
    where: {
      slug: { not: record.kirtan.slug },
      metadata: {
        path: ["checksumSha256"],
        equals: checksum,
      },
    },
    select: {
      slug: true,
      source: { select: { slug: true } },
    },
  });

  if (!hit) return;

  throw new Error(
    `[ingest] Checksum conflict: "${checksum.slice(0, 16)}…" is already stored under slug "${hit.slug}" ` +
      `(source "${hit.source.slug}"). Refusing to upsert "${record.kirtan.slug}" to avoid duplicate content aliases. ` +
      `Set NGB_INGEST_SKIP_CHECKSUM_GUARD=1 only if you intend to override.`,
  );
}
