import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Serve images as static files - no CPU/bandwidth for optimization
  },
};

export default nextConfig;
