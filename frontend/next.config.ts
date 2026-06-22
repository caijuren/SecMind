import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  async redirects() {
    return [
      {
        source: "/dashboard-hub",
        destination: "/dashboard",
        permanent: true,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "echarts",
      "zrender",
      "@xyflow/react",
      "@radix-ui/react-icons",
      "@radix-ui/react-slot",
      "date-fns",
      "lodash",
      "class-variance-authority",
    ],
  },
  headers: async () => {
    const isDev = process.env.NODE_ENV === "development";
    return [
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: isDev
              ? "public, max-age=0, must-revalidate"
              : "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
