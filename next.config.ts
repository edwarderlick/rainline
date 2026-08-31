// Force Vercel full build artifact refresh: 2026-08-31 17:15 UTC
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["genlayer-js", "@walletconnect/ethereum-provider"],
};

export default nextConfig;
