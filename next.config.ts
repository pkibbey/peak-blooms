import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // Increased for AI-generated image uploads
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pixabay.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**",
      },
    ],
  },
}

export default nextConfig
