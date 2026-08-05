import { execSync } from 'child_process';

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.2.14", "localhost:3000", "localhost:3001"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.svgporn.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  generateBuildId: async () => {
    try {
      const commitHash = execSync('git rev-parse --short HEAD').toString().trim();
      return commitHash;
    } catch {
      return `build-${Date.now()}`;
    }
  },
};

export default nextConfig;
