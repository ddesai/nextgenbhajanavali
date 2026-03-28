import type {
  AnirdeshKirtanApi,
  IngestQueueItem,
  NormalizedKirtan,
} from "@ngb/content-schema";
import type { APIRequestContext } from "playwright";
import type { SourceAdapter } from "../../core/adapter-interface.js";
import type { CrawlContext, RawCrawlResult } from "../../core/types.js";
import { ANIRDESH_ADAPTER_ID, ANIRDESH_GETKIRTAN_URL } from "./config.js";
import { anirdeshQueueItem, anirdeshToNormalized } from "./normalizer.js";
import { parseAnirdeshApiResponseText } from "./parse-api.js";

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Retry transient upstream errors (rate limit, gateway, 5xx). */
async function postAnirdeshPayload(
  http: APIRequestContext,
  data: string,
): Promise<{ status: number; body: string }> {
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  };
  const maxAttempts = 3;
  let lastStatus = 0;
  let lastBody = "";
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const resp = await http.post(ANIRDESH_GETKIRTAN_URL, { headers, data });
    lastStatus = resp.status();
    lastBody = await resp.text();
    const transient = lastStatus === 429 || lastStatus >= 500;
    if (!transient) return { status: lastStatus, body: lastBody };
    if (attempt < maxAttempts) {
      await sleep(Math.min(12_000, 350 * 2 ** attempt));
    }
  }
  return { status: lastStatus, body: lastBody };
}

async function* discoverRange(opts: {
  parts: number[];
  from: number;
  to: number;
}): AsyncIterable<IngestQueueItem> {
  for (const part of opts.parts) {
    for (let no = opts.from; no <= opts.to; no++) {
      yield anirdeshQueueItem(part, no);
    }
  }
}

export function createAnirdeshAdapter(): SourceAdapter {
  return {
    meta: {
      id: ANIRDESH_ADAPTER_ID,
      displayName: "Anirdesh Kirtan Muktavali",
    },

    discoverRange,

    async crawlOne(ctx, http, item): Promise<RawCrawlResult> {
      if (!item.part || !item.no)
        throw new Error("Anirdesh queue item requires part and no");

      await ctx.limiter.throttle();

      const data = `part=${encodeURIComponent(String(item.part))}&no=${encodeURIComponent(String(item.no))}`;
      const { status, body } = await postAnirdeshPayload(http, data);
      const fetchedAt = new Date().toISOString();
      const url = `${ANIRDESH_GETKIRTAN_URL} (part=${item.part}&no=${item.no})`;

      return {
        queueItem: item,
        url,
        httpStatus: status,
        body,
        contentType: "application/json",
        fetchedAt,
      };
    },

    parseSnapshotBody(body: string): unknown {
      const r = parseAnirdeshApiResponseText(body);
      if (!r.ok) {
        if (r.kind === "api_error")
          throw new Error(`anirdesh_api: ${r.message}`);
        throw new Error(
          r.kind === "json" ? r.message : `anirdesh_validation: ${r.message}`,
        );
      }
      return r.data;
    },

    normalize(
      parsed: unknown,
      meta: { fetchedAt: string; sourceUrl: string; queueItem: IngestQueueItem },
    ): NormalizedKirtan {
      return anirdeshToNormalized(parsed as AnirdeshKirtanApi, {
        fetchedAt: meta.fetchedAt,
        queueItem: meta.queueItem,
      });
    },
  };
}
