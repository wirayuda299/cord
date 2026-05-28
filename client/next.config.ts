import type { NextConfig } from "next";
import path from 'path'

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, './'),
  },
  env: {
    LIVEKIT_URL: process.env.LIVEKIT_URL
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.imgur.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        port: "",
        hostname: "res.cloudinary.com",
      },
    ]
  }
};

export default nextConfig;
