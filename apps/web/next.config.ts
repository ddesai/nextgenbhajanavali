import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Monorepo root — required so file tracing pulls Prisma engines from pnpm’s store (`node_modules/.pnpm/...`). */
const monorepoRoot = path.join(__dirname, "..", "..");

const prismaEngineGlobs = [
  "../../node_modules/.pnpm/**/node_modules/.prisma/client/**",
  "../../node_modules/.pnpm/prisma@*/node_modules/prisma/**",
  "../../node_modules/.prisma/**",
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: monorepoRoot,
  outputFileTracingIncludes: {
    /** App Router server bundles: force-include query engines not traced through workspace `@ngb/db`. */
    "/*": prismaEngineGlobs,
    "/**": prismaEngineGlobs,
  },
  transpilePackages: ["@ngb/ui"],
  /** Do not bundle Prisma; keep `import` resolution so `.node` engine paths stay valid. */
  serverExternalPackages: ["@prisma/client", "prisma", "@ngb/db"],
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ["@ngb/ui"],
  },
};

export default nextConfig;
