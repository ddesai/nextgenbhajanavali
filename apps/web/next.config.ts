import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ngb/ui"],
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ["@ngb/ui"],
  },
};

export default nextConfig;
