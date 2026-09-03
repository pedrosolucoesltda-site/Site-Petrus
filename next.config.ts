import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Lint is available via `npm run lint`; don't block production builds on it.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
