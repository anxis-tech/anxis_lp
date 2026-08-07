import { execSync } from 'child_process';

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.2.14", "localhost:3000", "localhost:3001"],

  // Server Actions encryption key for self-hosted deployments.
  // Without a stable key, Next.js generates a new one on every `next build`,
  // causing "Failed to find Server Action" errors when users have the panel open
  // across a new deployment (deployment skew).
  // Set NEXT_SERVER_ACTIONS_ENCRYPTION_KEY in your hosting environment
  // (Hostinger env vars panel) before running `next build`.
  // Generate with: openssl rand -base64 32
  // See: https://nextjs.org/docs/app/getting-started/deploying#server-actions
  ...(process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY && {
    serverActionsEncryptionKey: process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY,
  }),

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.svgporn.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },

  // Prevent browser/CDN from caching the admin HTML.
  // The admin panel uses Server Actions and auth — stale HTML from a previous
  // build will cause "Failed to find Server Action" errors after a new deploy.
  async headers() {
    return [
      {
        source: "/admin",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
      {
        source: "/admin/login",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
    ];
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
