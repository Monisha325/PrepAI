import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,

  // Treat native addons as external so they're not bundled by webpack
  serverExternalPackages: ["better-sqlite3", "pdf-parse"],

  // Suppress the pdf-parse test file warning from webpack
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals ?? []), "better-sqlite3", "pdf-parse"];
    }
    return config;
  },
};

export default nextConfig;
