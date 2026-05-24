import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  devIndicators: false,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
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
