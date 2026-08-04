import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.2.14", "localhost:3000", "localhost:3001"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.svgporn.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
