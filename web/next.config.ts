import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', '@/components/ui'],
  },
  // Optimize images and fonts
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
