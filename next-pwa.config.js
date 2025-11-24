module.exports = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV !== 'production',
  buildExcludes: [/middleware-manifest\.json$/, /_buildManifest\.js$/],
  
  // Дополнительные настройки для улучшения производительности
  mode: 'production',
  swSrc: undefined, // Используем сгенерированный Workbox SW
  
  runtimeCaching: [
    // 1. Статические ресурсы (JS, CSS, шрифты) - CacheFirst
    {
      urlPattern: /\.(?:js|css|woff2|woff|ttf)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 дней
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    
    // 2. Иконки PWA - CacheFirst (самая агрессивная стратегия)
    {
      urlPattern: /\/icons\/.*\.(png|jpg|jpeg|svg|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'pwa-icons',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 год
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    
    // 3. Favicon и связанные иконки - CacheFirst
    {
      urlPattern: /\/favicon\.(ico|svg|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'favicons',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 год
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    
    // 4. Apple Touch Icons - CacheFirst
    {
      urlPattern: /apple-touch-icon.*\.(png|jpg|jpeg|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'apple-icons',
        expiration: {
          maxEntries: 5,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 год
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    
    // 5. Изображения сайта - StaleWhileRevalidate (баланс между скоростью и актуальностью)
    {
      urlPattern: /\.(png|jpg|jpeg|svg|webp|gif|avif)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 дней
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    
    // 6. API запросы - NetworkFirst (приоритет свежим данным)
    {
      urlPattern: /\/api\//,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 минут
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    
    // 7. Страницы Next.js - NetworkFirst для HTML
    {
      urlPattern: /\/(_next\/data\/.*\.json|\?.*$|$)/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'next-data',
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 24 * 60 * 60, // 24 часа
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
  
  // Дополнительные опции для улучшения PWA
  clientsClaim: true,
  sourcemap: false,
  dynamicStartUrl: true,
  navigateFallback: null,
  
  // Manifest трансформации (опционально)
  manifestTransforms: [
    async (manifest) => {
      // Добавляем дополнительные метаданные если нужно
      return manifest;
    }
  ]
};