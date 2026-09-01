/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bsb-beton.ru',
      },
      {
        protocol: 'http',
        hostname: 'bsb-beton.ru',
      },
    ],
  },
};

module.exports = nextConfig;
