import type { IngestQueueItem, NormalizedKirtan } from "@ngb/content-schema";
import type { SourceAdapter } from "../../core/adapter-interface.js";
import type { CrawlContext, RawCrawlResult } from "../../core/types.js";
import { DEFAULT_MOCK_ITEMS, MOCK_ARCHIVE_ADAPTER_ID } from "./config.js";
import { mockArchiveQueueItem, mockSnapshotToNormalized } from "./normalizer.js";
import {
  MockArchiveSnapshotSchema,
  type MockArchiveSnapshot,
} from "./parse-snapshot.js";

export function createMockArchiveAdapter(
  items: { key: string; ordinal: number }[] = DEFAULT_MOCK_ITEMS,
): SourceAdapter {
  async function* discoverRange(opts: {
    parts: number[];
    from: number;
    to: number;
  }): AsyncIterable<IngestQueueItem> {
    for (const row of items) {
      if (row.ordinal >= opts.from && row.ordinal <= opts.to) {
        yield mockArchiveQueueItem(row.key, row.ordinal);
      }
    }
  }

  function buildSnapshotBody(key: string): string {
    const titleGujarati =
      key === "alpha" ? "મોક શીર્ષક અલ્ફા" : "મોક શીર્ષક બીટા";
    const titleLatin = key === "alpha" ? "Mock title Alpha" : "Mock title Beta";
    const snap = MockArchiveSnapshotSchema.parse({
      kind: "mock-archive-v1",
      key,
      titleGujarati,
      titleLatin,
      gujaratiLyrics:
        key === "alpha"
          ? "જય સ્વામિનારાયણ\nજય ગુણાતીતાનંદ સ્વામી"
          : "શ્રી હરિ ના પગલે ચાલ્યા કરીએ",
      transliteration:
        key === "alpha"
          ? "Jaya Swaminarayan\nJaya Gunatitanand Swami"
          : "Shrī Hari nā pagle chālyā karīe",
      englishTranslation:
        key === "alpha"
          ? "Victory to Swaminarayan; victory to Gunatitanand Swami."
          : "Let us walk in the steps of Shri Hari.",
    });
    return JSON.stringify(snap);
  }

  return {
    meta: {
      id: MOCK_ARCHIVE_ADAPTER_ID,
      displayName: "Mock archive (offline)",
    },

    discoverRange,

    async crawlOne(ctx, _http, item): Promise<RawCrawlResult> {
      const key =
        typeof item.meta?.key === "string" ? item.meta.key : item.sourceKey.split(":").pop();
      if (!key) throw new Error("mock-archive: missing key");
      await ctx.limiter.throttle();
      const body = buildSnapshotBody(key);
      const fetchedAt = new Date().toISOString();
      return {
        queueItem: item,
        url: item.sourceUrl ?? `https://example.invalid/mock-archive/${key}`,
        httpStatus: 200,
        body,
        contentType: "application/json",
        fetchedAt,
      };
    },

    parseSnapshotBody(body: string): unknown {
      const j = JSON.parse(body) as unknown;
      return MockArchiveSnapshotSchema.parse(j);
    },

    normalize(
      parsed: unknown,
      meta: { fetchedAt: string; sourceUrl: string; queueItem: IngestQueueItem },
    ): NormalizedKirtan {
      return mockSnapshotToNormalized(parsed as MockArchiveSnapshot, {
        fetchedAt: meta.fetchedAt,
        queueItem: meta.queueItem,
      });
    },
  };
}
