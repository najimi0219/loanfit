import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ビルド時にESLintエラーを無視
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScriptエラーも無視（必要に応じて）
    ignoreBuildErrors: true,
  },
  experimental: {
    turbo: {
      // Turbopack用の設定（必要に応じて）
    }
  }
};

export default nextConfig;