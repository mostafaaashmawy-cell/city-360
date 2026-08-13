/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Allow Coohom iframe origin
  async headers() {
    return [
      {
        source: '/',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "frame-src 'self' https://www.coohom.com https://*.coohom.com;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
