import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,

  // pdf-parse uses dynamic requires that must stay as runtime externals
  serverExternalPackages: ["pdf-parse"],

  webpack: (config, { isServer }) => {
    if (isServer) {
      const existing = Array.isArray(config.externals) ? config.externals : [];
      config.externals = [...existing, "pdf-parse"];
    }
    return config;
  },
};

export default nextConfig;
