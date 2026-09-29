import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    return [
      {
        source: "/:locale/china-us-grad-market",
        destination: "/:locale/china-us-study-market",
        permanent: true,
      },
      {
        source: "/reports/china-us-grad-market.pdf",
        destination: "/reports/china-us-study-market.pdf",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
