#!/usr/bin/env node
/**
 * Placeholder for a source-specific parser (e.g. Anirdesh). Emits JSON lines
 * validated with `IngestRecordSchema` for `tools/sync`.
 */
import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import { IngestRecordSchema } from "@ngb/content-schema";

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error(
      "Usage: pnpm --filter @ngb/tool-parser-anirdesh start -- <file.jsonl|file.json>",
    );
    process.exit(1);
  }

  if (path.endsWith(".jsonl")) {
    const rl = createInterface({ input: createReadStream(path, "utf8") });
    for await (const line of rl) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const record = IngestRecordSchema.parse(JSON.parse(trimmed));
      process.stdout.write(`${JSON.stringify(record)}\n`);
    }
    return;
  }

  const raw = await readFile(path, "utf8");
  const record = IngestRecordSchema.parse(JSON.parse(raw));
  process.stdout.write(`${JSON.stringify(record)}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
