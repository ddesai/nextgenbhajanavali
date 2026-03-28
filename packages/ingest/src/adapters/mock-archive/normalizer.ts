import type { IngestQueueItem, NormalizedKirtan } from "@ngb/content-schema";
import { NormalizedKirtanSchema } from "@ngb/content-schema";
import { sha256Hex } from "../../core/checksum.js";
import { MOCK_ARCHIVE_ADAPTER_ID } from "./config.js";
import type { MockArchiveSnapshot } from "./parse-snapshot.js";

export function mockArchiveQueueItem(key: string, ordinal: number): IngestQueueItem {
  return {
    adapterId: MOCK_ARCHIVE_ADAPTER_ID,
    sourceKey: `${MOCK_ARCHIVE_ADAPTER_ID}:${key}`,
    sourceUrl: `https://example.invalid/mock-archive/${encodeURIComponent(key)}`,
    meta: { key, ordinal },
  };
}

function slugifyKey(key: string): string {
  const s = key
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.length > 0 ? s : "item";
}

export function resolveMockArchiveIngestIds(n: NormalizedKirtan): {
  slug: string;
  externalId: string;
} {
  if (n.adapterId !== MOCK_ARCHIVE_ADAPTER_ID)
    throw new Error(`Expected ${MOCK_ARCHIVE_ADAPTER_ID}, got ${n.adapterId}`);
  const prefix = `${MOCK_ARCHIVE_ADAPTER_ID}:`;
  const key = n.sourceKey.startsWith(prefix)
    ? n.sourceKey.slice(prefix.length)
    : (n.canonicalContentId ?? "item");
  return { slug: `mock-${slugifyKey(key)}`, externalId: n.sourceKey };
}

export function mockSnapshotToNormalized(
  snap: MockArchiveSnapshot,
  ctx: { fetchedAt: string; queueItem: IngestQueueItem },
): NormalizedKirtan {
  const checksumSha256 = sha256Hex(
    JSON.stringify({
      key: snap.key,
      titleGujarati: snap.titleGujarati,
      gu: snap.gujaratiLyrics ?? "",
      tr: snap.transliteration ?? "",
      en: snap.englishTranslation ?? "",
    }),
  );

  const gu = snap.gujaratiLyrics?.trim();
  const tr = snap.transliteration?.trim();
  const en = snap.englishTranslation?.trim();

  const draft = {
    adapterId: MOCK_ARCHIVE_ADAPTER_ID,
    sourceUrl: ctx.queueItem.sourceUrl ?? `https://example.invalid/mock-archive/${snap.key}`,
    sourceKey: ctx.queueItem.sourceKey,
    checksumSha256,
    titleGujarati: snap.titleGujarati,
    titleLatin: snap.titleLatin,
    gujaratiLyrics: gu || undefined,
    transliteration: tr || undefined,
    englishTranslation: en || undefined,
    availability: {
      hasGujaratiLyrics: !!gu,
      hasTransliteration: !!tr,
      hasEnglishTranslation: !!en,
      hasAudio: false,
      hasVideo: false,
    },
    canonicalContentId: snap.key,
    capturedAt: ctx.fetchedAt,
    extras: { mockKey: snap.key },
  };

  return NormalizedKirtanSchema.parse(draft);
}
