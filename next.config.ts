import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  output: "standalone",
  async rewrites() {
    return [
      { source: "/millet-pasta", destination: "/products" },
      { source: "/millet-noodles", destination: "/products" },
      { source: "/millet-vermicelli", destination: "/products" },
      { source: "/millet-cookies", destination: "/products" },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "blueviolet-porpoise-268161.hostingersite.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
    ],
  },
};

export default nextConfig;

