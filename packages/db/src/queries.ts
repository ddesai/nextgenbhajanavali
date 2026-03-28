import type { Prisma } from "@prisma/client";
import {
  KirtanDetailSchema,
  KirtanSummarySchema,
  type KirtanDetail,
  type KirtanSummary,
} from "@ngb/content-schema";
import { prisma } from "./client.js";

const kirtanListInclude = {
  source: { select: { slug: true, name: true } },
  audios: { select: { id: true }, take: 1 },
  texts: {
    where: { kind: "ENGLISH_TRANSLATION" as const },
    select: { id: true },
    take: 1,
  },
} satisfies Prisma.KirtanInclude;

function toSummary(row: Prisma.KirtanGetPayload<{ include: typeof kirtanListInclude }>): KirtanSummary {
  return KirtanSummarySchema.parse({
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleTransliterated: row.titleTransliterated,
    summary: row.summary,
    sourceSlug: row.source.slug,
    sourceName: row.source.name,
    hasAudio: row.audios.length > 0,
    hasEnglish: row.texts.length > 0,
  });
}

export async function searchKirtans(
  q: string,
  take = 24,
): Promise<KirtanSummary[]> {
  const trimmed = q.trim();
  if (!trimmed) {
    const rows = await prisma.kirtan.findMany({
      take,
      orderBy: { title: "asc" },
      include: kirtanListInclude,
    });
    return rows.map(toSummary);
  }

  const rows = await prisma.kirtan.findMany({
    where: {
      OR: [
        { title: { contains: trimmed, mode: "insensitive" } },
        { titleTransliterated: { contains: trimmed, mode: "insensitive" } },
        { summary: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    take,
    orderBy: { title: "asc" },
    include: kirtanListInclude,
  });
  return rows.map(toSummary);
}

export async function getKirtanBySlug(slug: string): Promise<KirtanDetail | null> {
  const row = await prisma.kirtan.findUnique({
    where: { slug },
    include: {
      source: { select: { slug: true, name: true } },
      texts: { orderBy: [{ sortOrder: "asc" }, { kind: "asc" }] },
      audios: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!row) return null;

  return KirtanDetailSchema.parse({
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleTransliterated: row.titleTransliterated,
    summary: row.summary,
    sourceSlug: row.source.slug,
    sourceName: row.source.name,
    hasAudio: row.audios.length > 0,
    hasEnglish: row.texts.some((t) => t.kind === "ENGLISH_TRANSLATION"),
    texts: row.texts.map((t) => ({
      kind: t.kind,
      content: t.content,
      locale: t.locale,
      sortOrder: t.sortOrder,
    })),
    audios: row.audios.map((a) => ({
      url: a.url,
      title: a.title,
      durationSec: a.durationSec,
      mimeType: a.mimeType,
      sortOrder: a.sortOrder,
    })),
  });
}

export async function listCollections() {
  return prisma.collection.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      _count: { select: { kirtans: true } },
    },
  });
}

export async function getCollectionBySlug(slug: string) {
  const col = await prisma.collection.findUnique({
    where: { slug },
    include: {
      kirtans: {
        orderBy: { sortOrder: "asc" },
        include: {
          kirtan: { include: kirtanListInclude },
        },
      },
    },
  });
  if (!col) return null;
  return {
    id: col.id,
    slug: col.slug,
    name: col.name,
    description: col.description,
    kirtans: col.kirtans.map((row) => ({
      sortOrder: row.sortOrder,
      kirtan: toSummary(row.kirtan),
    })),
  };
}

export async function getRelatedKirtans(kirtanId: string, take = 8) {
  const rels = await prisma.kirtanRelation.findMany({
    where: { OR: [{ fromKirtanId: kirtanId }, { toKirtanId: kirtanId }] },
    take: take * 2,
    include: {
      fromKirtan: { include: kirtanListInclude },
      toKirtan: { include: kirtanListInclude },
    },
  });

  const summaries = new Map<string, KirtanSummary>();
  for (const r of rels) {
    const a = r.fromKirtanId === kirtanId ? r.toKirtan : r.fromKirtan;
    if (a.id !== kirtanId) summaries.set(a.id, toSummary(a));
    if (summaries.size >= take) break;
  }
  return [...summaries.values()];
}
