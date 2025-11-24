// next.config.js
/** @type {import('next').NextConfig} */

const isProduction = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizeCss: true,
  },
  productionBrowserSourceMaps: false,
  // Добавляем настройки для Vercel
  images: {
    domains: [],
    unoptimized: true, // Для статического экспорта
  },
};

// Применяем PWA только в production и если next-pwa установлен
if (isProduction && require.resolve('next-pwa')) {
  try {
    const withPWA = require('next-pwa')({
      dest: 'public',
      register: true,
      skipWaiting: true,
      runtimeCaching: [
        {
          urlPattern: /\/_next\/image/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'next-image',
            expiration: {
              maxEntries: 64,
              maxAgeSeconds: 24 * 60 * 60,
            },
          },
        },
        {
          urlPattern: /\/_next\/static/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'next-static',
            expiration: {
              maxEntries: 64,
              maxAgeSeconds: 24 * 60 * 60 * 365,
            },
          },
        },
      ],
      buildExcludes: [
        /middleware-manifest\.json$/,
        /_middleware\.js$/,
        /middleware\.js\.map$/,
        /dynamic-css-manifest\.json$/,
      ],
    });
    
    module.exports = withPWA(nextConfig);
  } catch (error) {
    console.log('PWA not available, using default config');
    module.exports = nextConfig;
  }
} else {
  module.exports = nextConfig;
}