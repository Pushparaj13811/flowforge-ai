import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Run ESLint separately via `npm run lint` (avoids deprecated next lint)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Skip type checking during build (do it locally instead)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Memory optimizations for builds
  experimental: {
    webpackMemoryOptimizations: true,
  },
  // Stub optional peer deps from @standard-community/standard-json
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      effect: false,
      sury: false,
      "@valibot/to-json-schema": false,
    };
    return config;
  },
};

export default nextConfig;