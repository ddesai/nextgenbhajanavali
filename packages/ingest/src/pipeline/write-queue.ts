import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { SourceAdapter } from "../core/adapter-interface.js";
import type { Logger } from "../core/logger.js";
import type { IngestPaths } from "../core/types.js";

export async function writeDiscoveryQueue(opts: {
  adapter: SourceAdapter;
  paths: IngestPaths;
  parts: number[];
  from: number;
  to: number;
  log: Logger;
}): Promise<string> {
  const target = opts.paths.queueFile(opts.adapter.meta.id);
  await mkdir(dirname(target), { recursive: true });
  const lines: string[] = [];
  for await (const item of opts.adapter.discoverRange({
    parts: opts.parts,
    from: opts.from,
    to: opts.to,
  })) {
    lines.push(JSON.stringify(item));
  }
  await writeFile(target, `${lines.join("\n")}\n`, "utf8");
  opts.log("info", "discovery.queue.written", {
    path: target,
    count: lines.length,
  });
  return target;
}
