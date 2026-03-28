import type { IngestRecord } from "@ngb/content-schema";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { assertChecksumNotReusedForOtherSlug } from "./ingest-guardrails.js";
import { sql } from "./client.js";

/** Idempotent upsert used by batch sync tools and the ingest CLI. */
export async function upsertIngestRecord(record: IngestRecord) {
  if (!process.env.NGB_INGEST_SKIP_CHECKSUM_GUARD) {
    await assertChecksumNotReusedForOtherSlug(record);
  }

  const lastIngestedAt = new Date().toISOString();
  const kirtanMetadata = {
    ...(record.kirtan.metadata as Record<string, unknown>),
    lastIngestedAt,
  };

  const sourceRows = await sql<
    { id: string }[]
  >`
    INSERT INTO "Source" ("id", "slug", "name", "description", "baseUrl", "type", "metadata")
    VALUES (
      ${randomUUID()},
      ${record.source.slug},
      ${record.source.name},
      ${record.source.description ?? null},
      ${record.source.baseUrl ?? null},
      ${record.source.type}::"SourceType",
      ${sql.json(record.source.metadata as unknown as postgres.JSONValue)}
    )
    ON CONFLICT ("slug") DO UPDATE SET
      "name" = EXCLUDED."name",
      "description" = EXCLUDED."description",
      "baseUrl" = EXCLUDED."baseUrl",
      "type" = EXCLUDED."type",
      "metadata" = EXCLUDED."metadata",
      "updatedAt" = NOW()
    RETURNING id
  `;
  const source = sourceRows[0]!;

  const kRows = await sql<{ id: string }[]>`
    INSERT INTO "Kirtan" (
      "id",
      "sourceId",
      "externalId",
      "slug",
      "title",
      "titleTransliterated",
      "summary",
      "publishedAt",
      "metadata",
      "searchDocument"
    )
    VALUES (
      ${randomUUID()},
      ${source.id},
      ${record.kirtan.externalId ?? null},
      ${record.kirtan.slug},
      ${record.kirtan.title},
      ${record.kirtan.titleTransliterated ?? null},
      ${record.kirtan.summary ?? null},
      ${record.kirtan.publishedAt ?? null},
      ${sql.json(kirtanMetadata as unknown as postgres.JSONValue)},
      ''
    )
    ON CONFLICT ("slug") DO UPDATE SET
      "sourceId" = EXCLUDED."sourceId",
      "externalId" = EXCLUDED."externalId",
      "title" = EXCLUDED."title",
      "titleTransliterated" = EXCLUDED."titleTransliterated",
      "summary" = EXCLUDED."summary",
      "publishedAt" = EXCLUDED."publishedAt",
      "metadata" = EXCLUDED."metadata",
      "updatedAt" = NOW()
    RETURNING id
  `;
  const kirtan = kRows[0]!;

  await sql`DELETE FROM "KirtanText" WHERE "kirtanId" = ${kirtan.id}`;
  await sql`DELETE FROM "KirtanAudio" WHERE "kirtanId" = ${kirtan.id}`;

  for (const t of record.texts) {
    await sql`
      INSERT INTO "KirtanText" (
        "id", "kirtanId", kind, content, locale, "sortOrder", metadata
      )
      VALUES (
        ${randomUUID()},
        ${kirtan.id},
        ${t.kind}::"KirtanTextKind",
        ${t.content},
        ${t.locale ?? null},
        ${t.sortOrder},
        ${sql.json(t.metadata as unknown as postgres.JSONValue)}
      )
    `;
  }

  for (const a of record.audios) {
    await sql`
      INSERT INTO "KirtanAudio" (
        "id", "kirtanId", url, "mimeType", "durationSec", title, "sortOrder", metadata
      )
      VALUES (
        ${randomUUID()},
        ${kirtan.id},
        ${a.url},
        ${a.mimeType ?? null},
        ${a.durationSec ?? null},
        ${a.title ?? null},
        ${a.sortOrder},
        ${sql.json(a.metadata as unknown as postgres.JSONValue)}
      )
    `;
  }

  return { sourceId: source.id, kirtanId: kirtan.id };
}
