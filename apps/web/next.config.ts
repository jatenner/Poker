import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@poker/shared", "@poker/db"],
  output: "standalone",
};

export default nextConfig;
