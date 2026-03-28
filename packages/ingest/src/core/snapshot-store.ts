import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { RawCrawlResult } from "./types.js";

function safeSegment(key: string) {
  return key.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

export async function writeSnapshot(
  dir: string,
  result: RawCrawlResult,
): Promise<string> {
  await mkdir(dir, { recursive: true });
  const file = join(dir, `${safeSegment(result.queueItem.sourceKey)}.json`);
  const payload = {
    meta: {
      sourceKey: result.queueItem.sourceKey,
      adapterId: result.queueItem.adapterId,
      url: result.url,
      httpStatus: result.httpStatus,
      contentType: result.contentType,
      fetchedAt: result.fetchedAt,
      queue: result.queueItem,
    },
    body: result.body,
  };
  await writeFile(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return file;
}
