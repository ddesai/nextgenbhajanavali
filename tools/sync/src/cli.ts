#!/usr/bin/env node
/**
 * DB sync from validated parser output. Prefer `tools/ingest sync` for the full pipeline.
 */
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { IngestRecordSchema } from "@ngb/content-schema";
import { prisma, upsertIngestRecord } from "@ngb/db";

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
    await upsertIngestRecord(record);
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
