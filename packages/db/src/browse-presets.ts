/** URL slugs for /browse/[slug] — match `metadata.categoryEnglish` when set. */
export const BROWSE_CATEGORY_SLUGS = ["arti", "prarthana", "dhun"] as const;
export type BrowseCategorySlug = (typeof BROWSE_CATEGORY_SLUGS)[number];

export const BROWSE_CATEGORIES: Record<
  BrowseCategorySlug,
  { label: string; blurb: string; categoryEnglish: string }
> = {
  arti: {
    label: "Arti",
    blurb: "Āratī and sandhyā verses",
    categoryEnglish: "Arti",
  },
  prarthana: {
    label: "Prarthana",
    blurb: "Prayers and supplication",
    categoryEnglish: "Prarthana",
  },
  dhun: {
    label: "Dhun",
    blurb: "Melodic refrains for remembrance",
    categoryEnglish: "Dhun",
  },
};
