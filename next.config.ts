import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow large file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Needed for xlsx/papaparse server-side
  serverExternalPackages: ["xlsx"],
};

export default nextConfig;
