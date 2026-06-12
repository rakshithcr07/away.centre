import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
    NEXT_PUBLIC_API_KEY: process.env.NEXT_PUBLIC_API_KEY ?? 'dev-api-key',
  },
};

export default nextConfig;
