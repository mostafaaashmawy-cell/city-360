import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Static export — generates a plain `out/` folder
  // Perfect for Cloudflare Pages (no server needed)
  output: 'export',

  images: {
    // Static export doesn't support Next.js image optimization server
    // Use unoptimized so <Image> works with external URLs
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
