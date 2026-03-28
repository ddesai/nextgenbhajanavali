import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ngb/ui"],
  experimental: {
    optimizePackageImports: ["@ngb/ui"],
  },
};

export default nextConfig;
