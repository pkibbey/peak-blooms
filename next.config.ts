import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  devIndicators: false,
  images: {
    remotePatterns: [new URL("https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/**")],
  },
}

export default nextConfig
