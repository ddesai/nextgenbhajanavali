#!/usr/bin/env node
/**
 * DB sync from validated parser output. The web app never imports this —
 * run as a batch job in CI or on a schedule.
 */
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { IngestRecordSchema, type IngestRecord } from "@ngb/content-schema";
import { prisma } from "@ngb/db";
import type { Prisma } from "@prisma/client";

function json(meta: Record<string, unknown>): Prisma.InputJsonValue {
  return meta as Prisma.InputJsonValue;
}

async function upsertRecord(record: IngestRecord) {
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
      metadata: json(record.kirtan.metadata),
      sourceId: source.id,
    },
    update: {
      title: record.kirtan.title,
      titleTransliterated: record.kirtan.titleTransliterated,
      summary: record.kirtan.summary,
      externalId: record.kirtan.externalId,
      publishedAt: record.kirtan.publishedAt,
      metadata: json(record.kirtan.metadata),
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
}

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error(
      "Usage: DATABASE_URL=... pnpm --filter @ngb/tool-sync start -- ingest.jsonl",
    );
    process.exit(1);
  }

  const rl = createInterface({ input: createReadStream(path, "utf8") });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const record = IngestRecordSchema.parse(JSON.parse(trimmed));
    await upsertRecord(record);
    console.error(`Upserted ${record.kirtan.slug}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
