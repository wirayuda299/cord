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

      {
        protocol: "https",
        port: "",
        hostname: "i.pravatar.cc",
      },
    ]
  }
};

export default nextConfig;
