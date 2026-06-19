import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  basePath: '/atlas',
  assetPrefix: '/atlas',
  reactCompiler: true,
  devIndicators: false,
  typescript: { ignoreBuildErrors: true },
  redirects: () => {
    return [
      {
        source: '/',
        destination: '/auth/login',
        // destination: '/atlas/auth/login',
        permanent: false
      }
    ]
  }
};

export default nextConfig;
