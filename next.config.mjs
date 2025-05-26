// next.config.mjs
import withPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

const withPwa = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  buildExcludes: [/middleware-manifest.json$/],
  publicExcludes: ["!noprecache/**/*"],
  fallbacks: {
    document: "/offline", // オフライン時のフォールバックページ
  },
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "https-calls",
        networkTimeoutSeconds: 15,
        expiration: {
          maxEntries: 150,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30日
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
});

export default withPwa(nextConfig);
