import { createReadStream } from "node:fs";
import { appendFile, mkdir } from "node:fs/promises";
import { createInterface } from "node:readline";
import { dirname } from "node:path";
import { IngestQueueItemSchema } from "@ngb/content-schema";
import { request as playwrightRequest } from "playwright";
import type { SourceAdapter } from "../core/adapter-interface.js";
import { sha256Hex } from "../core/checksum.js";
import { RateLimiter } from "../core/rate-limit.js";
import { ResumeStore } from "../core/resume-store.js";
import { writeSnapshot } from "../core/snapshot-store.js";
import type { Logger } from "../core/logger.js";
import type { CrawlContext, IngestPaths } from "../core/types.js";

export type ExtractOptions = {
  adapter: SourceAdapter;
  paths: IngestPaths;
  queueFile: string;
  minDelayMs: number;
  userAgent: string;
  log: Logger;
  limit?: number;
  skipUnchanged: boolean;
  maxConsecutiveErrors?: number;
};

export async function runExtract(opts: ExtractOptions) {
  const resume = await ResumeStore.load(
    opts.paths.resumeFile(opts.adapter.meta.id),
    opts.adapter.meta.id,
  );
  await mkdir(opts.paths.snapshotDir(opts.adapter.meta.id), {
    recursive: true,
  });

  const ctx: CrawlContext = {
    paths: opts.paths,
    adapterId: opts.adapter.meta.id,
    limiter: new RateLimiter(opts.minDelayMs),
    userAgent: opts.userAgent,
    log: opts.log,
  };

  const http = await playwrightRequest.newContext({
    userAgent: opts.userAgent,
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9,gu;q=0.8",
    },
  });

  let processed = 0;
  let consecutiveErrors = 0;
  const errPath = opts.paths.errorsFile(opts.adapter.meta.id);
  await mkdir(dirname(errPath), { recursive: true });

  try {
    const rl = createInterface({
      input: createReadStream(opts.queueFile, "utf8"),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const item = IngestQueueItemSchema.parse(JSON.parse(trimmed));
      if (item.adapterId !== opts.adapter.meta.id) continue;

      try {
        const result = await opts.adapter.crawlOne(ctx, http, item);
        const cks = sha256Hex(result.body);
        if (opts.skipUnchanged && resume.shouldSkip(item.sourceKey, cks, true)) {
          opts.log("debug", "extract.skip_unchanged", {
            sourceKey: item.sourceKey,
          });
          continue;
        }

        await writeSnapshot(opts.paths.snapshotDir(opts.adapter.meta.id), result);
        resume.markSuccess(item.sourceKey, cks, result.httpStatus);
        await resume.persist();
        consecutiveErrors = 0;
        processed++;
        opts.log("info", "extract.snapshot", {
          sourceKey: item.sourceKey,
          httpStatus: result.httpStatus,
        });
      } catch (e) {
        consecutiveErrors++;
        const msg = e instanceof Error ? e.message : String(e);
        opts.log("error", "extract.fail", { sourceKey: item.sourceKey, msg });
        await appendFile(
          errPath,
          `${JSON.stringify({
            phase: "extract",
            sourceKey: item.sourceKey,
            kind: "exception",
            message: msg,
          })}\n`,
          "utf8",
        );
        if (
          opts.maxConsecutiveErrors &&
          consecutiveErrors >= opts.maxConsecutiveErrors
        ) {
          opts.log("error", "extract.abort_consecutive_errors");
          break;
        }
      }

      if (opts.limit && processed >= opts.limit) break;
    }
  } finally {
    await http.dispose();
  }
}
