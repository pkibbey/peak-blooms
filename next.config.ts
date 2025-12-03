import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  images: {
    remotePatterns: [new URL("https://**.public.blob.vercel-storage.com/**")],
  },
}

export default nextConfig
