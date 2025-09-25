import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Prevent Next.js from trying to bundle Konva's Node.js version
    config.resolve.alias = {
      ...config.resolve.alias,
      domains: ['img.clerk.com'],
      "konva/node": false, // make sure node build is ignored
      "canvas": false,     // disable native canvas package
    };
    return config;
  },
};

export default nextConfig;
