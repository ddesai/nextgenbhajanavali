import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { NormalizedKirtanSchema } from "@ngb/content-schema";
import { prisma, upsertIngestRecord } from "@ngb/db";
import { mapNormalizedToIngestRecord } from "./map-to-ingest.js";
import type { Logger } from "../core/logger.js";

export async function runSyncNormalizedFile(opts: {
  path: string;
  log: Logger;
  /** Skip DB upsert if checksum unchanged vs embedded metadata (not implemented — reserved). */
  dryRun?: boolean;
}) {
  const rl = createInterface({
    input: createReadStream(opts.path, "utf8"),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const norm = NormalizedKirtanSchema.parse(JSON.parse(trimmed));
    const record = mapNormalizedToIngestRecord(norm);
    if (opts.dryRun) {
      opts.log("info", "sync.dry_run", { slug: record.kirtan.slug });
      continue;
    }
    await upsertIngestRecord(record);
    opts.log("info", "sync.upserted", { slug: record.kirtan.slug });
  }
}

export async function disconnectPrisma() {
  await prisma.$disconnect();
}
