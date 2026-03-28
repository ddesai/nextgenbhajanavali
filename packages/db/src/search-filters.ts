import type { Prisma } from "@prisma/client";

import type { SearchSort } from "./search-engine.js";

export type KirtanListFilters = {
  q?: string;
  hasAudio?: boolean;
  hasEnglish?: boolean;
  /** `arti` | `prarthana` | `dhun` | `popular` */
  chip?: string;
  /** Substring match on `metadata.author` / `metadata.authorLatin`. */
  author?: string;
  /** Substring on `metadata.categoryEnglish` / `metadata.categoryGujarati`. */
  category?: string;
  /** Substring on `metadata.raagEnglish` / `metadata.raagGujarati`. */
  raag?: string;
  sort?: SearchSort;
  take?: number;
  skip?: number;
};

export function buildKirtanWhere(
  filters: KirtanListFilters,
): Prisma.KirtanWhereInput {
  const and: Prisma.KirtanWhereInput[] = [];

  const q = filters.q?.trim();
  if (q) {
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { titleTransliterated: { contains: q, mode: "insensitive" } },
        { summary: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (filters.hasAudio) {
    and.push({ audios: { some: {} } });
  }

  if (filters.hasEnglish) {
    and.push({
      texts: { some: { kind: "ENGLISH_TRANSLATION" } },
    });
  }

  const chip = filters.chip?.toLowerCase();
  if (chip === "arti") {
    and.push({
      OR: [
        {
          metadata: {
            path: ["categoryEnglish"],
            equals: "Arti",
          },
        },
        { title: { contains: "આરતી", mode: "insensitive" } },
        { summary: { contains: "arti", mode: "insensitive" } },
      ],
    });
  } else if (chip === "prarthana") {
    and.push({
      OR: [
        {
          metadata: {
            path: ["categoryEnglish"],
            equals: "Prarthana",
          },
        },
        { summary: { contains: "Prarthana", mode: "insensitive" } },
      ],
    });
  } else if (chip === "dhun") {
    and.push({
      OR: [
        {
          metadata: {
            path: ["categoryEnglish"],
            equals: "Dhun",
          },
        },
        { summary: { contains: "Dhun", mode: "insensitive" } },
      ],
    });
  }

  if (and.length === 0) return {};
  return { AND: and };
}
