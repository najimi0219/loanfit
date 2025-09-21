/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      // ビルド時のESLintエラーを無視
      ignoreDuringBuilds: true,
    },
    typescript: {
      // ビルド時のTypeScriptエラーを無視（必要に応じて）
      ignoreBuildErrors: false,
    },
  }
  
  module.exports = nextConfig