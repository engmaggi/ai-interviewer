import type { NextConfig } from "next";

/** Paths owned by the backend service. On Vercel, `vercel.json` routes them; locally, these rewrites do. */
const BACKEND_PATHS = ["/api/:path*", "/auth/confirm", "/reset-password"];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) return [];

    return {
      beforeFiles: BACKEND_PATHS.map((source) => ({
        source,
        destination: `${backendUrl}${source}`,
      })),
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
