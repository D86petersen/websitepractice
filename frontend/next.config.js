/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone', // Enable for Docker production builds
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1",
  },
  // Enable image optimization
  images: {
    unoptimized: false,
  },
  // Compression
  compress: true,
};

module.exports = nextConfig;
