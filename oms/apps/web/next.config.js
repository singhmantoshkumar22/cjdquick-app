/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pdfkit", "fontkit", "linebreak", "png-js"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
