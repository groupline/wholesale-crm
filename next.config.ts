import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to successfully complete even if project has type errors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
