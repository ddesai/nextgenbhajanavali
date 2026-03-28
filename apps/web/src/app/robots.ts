import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/metadata";

export default function robots(): MetadataRoute.Robots {
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: origin,
  };
}
