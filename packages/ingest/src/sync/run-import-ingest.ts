import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { IngestRecordSchema } from "@ngb/content-schema";
import { prisma, upsertIngestRecord } from "@ngb/db";
import type { Logger } from "../core/logger.js";

/**
 * Manual / admin import of pre-built `IngestRecord` JSON lines (e.g. CSV pipeline output).
 * Each line must pass `IngestRecordSchema`—the same contract as `tools/sync`.
 */
export async function runImportIngestFile(opts: {
  path: string;
  log: Logger;
  dryRun?: boolean;
}): Promise<void> {
  const rl = createInterface({
    input: createReadStream(opts.path, "utf8"),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const record = IngestRecordSchema.parse(JSON.parse(trimmed));
    if (opts.dryRun) {
      opts.log("info", "import.dry_run", { slug: record.kirtan.slug });
      continue;
    }
    await upsertIngestRecord(record);
    opts.log("info", "import.upserted", { slug: record.kirtan.slug });
  }
}
