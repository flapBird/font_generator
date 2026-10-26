 import type { NextConfig } from "next";
 
const nextConfig: NextConfig = {
  trailingSlash: false,
  turbopack: {},
  // HTTPS tunnels forward to localhost; allow only the configured app host.
  allowedDevOrigins: process.env.AI_FONT_APP_URL
    ? [new URL(process.env.AI_FONT_APP_URL).hostname]
    : [],
  async redirects() {
    return [
      { source: '/x-font-generator', destination: '/twitter-font-generator', statusCode: 301 },
      {
        source: '/style',
        destination: '/styles',
        statusCode: 301,
      },
      {
        source: '/style/:slug',
        destination: '/:slug',
        statusCode: 301,
      },
      {
        source: '/styles/:slug',
        destination: '/:slug',
        statusCode: 301,
      },
      {
        source: '/fandom/:slug',
        destination: '/:slug',
        statusCode: 301,
      },
    ];
  },
};
 
 export default nextConfig;
