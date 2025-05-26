// next.config.mjs
import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

const pwaConfig = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
};

export default withPWA({
  ...baseConfig,
  pwa: pwaConfig,
});
