import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is the default bundler in Next.js 16.
  // File system caching is stable in 16.1 — significantly speeds up restarts.
  experimental: {
    turbopackFileSystemCacheForDev: true,
    // React Compiler is stable in Next.js 16 (opt-in, not enabled by default)
    // reactCompiler: true,
  },
};

export default nextConfig;
