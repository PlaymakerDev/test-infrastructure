import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Seamless-deploy support: build writes to NEXT_DIST_DIR (e.g. .next.staging)
  // while the running server keeps serving from .next; deploy script then
  // atomically renames staging → .next and restarts. Falls back to default
  // .next in dev / when the env var is unset.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  reactCompiler: true,
  devIndicators: false,
  allowedDevOrigins: ["10.10.0.106", "localhost"],
  poweredByHeader: false,
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
