import {
  BROWSE_CATEGORY_SLUGS,
  getSitemapKirtansAndCollections,
} from "@ngb/db";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  const staticPaths = [
    "",
    "/kirtans",
    "/search",
    "/collections",
    "/browse",
    "/about",
  ];

  const browseCategoryRoutes: MetadataRoute.Sitemap = BROWSE_CATEGORY_SLUGS.map(
    (slug) => ({
      url: `${base}/browse/${slug}`,
      lastModified: new Date(),
    }),
  );

  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));

  if (!process.env.DATABASE_URL) {
    return [...staticRoutes, ...browseCategoryRoutes];
  }

  try {
    const { kirtans, collections } = await getSitemapKirtansAndCollections();

    const kirtanRoutes: MetadataRoute.Sitemap = kirtans.map((k) => ({
      url: `${base}/kirtans/${k.slug}`,
      lastModified: k.updatedAt,
    }));

    const collectionRoutes: MetadataRoute.Sitemap = collections.map((c) => ({
      url: `${base}/collections/${c.slug}`,
      lastModified: c.updatedAt,
    }));

    return [
      ...staticRoutes,
      ...browseCategoryRoutes,
      ...kirtanRoutes,
      ...collectionRoutes,
    ];
  } catch {
    return [...staticRoutes, ...browseCategoryRoutes];
  }
}
