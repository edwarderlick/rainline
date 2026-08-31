import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["genlayer-js", "@walletconnect/ethereum-provider"],
};

export default nextConfig;
