/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      // ビルド時のESLintエラーを完全に無視
      ignoreDuringBuilds: true,
    },
    typescript: {
      // ビルド時のTypeScriptエラーも無視
      ignoreBuildErrors: true,
    },
    experimental: {
      // 追加の設定
      typedRoutes: false,
    },
  }
  
  module.exports = nextConfig