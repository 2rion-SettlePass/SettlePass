import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages are shipped as TypeScript source, so Next must transpile them.
  transpilePackages: [
    "@settlepass/ui",
    "@settlepass/shared",
    "@settlepass/api-contracts",
  ],
};

export default nextConfig;
