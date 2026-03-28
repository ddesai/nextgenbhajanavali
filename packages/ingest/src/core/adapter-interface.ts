import type { IngestQueueItem, NormalizedKirtan } from "@ngb/content-schema";
import type { APIRequestContext } from "playwright";
import type { CrawlContext, RawCrawlResult, SourceAdapterMeta } from "./types.js";

/**
 * Per-source adapter: discovery → HTTP fetch (Playwright request API) → parse → normalize.
 * Parsing stays pure where possible; I/O lives in the pipeline runners.
 * Use `APIRequestContext` only (no browser window). Adapters that need a real browser
 * can be extended later with an explicit `meta.needsBrowser` + runner branch.
 */
export interface SourceAdapter {
  meta: SourceAdapterMeta;

  /** Phase 1: enumerate work items (no full document fetch required). */
  discoverRange(opts: {
    parts: number[];
    from: number;
    to: number;
  }): AsyncIterable<IngestQueueItem>;

  /** Phase 2: fetch + return raw bytes/string for snapshots. */
  crawlOne(
    ctx: CrawlContext,
    http: APIRequestContext,
    item: IngestQueueItem,
  ): Promise<RawCrawlResult>;

  /** Phase 3: parse snapshot `body` (JSON, HTML, …) into a typed structure. */
  parseSnapshotBody(body: string): unknown;

  /** Phase 4: map parsed API/HTML object → normalized kirtan + checksum. */
  normalize(
    parsed: unknown,
    meta: { fetchedAt: string; sourceUrl: string; queueItem: IngestQueueItem },
  ): NormalizedKirtan;
}
