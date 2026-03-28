import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(__dirname, "..", "..");
/** Globs are resolved from the Next project root (`apps/web`). */
const prismaEnginesGlob =
  path
    .relative(__dirname, path.join(monorepoRoot, "packages/db/dist/generated/prisma"))
    .replace(/\\/g, "/") + "/**/*";

const nextConfig: NextConfig = {
  outputFileTracingRoot: monorepoRoot,
  /** NFT does not always follow Prisma’s dynamic engine load; force-copy `.node` binaries. */
  outputFileTracingIncludes: {
    "/*": [prismaEnginesGlob],
  },
  transpilePackages: ["@ngb/ui"],
  /** `@ngb/db` ships its own generated client + query engines under `dist/generated`. */
  serverExternalPackages: ["@ngb/db"],
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ["@ngb/ui"],
  },
};

export default nextConfig;
