import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  devIndicators: false,
  redirects: () => {
    return [
      {
        source: '/',
        destination: '/auth/login',
        permanent: false
      }
    ]
  }
};

export default nextConfig;
