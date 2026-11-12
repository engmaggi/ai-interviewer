import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // `pg` is a native-friendly Node driver; keep it out of the bundle.
  serverExternalPackages: ["pg"],
};

export default nextConfig;
