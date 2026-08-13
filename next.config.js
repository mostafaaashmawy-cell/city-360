/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export — generates plain HTML/CSS/JS in the `out/` folder
  // Cloudflare Pages serves this directly; no server or Wrangler Worker needed
  output: 'export',

  images: {
    // Required for static export — Next.js image optimisation needs a server
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;

