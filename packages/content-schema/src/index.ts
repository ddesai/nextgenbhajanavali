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
});
export type KirtanSummary = z.infer<typeof KirtanSummarySchema>;

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
});
export type KirtanDetail = z.infer<typeof KirtanDetailSchema>;
