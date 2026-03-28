import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(__dirname, "..", "..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: ["@ngb/ui"],
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ["@ngb/ui"],
  },
};

export default nextConfig;
