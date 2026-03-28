import { prisma } from "@ngb/db";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  const staticPaths = ["", "/kirtans", "/search", "/collections"];

  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));

  if (!process.env.DATABASE_URL) {
    return staticRoutes;
  }

  try {
    const [kirtans, collections] = await Promise.all([
      prisma.kirtan.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.collection.findMany({ select: { slug: true, updatedAt: true } }),
    ]);

    const kirtanRoutes: MetadataRoute.Sitemap = kirtans.map((k) => ({
      url: `${base}/kirtans/${k.slug}`,
      lastModified: k.updatedAt,
    }));

    const collectionRoutes: MetadataRoute.Sitemap = collections.map((c) => ({
      url: `${base}/collections/${c.slug}`,
      lastModified: c.updatedAt,
    }));

    return [...staticRoutes, ...kirtanRoutes, ...collectionRoutes];
  } catch {
    return staticRoutes;
  }
}
