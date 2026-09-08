import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      // 1. hince 도메인
      {
        protocol: 'https',
        hostname: 'hince.co.kr', 
      },
      // 2. S3 도메인 (추가됨)
      {
        protocol: 'https',
        hostname: '2026portfolio.s3.ap-northeast-2.amazonaws.com', 
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
