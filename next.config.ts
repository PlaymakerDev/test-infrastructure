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
  },
  // DEV-ONLY safety net for the ~90 hardcoded '/atlas/images/…' asset paths
  // sprinkled through maintenance/tracking/statistics components. In prod the
  // real basePath (/atlas) makes those URLs resolve naturally; in dev there is
  // no basePath, so rewrite them back to the public root instead of 404ing
  // (broken icons everywhere). New code should still build paths with
  // NEXT_PUBLIC_BASE_PATH — this only keeps legacy hardcodes working.
  rewrites: async () =>
    process.env.NEXT_PUBLIC_BASE_PATH
      ? []
      : [{ source: '/atlas/:path*', destination: '/:path*' }],
};

export default nextConfig;
