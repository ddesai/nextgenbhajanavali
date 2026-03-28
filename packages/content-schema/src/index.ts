import { z } from "zod";

/**
 * Cross-package content contracts. UI and ingestion both depend on this —
 * the database layer maps Prisma rows ↔ these shapes without the web app
 * importing crawler/parser code.
 */
export const SourceTypeSchema = z.enum(["MANUAL", "CRAWLER", "API", "IMPORT"]);
export type SourceType = z.infer<typeof SourceTypeSchema>;

export const KirtanTextKindSchema = z.enum([
  "GUJARATI_LYRICS",
  "TRANSLITERATION",
  "ENGLISH_TRANSLATION",
]);
export type KirtanTextKind = z.infer<typeof KirtanTextKindSchema>;

export const SourceUpsertSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  description: z.string().optional(),
  baseUrl: z.string().url().optional(),
  type: SourceTypeSchema.default("MANUAL"),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type SourceUpsert = z.infer<typeof SourceUpsertSchema>;

export const KirtanUpsertSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  titleTransliterated: z.string().optional(),
  summary: z.string().optional(),
  externalId: z.string().optional(),
  publishedAt: z.coerce.date().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type KirtanUpsert = z.infer<typeof KirtanUpsertSchema>;

export const KirtanTextUpsertSchema = z.object({
  kind: KirtanTextKindSchema,
  content: z.string().min(1),
  locale: z.string().optional(),
  sortOrder: z.number().int().default(0),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type KirtanTextUpsert = z.infer<typeof KirtanTextUpsertSchema>;

export const KirtanAudioUpsertSchema = z.object({
  url: z.string().url(),
  mimeType: z.string().optional(),
  durationSec: z.number().int().positive().optional(),
  title: z.string().optional(),
  sortOrder: z.number().int().default(0),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type KirtanAudioUpsert = z.infer<typeof KirtanAudioUpsertSchema>;

export const CollectionUpsertSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  description: z.string().optional(),
  sortOrder: z.number().int().default(0),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type CollectionUpsert = z.infer<typeof CollectionUpsertSchema>;

export const KirtanRelationUpsertSchema = z.object({
  fromExternalId: z.string().min(1),
  toExternalId: z.string().min(1),
  relationType: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type KirtanRelationUpsert = z.infer<typeof KirtanRelationUpsertSchema>;

/** Line-oriented payload consumed by `tools/sync` (and produced by parsers). */
export const IngestRecordSchema = z.object({
  source: SourceUpsertSchema,
  kirtan: KirtanUpsertSchema,
  texts: z.array(KirtanTextUpsertSchema).default([]),
  audios: z.array(KirtanAudioUpsertSchema).default([]),
});
export type IngestRecord = z.infer<typeof IngestRecordSchema>;

/** Serialized kirtan for listing cards (no heavy text bodies). */
export const KirtanSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  titleTransliterated: z.string().nullable(),
  summary: z.string().nullable(),
  sourceSlug: z.string(),
  sourceName: z.string(),
  hasAudio: z.boolean(),
  hasEnglish: z.boolean(),
  categoryEnglish: z.string().nullable().optional(),
  /** Higher = more “popular” for default ordering when filter active. */
  popularScore: z.number().int().optional(),
});
export type KirtanSummary = z.infer<typeof KirtanSummarySchema>;

/** Search listing row with optional snippet (PostgreSQL `ts_headline` with U+E000/U+E001 marks). */
export const KirtanSearchHitSchema = KirtanSummarySchema.extend({
  snippet: z.string().optional(),
});
export type KirtanSearchHit = z.infer<typeof KirtanSearchHitSchema>;

/** Full detail view: texts + optional audio. */
export const KirtanDetailSchema = KirtanSummarySchema.extend({
  texts: z.array(
    z.object({
      kind: KirtanTextKindSchema,
      content: z.string(),
      locale: z.string().nullable(),
      sortOrder: z.number().int(),
    }),
  ),
  audios: z.array(
    z.object({
      url: z.string(),
      title: z.string().nullable(),
      durationSec: z.number().nullable(),
      mimeType: z.string().nullable(),
      sortOrder: z.number().int(),
    }),
  ),
  /** Raw metadata subset for the Info tab (ingest fields, raag, etc.). */
  info: z
    .object({
      categoryGujarati: z.string().nullable().optional(),
      categoryEnglish: z.string().nullable().optional(),
      raagGujarati: z.string().nullable().optional(),
      raagEnglish: z.string().nullable().optional(),
      author: z.string().nullable().optional(),
      authorLatin: z.string().nullable().optional(),
      sourceKey: z.string().nullable().optional(),
      /** Same as DB `Kirtan.externalId` / ingest `NormalizedKirtan.canonicalContentId` when set. */
      externalId: z.string().nullable().optional(),
    })
    .optional(),
});
export type KirtanDetail = z.infer<typeof KirtanDetailSchema>;

// --- Swaminarayan / multi-source ingest (normalized before DB mapping) ---

export const NormalizedKirtanAvailabilitySchema = z.object({
  hasGujaratiLyrics: z.boolean(),
  hasTransliteration: z.boolean(),
  hasEnglishTranslation: z.boolean(),
  hasAudio: z.boolean(),
  hasVideo: z.boolean(),
});
export type NormalizedKirtanAvailability = z.infer<
  typeof NormalizedKirtanAvailabilitySchema
>;

/**
 * Canonical per-kirtan shape after **crawl + parse + adapter-specific cleanup**.
 *
 * This record is **source-agnostic**: upstream sites map into this shape via a
 * registered `SourceAdapter`. The website and DB only depend on `IngestRecord`
 * (or DB projections), never on raw vendor JSON.
 */
export const NormalizedKirtanSchema = z.object({
  adapterId: z.string().min(1),
  sourceUrl: z.string().url(),
  sourceKey: z.string().min(1),
  checksumSha256: z.string().length(64),
  part: z.number().int().positive().optional(),
  number: z.number().int().positive().optional(),
  titleGujarati: z.string().min(1),
  titleLatin: z.string().optional(),
  author: z.string().optional(),
  authorLatin: z.string().optional(),
  categoryGujarati: z.string().optional(),
  categoryEnglish: z.string().optional(),
  raagGujarati: z.string().optional(),
  raagEnglish: z.string().optional(),
  gujaratiLyrics: z.string().optional(),
  transliteration: z.string().optional(),
  englishTranslation: z.string().optional(),
  audioUrl: z.string().url().optional(),
  videoUrls: z.array(z.string().url()).optional(),
  availability: NormalizedKirtanAvailabilitySchema,
  /** Upstream stable id when provided (e.g. Anirdesh `kid`). */
  canonicalContentId: z.string().optional(),
  capturedAt: z.string().datetime(),
  extras: z.record(z.string(), z.unknown()).optional(),
});
export type NormalizedKirtan = z.infer<typeof NormalizedKirtanSchema>;

/** Work queue item: discovery emits these; extraction consumes them. */
export const IngestQueueItemSchema = z.object({
  adapterId: z.string().min(1),
  sourceKey: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  part: z.number().int().positive().optional(),
  no: z.number().int().positive().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});
export type IngestQueueItem = z.infer<typeof IngestQueueItemSchema>;

/** Raw JSON from Anirdesh `getkirtan.php` (success payload). */
export const AnirdeshKirtanApiSchema = z
  .object({
    id: z.number(),
    kid: z.string(),
    part: z.number(),
    no: z.number(),
    family: z.union([z.string(), z.null()]).optional(),
    title_gu: z.string(),
    title_en: z.string().optional().default(""),
    writer_gu: z.string().optional().default(""),
    writer_en: z.string().optional().default(""),
    gujarati: z.string().optional().default(""),
    english: z.string().optional().default(""),
    html_gu: z.string().optional().default(""),
    html_en: z.string().optional().default(""),
    category_gu: z.string().optional().default(""),
    category_en: z.string().optional().default(""),
    hindi: z.union([z.number(), z.boolean()]).optional(),
    raags_gu: z.string().optional().default(""),
    raags_en: z.string().optional().default(""),
    prev_no: z.union([z.number(), z.null()]).optional(),
    prev_gu: z.string().optional(),
    prev_en: z.string().optional(),
    next_no: z.union([z.number(), z.null()]).optional(),
    next_gu: z.string().optional(),
    next_en: z.string().optional(),
    is_audio: z.union([z.number(), z.boolean()]),
    audio_url: z.string().optional(),
    audio_artist: z.string().nullable().optional(),
    videos: z.array(z.string()).optional(),
    english_nd: z.string().optional(),
    translation_en: z.string().optional(),
  })
  .passthrough();

export const AnirdeshApiErrorSchema = z.object({
  error: z.literal("true"),
  message: z.string(),
});
export type AnirdeshKirtanApi = z.infer<typeof AnirdeshKirtanApiSchema>;
export type AnirdeshApiError = z.infer<typeof AnirdeshApiErrorSchema>;
