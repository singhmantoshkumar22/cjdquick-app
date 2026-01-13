/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@cjdquick/ui", "@cjdquick/database", "@cjdquick/types"],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
