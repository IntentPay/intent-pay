/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['app.1inch.io'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'app.1inch.io',
        pathname: '/assets/images/**',
      },
    ],
  }
};

module.exports = nextConfig;
