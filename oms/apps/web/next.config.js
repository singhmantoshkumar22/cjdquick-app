/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pdfkit", "fontkit", "linebreak", "png-js"],
  transpilePackages: ["@oms/database"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
