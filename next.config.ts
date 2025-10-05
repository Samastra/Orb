import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Google Books
      {
        protocol: 'https',
        hostname: 'books.google.com',
      },
      // YouTube
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      // Freepik
      {
        protocol: 'https',
        hostname: 'freepik.com',
      },
      {
        protocol: 'https',
        hostname: 'api.freepik.com',
      },
      {
        protocol: 'https',
        hostname: 'img.freepik.com',
      },
      // Wikipedia
      {
        protocol: 'https',
        hostname: 'wikipedia.org',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      // Clerk
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      // Generic patterns
      {
        protocol: 'https',
        hostname: '**.google.com',
      },
      {
        protocol: 'https',
        hostname: '**.ytimg.com',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "konva/node": false,
      "canvas": false,
    };
    return config;
  },
};

export default nextConfig;