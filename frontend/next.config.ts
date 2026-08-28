import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hince.co.kr', // 허용할 크롤링 대상 도메인
      },
    ],
  },

};
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '2026portfolio.s3.ap-northeast-2.amazonaws.com', // 자신의 S3 도메인으로 변경
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
