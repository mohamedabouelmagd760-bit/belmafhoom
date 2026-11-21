import type { NextConfig } from "next";
const nextConfig: NextConfig = { poweredByHeader: false, experimental: { serverActions: { bodySizeLimit: "55mb" } } };
export default nextConfig;
