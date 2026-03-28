import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ngb/ui"],
  /** Keep Prisma out of the bundle so the query-engine `.node` binary is resolved at runtime on Vercel. */
  serverExternalPackages: ["@prisma/client", "prisma"],
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ["@ngb/ui"],
  },
};

export default nextConfig;
