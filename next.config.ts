 import type { NextConfig } from "next";
 
const nextConfig: NextConfig = {
  trailingSlash: false,
  turbopack: {},
  async redirects() {
    return [
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
