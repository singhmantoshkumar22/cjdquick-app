/** @type {import('next').NextConfig} */
const nextConfig = {
  // External packages that should not be bundled on server
  serverExternalPackages: ["pdfkit", "fontkit", "linebreak", "png-js"],

  // Skip type checking during build (faster builds, types checked separately)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Output configuration for standalone deployments
  output: "standalone",
};

module.exports = nextConfig;
