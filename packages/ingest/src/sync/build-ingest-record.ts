import type {
  IngestRecord,
  NormalizedKirtan,
  SourceUpsert,
} from "@ngb/content-schema";

/**
 * Source-agnostic mapping from `NormalizedKirtan` → `IngestRecord`.
 * Slug / externalId / `SourceUpsert` come from adapter registry + config files.
 */
export function buildIngestRecordFromNormalized(
  n: NormalizedKirtan,
  source: SourceUpsert,
  slug: string,
  externalId: string,
): IngestRecord {
  const summaryParts = [
    n.categoryEnglish && `Category: ${n.categoryEnglish}`,
    n.authorLatin && `Author: ${n.authorLatin}`,
    n.raagEnglish && `Raag: ${n.raagEnglish}`,
  ].filter(Boolean);

  const texts: IngestRecord["texts"] = [];
  let order = 0;
  if (n.gujaratiLyrics)
    texts.push({
      kind: "GUJARATI_LYRICS",
      content: n.gujaratiLyrics,
      locale: "gu",
      sortOrder: order++,
      metadata: {},
    });
  if (n.transliteration)
    texts.push({
      kind: "TRANSLITERATION",
      content: n.transliteration,
      locale: "gu-Latn",
      sortOrder: order++,
      metadata: {},
    });
  if (n.englishTranslation)
    texts.push({
      kind: "ENGLISH_TRANSLATION",
      content: n.englishTranslation,
      locale: "en",
      sortOrder: order++,
      metadata: {},
    });

  const audios: IngestRecord["audios"] = [];
  if (n.audioUrl && n.availability.hasAudio) {
    audios.push({
      url: n.audioUrl,
      mimeType: "audio/mpeg",
      sortOrder: 0,
      title: n.titleLatin ?? undefined,
      metadata: {},
    });
  }

  return {
    source,
    kirtan: {
      slug,
      title: n.titleGujarati,
      titleTransliterated: n.titleLatin,
      summary: summaryParts.length ? summaryParts.join(" · ") : undefined,
      externalId,
      metadata: {
        sourceKey: n.sourceKey,
        sourceUrl: n.sourceUrl,
        checksumSha256: n.checksumSha256,
        canonicalContentId: n.canonicalContentId,
        adapterId: n.adapterId,
        part: n.part,
        number: n.number,
        categoryGujarati: n.categoryGujarati,
        categoryEnglish: n.categoryEnglish,
        raagGujarati: n.raagGujarati,
        raagEnglish: n.raagEnglish,
        author: n.author,
        authorLatin: n.authorLatin,
        availability: n.availability,
        videoUrls: n.videoUrls,
        extras: n.extras,
      },
    },
    texts,
    audios,
  };
}
