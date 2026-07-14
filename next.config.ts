import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serve the whole app under a sub-path in prod (e.g. /atlas) via
  // NEXT_PUBLIC_BASE_PATH. Unset in dev → app at root. Next prefixes
  // routes/API/assets/links with this and exposes it as
  // process.env.__NEXT_ROUTER_BASEPATH for raw fetch/axios calls.
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
