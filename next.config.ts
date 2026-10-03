import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    return [
      // edu.jytech.us is the canonical domain; the second Vercel project
      // (jyedu) builds the same repo, so send its alias there.
      {
        source: "/:path*",
        has: [{ type: "host", value: "jyedu.vercel.app" }],
        destination: "https://edu.jytech.us/:path*",
        permanent: true,
      },
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
