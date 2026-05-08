import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lost-and-found-images.nandanvarma.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
