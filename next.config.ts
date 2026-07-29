import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "img.logo.dev" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
}

export default nextConfig
