import type { IngestRecord } from "@ngb/content-schema";
import type { Prisma } from "./generated/prisma/client.js";
import { assertChecksumNotReusedForOtherSlug } from "./ingest-guardrails.js";
import { prisma } from "./client.js";

function json(meta: Record<string, unknown>): Prisma.InputJsonValue {
  return meta as Prisma.InputJsonValue;
}

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

  const source = await prisma.source.upsert({
    where: { slug: record.source.slug },
    create: { ...record.source, metadata: json(record.source.metadata) },
    update: {
      name: record.source.name,
      description: record.source.description,
      baseUrl: record.source.baseUrl,
      type: record.source.type,
      metadata: json(record.source.metadata),
    },
  });

  const kirtan = await prisma.kirtan.upsert({
    where: { slug: record.kirtan.slug },
    create: {
      slug: record.kirtan.slug,
      title: record.kirtan.title,
      titleTransliterated: record.kirtan.titleTransliterated,
      summary: record.kirtan.summary,
      externalId: record.kirtan.externalId,
      publishedAt: record.kirtan.publishedAt,
      metadata: json(kirtanMetadata),
      sourceId: source.id,
    },
    update: {
      title: record.kirtan.title,
      titleTransliterated: record.kirtan.titleTransliterated,
      summary: record.kirtan.summary,
      externalId: record.kirtan.externalId,
      publishedAt: record.kirtan.publishedAt,
      metadata: json(kirtanMetadata),
      sourceId: source.id,
    },
  });

  await prisma.kirtanText.deleteMany({ where: { kirtanId: kirtan.id } });
  await prisma.kirtanAudio.deleteMany({ where: { kirtanId: kirtan.id } });

  if (record.texts.length > 0) {
    await prisma.kirtanText.createMany({
      data: record.texts.map((t) => ({
        kirtanId: kirtan.id,
        kind: t.kind,
        content: t.content,
        locale: t.locale,
        sortOrder: t.sortOrder,
        metadata: json(t.metadata),
      })),
    });
  }
  if (record.audios.length > 0) {
    await prisma.kirtanAudio.createMany({
      data: record.audios.map((a) => ({
        kirtanId: kirtan.id,
        url: a.url,
        mimeType: a.mimeType,
        durationSec: a.durationSec,
        title: a.title,
        sortOrder: a.sortOrder,
        metadata: json(a.metadata),
      })),
    });
  }

  return { sourceId: source.id, kirtanId: kirtan.id };
}
