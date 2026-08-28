import type { NextConfig } from "next";
import path from 'path'

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, './'),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
        port: "",
        pathname: "/*",
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
