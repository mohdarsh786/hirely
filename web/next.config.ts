import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  watchOptions: {
    ignored: ['**/api/**'],
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@/components/ui',
      '@/components/doodles', 
    ],

    turbo: {
      resolveAlias: {
        canvas: './empty-module.ts',
      },
    },
  },

  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
