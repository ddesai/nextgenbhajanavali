import { createWriteStream } from "node:fs";
import { mkdir, readdir, readFile } from "node:fs/promises";
import { finished } from "node:stream/promises";
import { join, dirname } from "node:path";
import type { IngestQueueItem } from "@ngb/content-schema";
import type { SourceAdapter } from "../core/adapter-interface.js";
import type { Logger } from "../core/logger.js";
import type { IngestPaths } from "../core/types.js";

type Envelope = {
  meta: {
    sourceKey: string;
    fetchedAt: string;
    url: string;
    queue: IngestQueueItem;
  };
  body: string;
};

export async function runNormalize(opts: {
  adapter: SourceAdapter;
  paths: IngestPaths;
  log: Logger;
}) {
  const dir = opts.paths.snapshotDir(opts.adapter.meta.id);
  const outPath = opts.paths.normalizedFile(opts.adapter.meta.id);
  await mkdir(dirname(outPath), { recursive: true });

  const files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
  const stream = createWriteStream(outPath, { flags: "w" });

  for (const file of files.sort()) {
    const full = join(dir, file);
    let envelope: Envelope;
    try {
      envelope = JSON.parse(await readFile(full, "utf8")) as Envelope;
    } catch (e) {
      opts.log("warn", "normalize.skip_invalid_file", {
        file,
        err: e instanceof Error ? e.message : String(e),
      });
      continue;
    }

    try {
      const parsed = opts.adapter.parseSnapshotBody(envelope.body);
      const norm = opts.adapter.normalize(parsed, {
        fetchedAt: envelope.meta.fetchedAt,
        sourceUrl: envelope.meta.url,
        queueItem: envelope.meta.queue,
      });
      stream.write(`${JSON.stringify(norm)}\n`);
    } catch (e) {
      opts.log("warn", "normalize.skip", {
        file,
        sourceKey: envelope.meta?.sourceKey,
        err: e instanceof Error ? e.message : String(e),
      });
    }
  }

  stream.end();
  await finished(stream);

  opts.log("info", "normalize.done", { outPath, snapshots: files.length });
}
