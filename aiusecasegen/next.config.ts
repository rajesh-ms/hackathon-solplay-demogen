import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // API rewrites for development
  async rewrites() {
    return [
      {
        source: '/api/demogen/:path*',
        destination: 'http://localhost:3001/api/v1/:path*',
      },
    ];
  },
  // Enable webpack optimization for production builds
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;
